import { google, drive_v3 } from 'googleapis';
import { getOAuth2Client } from '../auth';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  parents?: string[];
  md5Checksum?: string;
  starred?: boolean;
}

export class GoogleDriveAdapter {
  private _drive: drive_v3.Drive | null = null;

  private get drive(): drive_v3.Drive {
    if (!this._drive) {
      this._drive = google.drive({ version: 'v3', auth: getOAuth2Client() });
    }
    return this._drive;
  }

  /**
   * Lists files from Google Drive.
   */
  async listFiles(folderId = 'root', pageSize = 100, pageToken?: string, section: string = 'my-drive'): Promise<{ items: DriveFile[], nextPageToken?: string }> {
    try {
      let q = `'${folderId}' in parents and trashed = false`;
      let orderBy = 'folder,name,modifiedTime desc';

      if (section === 'trash') {
        q = 'trashed = true';
      } else if (section === 'starred') {
        q = 'starred = true and trashed = false';
      } else if (section === 'shared') {
        q = 'sharedWithMe = true and trashed = false';
      } else if (section === 'recent') {
        q = 'trashed = false';
        orderBy = 'viewedByMeTime desc,modifiedTime desc';
      }

      const res = await this.drive.files.list({
        pageSize,
        pageToken,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, parents, md5Checksum, webViewLink, starred)',
        q,
        orderBy,
      });

      return {
        items: (res.data.files as any[]).map(f => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: parseInt(f.size || '0', 10),
          modifiedTime: f.modifiedTime,
          webViewLink: f.webViewLink,
          starred: f.starred,
          parents: f.parents,
          md5Checksum: f.md5Checksum,
        })),
        nextPageToken: res.data.nextPageToken || undefined,
      };
    } catch (err) {
      console.error('Google Drive listing error:', err);
      throw err;
    }
  }

  /**
   * Gets specific file metadata.
   */
  async getFileMetadata(fileId: string): Promise<DriveFile> {
    try {
      const res = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, modifiedTime, parents, md5Checksum, webViewLink, starred',
      });
      return res.data as DriveFile;
    } catch (err) {
      console.error('Google Drive get metadata error:', err);
      throw err;
    }
  }

  /**
   * Downloads a file content (placeholder for sync implementation).
   */
  /**
   * Downloads a file content as a Buffer. 
   * Handles Google Workspace files by exporting them to PDF.
   */
  async downloadFile(fileId: string): Promise<{ data: Buffer; mimeType: string }> {
    try {
      const file = await this.getFileMetadata(fileId);
      const isGoogleType = file.mimeType?.startsWith('application/vnd.google-apps.');
      
      let res;
      let targetMimeType = file.mimeType;

      if (isGoogleType && file.mimeType !== 'application/vnd.google-apps.folder') {
        // For Google Docs/Sheets/Slides, we export to PDF for preview
        targetMimeType = 'application/pdf';
        res = await this.drive.files.export(
          { fileId, mimeType: targetMimeType },
          { responseType: 'arraybuffer' }
        );
      } else {
        // For regular files
        res = await this.drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'arraybuffer' }
        );
      }
      
      return {
        data: Buffer.from(res.data as ArrayBuffer),
        mimeType: targetMimeType || 'application/octet-stream'
      };
    } catch (err) {
      console.error('Google Drive downloadFile error:', err);
      throw err;
    }
  }

  /**
   * Downloads a file to a specific local path.
   */
  async downloadFileToPath(fileId: string, destPath: string, onProgress?: (percent: number) => void): Promise<void> {
    const fs = await import('node:fs');
    try {
      const file = await this.getFileMetadata(fileId);
      const isGoogleType = file.mimeType?.startsWith('application/vnd.google-apps.');
      const totalSize = Number(file.size || 0);
      
      let res;
      if (isGoogleType && file.mimeType !== 'application/vnd.google-apps.folder') {
        let mimeType = 'application/pdf';
        if (file.mimeType === 'application/vnd.google-apps.document') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (file.mimeType === 'application/vnd.google-apps.spreadsheet') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        if (file.mimeType === 'application/vnd.google-apps.presentation') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

        res = await this.drive.files.export(
          { fileId, mimeType },
          { responseType: 'stream' }
        );
      } else {
        res = await this.drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'stream' }
        );
      }
      
      let downloadedSize = 0;
      const dest = fs.createWriteStream(destPath);
      
      return new Promise((resolve, reject) => {
        res.data
          .on('data', (chunk: Buffer) => {
            downloadedSize += chunk.length;
            if (onProgress && totalSize > 0) {
              onProgress(Math.round((downloadedSize / totalSize) * 100));
            }
          })
          .on('error', (err: any) => reject(err))
          .pipe(dest);
        
        dest.on('finish', () => resolve());
        dest.on('error', (err: any) => reject(err));
      });
    } catch (err) {
      console.error('Google Drive download to path error:', err);
      throw err;
    }
  }

  /**
   * Gets the storage quota for the user.
   */
  async getStorageQuota(): Promise<{ limit: string; usage: string; usageInDrive: string }> {
    try {
      const res = await this.drive.about.get({
        fields: 'storageQuota',
      });
      const quota = res.data.storageQuota;
      return {
        limit: quota?.limit || '0',
        usage: quota?.usage || '0',
        usageInDrive: quota?.usageInDrive || '0',
      };
    } catch (err) {
      console.error('Google Drive storage quota error:', err);
      throw err;
    }
  }

  /**
   * Creates a new folder.
   */
  async createFolder(name: string, parentId: string): Promise<DriveFile> {
    try {
      const res = await this.drive.files.create({
        requestBody: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId === 'root' ? [] : [parentId],
        },
        fields: 'id, name, mimeType',
      });
      return res.data as DriveFile;
    } catch (err) {
      console.error('Google Drive createFolder error:', err);
      throw err;
    }
  }

  /**
   * Moves a file or folder to the trash.
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.update({ 
        fileId,
        requestBody: { trashed: true }
      });
    } catch (err) {
      console.error('Google Drive move to trash error:', err);
      throw err;
    }
  }

  /**
   * Restores a file or folder from the trash.
   */
  async restoreFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.update({ 
        fileId,
        requestBody: { trashed: false }
      });
    } catch (err) {
      console.error('Google Drive restore from trash error:', err);
      throw err;
    }
  }

  /**
   * Permanently deletes a file or folder (skips trash).
   */
  async deleteFilePermanently(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({ fileId });
    } catch (err) {
      console.error('Google Drive permanent delete error:', err);
      throw err;
    }
  }

  /**
   * Toggles the starred status of a file or folder.
   */
  async toggleStar(fileId: string, starred: boolean): Promise<void> {
    try {
      await this.drive.files.update({ 
        fileId,
        requestBody: { starred }
      });
    } catch (err) {
      console.error('Google Drive toggle star error:', err);
      throw err;
    }
  }

  /**
   * Uploads a file to Google Drive.
   */
  async uploadFile(localPath: string, parentId: string, onProgress?: (percent: number) => void): Promise<DriveFile> {
    const fs = await import('node:fs');
    const path = await import('node:path');
    
    try {
      const fileName = path.basename(localPath);
      const stats = fs.statSync(localPath);
      const fileSize = stats.size;

      const res = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: parentId === 'root' ? [] : [parentId],
        },
        media: {
          body: fs.createReadStream(localPath),
        },
        fields: 'id, name, mimeType, size, modifiedTime',
      }, {
        onUploadProgress: (evt) => {
          if (onProgress) {
            onProgress(Math.round((evt.bytesRead / fileSize) * 100));
          }
        }
      });

      return res.data as DriveFile;
    } catch (err) {
      console.error('Google Drive upload error:', err);
      throw err;
    }
  }
}

export const googleDriveAdapter = new GoogleDriveAdapter();
