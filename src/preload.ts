// Preload script: exposes a safe API to renderer via contextBridge
import { contextBridge, ipcRenderer } from 'electron';
import type { DriveNestAPI, IPCChannels, IPCEvents } from './shared/types/ipc';

// Whitelist of allowed IPC channels for security
const ALLOWED_INVOKE_CHANNELS = new Set<keyof IPCChannels>([
  'auth:login', 'auth:logout', 'auth:status',
  'files:list', 'files:upload', 'files:download', 'files:getContent', 'files:delete', 'files:restore', 'files:deletePermanently', 'files:toggleStar', 'files:createFolder',
  'sync:start', 'sync:stop', 'sync:status',
  'app:getVersion', 'app:openSyncFolder', 'app:selectFolder', 'app:getStorageQuota', 'app:selectFile', 'app:openExternal', 'app:previewFile', 'app:selectSavePath',
  'window:minimize', 'window:maximize', 'window:unmaximize', 'window:close', 'window:isMaximized',
  'mount:status', 'mount:check', 'mount:install', 'mount:start', 'mount:stop', 'mount:openFolder',
]);

const ALLOWED_EVENT_CHANNELS = new Set<keyof IPCEvents>([
  'sync:progress', 'sync:conflict', 'sync:stateChanged', 'notification:show', 'mount:statusChanged',
]);

const api: DriveNestAPI = {
  invoke(channel: string, ...args: any[]) {
    if (!ALLOWED_INVOKE_CHANNELS.has(channel as keyof IPCChannels)) {
      throw new Error(`IPC channel not allowed: ${channel}`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  on(channel: string, callback: (data: any) => void) {
    if (!ALLOWED_EVENT_CHANNELS.has(channel as keyof IPCEvents)) {
      throw new Error(`IPC event channel not allowed: ${channel}`);
    }
    const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  },

  platform: process.platform,
};

contextBridge.exposeInMainWorld('drivenest', api);
