// DriveNest — Electron Main Process Entry Point
import 'dotenv/config';
import { app, BrowserWindow, ipcMain, session, Tray, Menu, nativeImage, shell } from 'electron';
import path from 'node:path';
import os from 'node:os';
import { initDatabase } from './core/database';
import { registerAuthHandlers, initAuth, getStoredTokens } from './core/auth';
import { googleDriveAdapter } from './core/adapters/google-drive';
import { mountService } from './core/mount';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) app.quit();

app.name = 'DriveNest';
app.setAppUserModelId('DriveNest');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// ────────────────────────── Sync folder ──────────────────────────
const SYNC_FOLDER = path.join(os.homedir(), 'DriveNest');

// ────────────────────────── Secure Window ──────────────────────────
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'DriveNest',
    icon: app.isPackaged 
      ? path.join(process.resourcesPath, 'assets/icons/logo.png')
      : path.join(__dirname, '../../assets/icons/logo.png'),
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hidden',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Make sure we only show window when loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the renderer
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open DevTools in development (Disabled per user request)
  if (process.env.NODE_ENV === 'development' || MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    // mainWindow.webContents.openDevTools();
  }

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (tray) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER CONSOLE] ${message} (at ${sourceId}:${line})`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ────────────────────────── CSP Headers ──────────────────────────
function setupCSP(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = !!MAIN_WINDOW_VITE_DEV_SERVER_URL;
    const scriptSrc = isDev 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" 
      : "script-src 'self'";
    const defaultSrc = isDev
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "default-src 'self'";

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            defaultSrc,
            scriptSrc,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://*.googleusercontent.com https://*.google.com",
            "frame-src 'self' blob: https://*.google.com https://accounts.google.com",
            "connect-src 'self' https://www.googleapis.com https://oauth2.googleapis.com ws://localhost:* http://localhost:* wss://localhost:*",
          ].join('; '),
        ],
      },
    });
  });
}

// ────────────────────────── System Tray ──────────────────────────
function createTray(): void {
  // Load the custom logo for the tray
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets/icons/logo.png')
    : path.join(__dirname, '../../assets/icons/logo.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 22, height: 22 });
  tray = new Tray(icon);
  tray.setToolTip('DriveNest — Tüm dosyalar güncel');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'DriveNest\'i Aç',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Sync Klasörünü Aç',
      click: async () => {
        const fs = await import('node:fs/promises');
        await fs.mkdir(SYNC_FOLDER, { recursive: true });
        shell.openPath(SYNC_FOLDER);
      },
    },
    {
      label: 'Şimdi Senkronize Et',
      click: () => mainWindow?.webContents.send('sync:stateChanged', { state: 'syncing', filesInQueue: 0 }),
    },
    { type: 'separator' },
    {
      label: 'Sanal Diski Aç',
      enabled: mountService.getStatus() === 'mounted',
      click: () => {
        shell.openPath(mountService.getMountPath());
      },
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: () => {
        tray?.destroy();
        tray = null;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// ────────────────────────── IPC Handlers ──────────────────────────
function registerIPCHandlers(): void {
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getLocale', () => app.getLocale());

  ipcMain.handle('app:getStorageQuota', async () => {
    const tokens = await getStoredTokens();
    if (!tokens) return { limit: '0', usage: '0', usageInDrive: '0' };
    return await googleDriveAdapter.getStorageQuota();
  });

  ipcMain.handle('app:openSyncFolder', async () => {
    const fs = await import('node:fs/promises');
    await fs.mkdir(SYNC_FOLDER, { recursive: true });
    shell.openPath(SYNC_FOLDER);
  });

  ipcMain.handle('app:selectFolder', async () => {
    const { dialog } = await import('electron');
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('app:selectFile', async () => {
    const { dialog } = await import('electron');
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('app:openExternal', async (_event, url) => {
    if (typeof url !== 'string' || !url.startsWith('https://')) {
      console.warn('Blocked insecure external URL:', url);
      return;
    }
    const { shell } = await import('electron');
    await shell.openExternal(url);
  });

  ipcMain.handle('app:previewFile', async (_event, url) => {
    if (typeof url !== 'string' || !url.startsWith('https://')) {
      console.warn('Blocked insecure preview URL:', url);
      return;
    }
    const { BrowserWindow } = await import('electron');
    const previewWin = new BrowserWindow({
      width: 1000,
      height: 800,
      title: 'DriveNest - Önizleme',
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        partition: 'persist:google_preview',
      },
    });
    previewWin.loadURL(url);
  });

  ipcMain.handle('files:getContent', async (_event, { fileId }) => {
    const tokens = await getStoredTokens();
    if (!tokens) throw new Error('Not authenticated');
    
    const { data, mimeType } = await googleDriveAdapter.downloadFile(fileId);
    return {
      base64: data.toString('base64'),
      mimeType
    };
  });

  ipcMain.handle('app:selectSavePath', async (_event, defaultName) => {
    const { dialog } = await import('electron');
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: defaultName,
    });
    return result.filePath || null;
  });

  ipcMain.handle('files:list', async (_event, args) => {
    const tokens = await getStoredTokens();
    if (!tokens) return { items: [], nextPageToken: undefined };
    
    return await googleDriveAdapter.listFiles(
      args?.folderId || 'root', 
      args?.pageSize, 
      args?.pageToken,
      args?.section || 'my-drive'
    );
  });

  ipcMain.handle('files:upload', async (_event, { localPath, parentId }) => {
    const tokens = await getStoredTokens();
    if (!tokens) throw new Error('Not authenticated');
    
    const uploadedFile = await googleDriveAdapter.uploadFile(localPath, parentId, (percent) => {
      mainWindow?.webContents.send('sync:progress', { 
        file: path.basename(localPath), 
        percent, 
        speed: 0 // Speed calculation could be added later if needed
      });
    });
    return {
      id: uploadedFile.id,
      name: uploadedFile.name,
      mimeType: uploadedFile.mimeType,
      size: uploadedFile.size || 0,
      modifiedTime: uploadedFile.modifiedTime || new Date().toISOString(),
      parentId: parentId,
      isFolder: uploadedFile.mimeType === 'application/vnd.google-apps.folder',
      shared: false,
      starred: uploadedFile.starred || false,
    };
  });

  ipcMain.handle('files:createFolder', async (_event, { name, parentId }) => {
    const tokens = await getStoredTokens();
    if (!tokens) throw new Error('Not authenticated');
    
    return await googleDriveAdapter.createFolder(name, parentId);
  });

  ipcMain.handle('files:delete', async (_event, { fileId }) => {
    const tokens = await getStoredTokens();
    if (!tokens) throw new Error('Not authenticated');
    
    await googleDriveAdapter.deleteFile(fileId);
  });

  ipcMain.handle('files:restore', async (_event, { fileId }) => {
    const tokens = await getStoredTokens();
    if (!tokens) throw new Error('Not authenticated');
    
    await googleDriveAdapter.restoreFile(fileId);
  });

  ipcMain.handle('files:deletePermanently', async (_event, { fileId }) => {
    const tokens = await getStoredTokens();
    if (!tokens) throw new Error('Not authenticated');
    
    await googleDriveAdapter.deleteFilePermanently(fileId);
  });

  ipcMain.handle('files:toggleStar', async (_event, { fileId, starred }) => {
    const tokens = await getStoredTokens();
    if (!tokens) throw new Error('Not authenticated');
    
    await googleDriveAdapter.toggleStar(fileId, starred);
  });

  ipcMain.handle('files:download', async (_event, { fileId, destPath }) => {
    const tokens = await getStoredTokens();
    if (!tokens) throw new Error('Not authenticated');

    // Basic Path Validation: Ensure it's not a hidden system file or sensitive directory
    const normalizedPath = path.normalize(destPath);
    const isSystemPath = normalizedPath.startsWith('/etc') || 
                         normalizedPath.startsWith('/bin') || 
                         normalizedPath.startsWith('/usr') ||
                         normalizedPath.startsWith('/root') ||
                         normalizedPath.includes('/.ssh') ||
                         normalizedPath.includes('/.bashrc');
    
    if (isSystemPath) {
      throw new Error('Insecure download path blocked.');
    }
    
    await googleDriveAdapter.downloadFileToPath(fileId, destPath, (percent) => {
      mainWindow?.webContents.send('sync:progress', { 
        file: path.basename(destPath), 
        percent, 
        speed: 0
      });
    });
  });

  // Sync handlers (placeholders)
  ipcMain.handle('sync:status', () => ({
    state: 'idle' as const,
    filesInQueue: 0,
  }));

  ipcMain.handle('sync:stop', () => {});

  // Window controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    mainWindow?.maximize();
  });

  ipcMain.handle('window:unmaximize', () => {
    mainWindow?.unmaximize();
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() || false;
  });

  // Mount Feature Handlers
  ipcMain.handle('mount:status', () => mountService.getStatus());
  ipcMain.handle('mount:check', () => mountService.checkDependencies());
  ipcMain.handle('mount:install', async () => mountService.installDependencies());
  ipcMain.handle('mount:start', async () => {
    await mountService.mountDrive((status) => {
      mainWindow?.webContents.send('mount:statusChanged', status);
    });
  });
  ipcMain.handle('mount:stop', async () => {
    await mountService.unmountDrive((status) => {
      mainWindow?.webContents.send('mount:statusChanged', status);
    });
  });
  ipcMain.handle('mount:openFolder', async () => {
    const { shell } = await import('electron');
    shell.openPath(mountService.getMountPath());
  });
}

// ────────────────────────── App Lifecycle ──────────────────────────
app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  initDatabase();
  const isLoggedIn = await initAuth();
  
  if (isLoggedIn) {
     // Automount drive in background
     mountService.mountDrive().catch(e => console.error('Automount failed:', e));
  }

  setupCSP();
  registerIPCHandlers();
  registerAuthHandlers();
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // On Linux, keep running if tray exists
  if (!tray) {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.show();
  }
});

let isQuitting = false;
app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    isQuitting = true;
    
    if (mountService.getStatus() === 'mounted' || mountService.getStatus() === 'mounting') {
      console.log('Unmounting virtual disk before exit...');
      try {
        await mountService.unmountDrive();
      } catch(e) { console.error('Error during shutdown unmount:', e); }
    }
    
    app.quit();
  }
});

// Vite dev server URL declarations
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
