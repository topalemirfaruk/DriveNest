import { google } from 'googleapis';
import { shell, ipcMain } from 'electron';
import keytar from 'keytar';
import { getDb } from './database';
import { syncEngine } from './sync-engine';
import { mountService } from './mount';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/userinfo.email',
];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SERVICE_NAME = 'DriveNest';
const ACCOUNT_NAME = 'google-drive-token';
const EMAIL_ACCOUNT_NAME = 'google-drive-email';

/**
 * Gets the stored tokens from the system keychain.
 */
export async function getStoredTokens() {
  const tokensStr = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  if (tokensStr) {
    return JSON.parse(tokensStr);
  }
  return null;
}

/**
 * Gets the stored email from the system keychain.
 */
export async function getStoredEmail(): Promise<string | null> {
  return await keytar.getPassword(SERVICE_NAME, EMAIL_ACCOUNT_NAME);
}

/**
 * Saves the user's email to the system keychain.
 */
async function saveEmail(email: string) {
  await keytar.setPassword(SERVICE_NAME, EMAIL_ACCOUNT_NAME, email);
}

/**
 * Fetches the user's email from Google userinfo API.
 */
async function fetchUserEmail(): Promise<string> {
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return data.email || 'unknown@gmail.com';
  } catch (err) {
    console.error('Failed to fetch user email:', err);
    return 'unknown@gmail.com';
  }
}

/**
 * Saves the tokens to the system keychain.
 */
export async function saveTokens(tokens: any) {
  await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(tokens));
}

/**
 * Deletes the stored tokens from the system keychain.
 */
export async function clearTokens() {
  await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  await keytar.deletePassword(SERVICE_NAME, EMAIL_ACCOUNT_NAME);
}

/**
 * Initializes the OAuth client with stored tokens.
 */
export async function initAuth() {
  const tokens = await getStoredTokens();
  if (tokens) {
    oauth2Client.setCredentials(tokens);
    return true;
  }
  return false;
}

import http from 'node:http';
import url from 'node:url';
import crypto from 'node:crypto';

/**
 * Starts a temporary HTTP server to catch the OAuth2 callback.
 */
function startCallbackServer(expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const query = url.parse(req.url!, true).query;
        if (query.state !== expectedState) {
          res.end('Giriş başarısız: CSRF doğrulaması başarısız oldu.');
          server.close();
          reject(new Error('Invalid state parameter (CSRF attempt?)'));
          return;
        }

        if (query.code) {
          res.end('Giriş başarılı! Bu pencereyi kapatabilirsiniz.');
          server.close();
          resolve(query.code as string);
        } else {
          res.end('Giriş başarısız oldu.');
          server.close();
          reject(new Error('No code found in callback'));
        }
      } catch (err) {
        reject(err);
      }
    }).listen(3000);
  });
}

/**
 * Starts the OAuth2 login flow.
 */
export async function login() {
  const state = crypto.randomBytes(32).toString('hex');
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: state
  });

  shell.openExternal(authUrl);

  try {
    const code = await startCallbackServer(state);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    await saveTokens(tokens);
    const email = await fetchUserEmail();
    await saveEmail(email);
    return { success: true, email };
  } catch (err) {
    console.error('Auth error:', err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Registers Auth related IPC handlers.
 */
export function registerAuthHandlers() {
  ipcMain.handle('auth:login', async () => {
    const result = await login();
    if (result.success) {
      // Trigger initial sync in background
      syncEngine.performInitialSync();
    }
    return result;
  });

  ipcMain.handle('auth:status', async () => {
    const tokens = await getStoredTokens();
    const email = tokens ? await getStoredEmail() : undefined;
    return {
      isLoggedIn: !!tokens,
      email: email || undefined,
    };
  });

  ipcMain.handle('auth:logout', async () => {
    try {
      await mountService.unmountDrive();
    } catch (e) { console.error('Failed to unmount during logout', e); }
    await clearTokens();
    oauth2Client.setCredentials({});
  });
}

export function getOAuth2Client() {
  return oauth2Client;
}
