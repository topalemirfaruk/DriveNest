import { googleDriveAdapter } from './adapters/google-drive';
import { getDb } from './database';
import { app } from 'electron';
import path from 'node:path';
import os from 'node:os';

const SYNC_FOLDER = path.join(os.homedir(), 'DriveNest');

export class SyncEngine {
  private isSyncing = false;

  /**
   * Performs the initial full scan and sync from Google Drive.
   */
  async performInitialSync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    console.log('Starting initial sync sequence...');

    try {
      let nextPageToken: string | undefined;
      const db = getDb();

      do {
        const result = await googleDriveAdapter.listFiles('root', 100, nextPageToken);
        
        // Batch insert/update metadata into SQLite
        const upsertStmt = db.prepare(`
          INSERT INTO files (id, name, mimeType, parent_id, size, modifiedTime, md5Checksum, is_folder)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            mimeType = excluded.mimeType,
            size = excluded.size,
            modifiedTime = excluded.modifiedTime,
            md5Checksum = excluded.md5Checksum
        `);

        // Transaction for better performance
        const transaction = db.transaction((items) => {
          for (const file of items) {
            upsertStmt.run(
              file.id,
              file.name,
              file.mimeType,
              file.parents?.[0] || null,
              file.size || 0,
              file.modifiedTime,
              file.md5Checksum || null,
              file.mimeType === 'application/vnd.google-apps.folder' ? 1 : 0
            );
          }
        });

        transaction(result.items);
        nextPageToken = result.nextPageToken;
        console.log(`Indexed ${result.items.length} files from Google Drive...`);

      } while (nextPageToken);

      console.log('Initial metadata sync completed successfully.');
    } catch (err) {
      console.error('Initial sync failed:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Starts periodic sync or file watching.
   */
  start(): void {
    // Placeholder for periodic polling or push notifications
    console.log('Sync Engine started.');
  }
}

export const syncEngine = new SyncEngine();
