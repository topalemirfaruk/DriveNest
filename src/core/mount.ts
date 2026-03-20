import { exec, spawn, ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { app } from 'electron';
import { getStoredTokens } from './auth';

const execAsync = promisify(exec);

export type MountStatus = 'unmounted' | 'mounting' | 'mounted' | 'error';
export type DependencyStatus = 'installed' | 'missing' | 'checking';

class MountService {
  private mountProcess: ChildProcess | null = null;
  private status: MountStatus = 'unmounted';
  private mountPath = path.join(os.homedir(), 'DriveNest-Mounted');
  private confPath = path.join(app.getPath('userData'), 'rclone_mount.conf');

  getStatus(): MountStatus {
    return this.status;
  }

  getMountPath(): string {
    return this.mountPath;
  }

  async checkDependencies(): Promise<DependencyStatus> {
    try {
      await execAsync('rclone --version');
      return 'installed';
    } catch (e) {
      return 'missing';
    }
  }

  async installDependencies(): Promise<void> {
    try {
      const script = `
        if command -v pacman >/dev/null 2>&1; then
          pacman -Sy --noconfirm rclone fuse3
        elif command -v apt-get >/dev/null 2>&1; then
          apt-get update && apt-get install -y rclone fuse3
        elif command -v dnf >/dev/null 2>&1; then
          dnf install -y rclone fuse3
        elif command -v zypper >/dev/null 2>&1; then
          zypper install -y rclone fuse3
        else
          # Fallback to official rclone install script
          curl https://rclone.org/install.sh | bash
        fi
      `;
      // Use pkexec for native GUI root prompt on arch/debian/fedora
      await execAsync(`pkexec sh -c "${script.replace(/\n/g, '; ')}"`);
    } catch (error: any) {
      throw new Error(`Failed to install dependencies: ${error.message}`);
    }
  }

  async generateConfig(): Promise<void> {
    const tokens = await getStoredTokens();
    if (!tokens) {
      throw new Error('No authentication tokens found. Please log in first.');
    }

    const tokenObj = {
      access_token: tokens.access_token,
      token_type: 'Bearer',
      refresh_token: tokens.refresh_token,
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : new Date(Date.now() + 3600000).toISOString()
    };

    const configContent = `[drivenest]
type = drive
scope = drive
client_id = ${process.env.GOOGLE_CLIENT_ID}
client_secret = ${process.env.GOOGLE_CLIENT_SECRET}
token = ${JSON.stringify(tokenObj)}
`;

    await fs.writeFile(this.confPath, configContent, { mode: 0o600 });
  }

  async mountDrive(onStatusChange?: (status: MountStatus) => void): Promise<void> {
    if (this.status === 'mounted' || this.status === 'mounting') {
      return;
    }

    this.status = 'mounting';
    onStatusChange?.(this.status);

    try {
      const deps = await this.checkDependencies();
      if (deps === 'missing') {
        throw new Error('DEPENDENCIES_MISSING');
      }

      await this.generateConfig();
      await fs.mkdir(this.mountPath, { recursive: true });

      // Unmount first just in case there's a stale mount
      await execAsync(`fusermount -u "${this.mountPath}"`).catch(() => {});

      return new Promise((resolve, reject) => {
        this.mountProcess = spawn('rclone', [
          'mount',
          'drivenest:',
          this.mountPath,
          '--config', this.confPath,
          '--vfs-cache-mode', 'full',
          '--vfs-cache-max-size', '10G',
          '--vfs-read-chunk-size', '32M',
          '--buffer-size', '64M',
          '--dir-cache-time', '1000h',
          '--poll-interval', '15s',
          '--vfs-fast-fingerprint'
        ]);

        let isReady = false;

        this.mountProcess.stdout?.on('data', (data) => console.log(`[Rclone]: ${data}`));
        this.mountProcess.stderr?.on('data', (data) => {
          console.error(`[Rclone Err]: ${data}`);
          // Rclone doesn't exit immediately on mount, we assume success after a short delay
        });

        this.mountProcess.on('close', (code) => {
          console.log(`Rclone process exited with code ${code}`);
          this.status = 'unmounted';
          this.mountProcess = null;
          onStatusChange?.(this.status);
          
          if (!isReady && code !== 0) {
            this.status = 'error';
            reject(new Error(`Mount failed with code ${code}`));
          }
        });

        // Resolve after giving rclone 2 seconds to initialize the mount
        setTimeout(() => {
          if (this.status !== 'error') {
            isReady = true;
            this.status = 'mounted';
            onStatusChange?.(this.status);
            resolve();
          }
        }, 2000);
      });

    } catch (error: any) {
      this.status = 'error';
      onStatusChange?.(this.status);
      throw error;
    }
  }

  async unmountDrive(onStatusChange?: (status: MountStatus) => void): Promise<void> {
    if (this.status === 'unmounted') return;

    try {
      await execAsync(`fusermount -u "${this.mountPath}"`);
      if (this.mountProcess) {
        this.mountProcess.kill('SIGINT');
        this.mountProcess = null;
      }
      this.status = 'unmounted';
      onStatusChange?.(this.status);
    } catch (e: any) {
      console.error('Unmount failed:', e);
      // Fallback
      if (this.mountProcess) {
        this.mountProcess.kill('SIGKILL');
        this.mountProcess = null;
      }
      this.status = 'unmounted';
      onStatusChange?.(this.status);
    }
  }
}

export const mountService = new MountService();
