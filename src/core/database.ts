import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';

let db: Database.Database;

/**
 * Initializes the SQLite database and creates the schema if it doesn't exist.
 */
export function initDatabase(): void {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'drivenest.sqlite');
  db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mimeType TEXT,
      parent_id TEXT,
      size INTEGER,
      modifiedTime TEXT,
      md5Checksum TEXT,
      local_path TEXT,
      sync_status TEXT DEFAULT 'synced', -- 'synced', 'pending', 'error'
      is_folder BOOLEAN NOT NULL DEFAULT 0,
      version INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id TEXT NOT NULL,
      action TEXT NOT NULL, -- 'upload', 'download', 'delete'
      priority INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      retry_count INTEGER DEFAULT 0,
      last_error TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_files_parent ON files(parent_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority, created_at);
  `);

  console.log('Database initialized at:', dbPath);
}

/**
 * Gets the database instance.
 */
export function getDb(): Database.Database {
  if (!db) {
    initDatabase();
  }
  return db;
}
