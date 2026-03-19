// Type-safe IPC channel definitions shared between main and renderer

export interface IPCChannels {
  // Auth
  'auth:login': { args: void; result: { success: boolean; email?: string } };
  'auth:logout': { args: void; result: void };
  'auth:status': { args: void; result: { isLoggedIn: boolean; email?: string } };

  // Files
  'files:list': {
    args: { folderId: string; pageToken?: string; section?: string };
    result: { items: CloudFile[]; nextPageToken?: string };
  };
  'files:upload': { args: { localPath: string; parentId: string }; result: CloudFile };
  'files:download': { args: { fileId: string; destPath: string }; result: void };
  'files:getContent': { args: { fileId: string }; result: { base64: string; mimeType: string } };
  'files:delete': { args: { fileId: string }; result: void };
  'files:restore': { args: { fileId: string }; result: void };
  'files:deletePermanently': { args: { fileId: string }; result: void };
  'files:toggleStar': { args: { fileId: string; starred: boolean }; result: void };
  'files:createFolder': { args: { name: string; parentId: string }; result: CloudFile };

  // Sync
  'sync:start': { args: void; result: void };
  'sync:stop': { args: void; result: void };
  'sync:status': { args: void; result: SyncStatus };

  // App
  'app:getVersion': { args: void; result: string };
  'app:getStorageQuota': { args: void; result: { limit: string; usage: string; usageInDrive: string } };
  'app:openSyncFolder': { args: void; result: void };
  'app:selectFolder': { args: void; result: string | null };
  'app:selectFile': { args: void; result: string | null };
  'app:openExternal': { args: string; result: void };
  'app:previewFile': { args: string; result: void };
  'app:selectSavePath': { args: string; result: string | null };
  
  // Window
  'window:minimize': { args: void; result: void };
  'window:maximize': { args: void; result: void };
  'window:unmaximize': { args: void; result: void };
  'window:close': { args: void; result: void };
  'window:isMaximized': { args: void; result: boolean };

  // Mount
  'mount:status': { args: void; result: 'unmounted' | 'mounting' | 'mounted' | 'error' };
  'mount:check': { args: void; result: 'installed' | 'missing' | 'checking' };
  'mount:install': { args: void; result: void };
  'mount:start': { args: void; result: void };
  'mount:stop': { args: void; result: void };
  'mount:openFolder': { args: void; result: void };
}

// Event channels (main → renderer, one-way)
export interface IPCEvents {
  'sync:progress': { file: string; percent: number; speed: number };
  'sync:conflict': { path: string; localModified: number; remoteModified: number };
  'sync:stateChanged': SyncStatus;
  'notification:show': { title: string; body: string; type: 'info' | 'success' | 'error' };
  'mount:statusChanged': 'unmounted' | 'mounting' | 'mounted' | 'error';
}

export interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime: string;
  iconLink?: string;
  thumbnailLink?: string;
  parentId: string | null;
  isFolder: boolean;
  shared: boolean;
  starred: boolean;
  webViewLink?: string;
}

export type SyncState = 'idle' | 'syncing' | 'paused' | 'error' | 'offline';

export interface SyncStatus {
  state: SyncState;
  lastSyncTime?: string;
  filesInQueue: number;
  currentFile?: string;
  progress?: number;
  error?: string;
}

// Exposed API type for renderer (window.drivenest)
export interface DriveNestAPI {
  invoke<K extends keyof IPCChannels>(
    channel: K,
    ...args: IPCChannels[K]['args'] extends void ? [] : [IPCChannels[K]['args']]
  ): Promise<IPCChannels[K]['result']>;
  on<K extends keyof IPCEvents>(
    channel: K,
    callback: (data: IPCEvents[K]) => void,
  ): () => void;
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    drivenest: DriveNestAPI;
  }
}
