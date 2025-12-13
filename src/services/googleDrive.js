import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Configuración de OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Scopes necesarios para Google Drive
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

/**
 * Genera la URL de autorización para Google OAuth
 */
export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

/**
 * Intercambia el código de autorización por tokens
 */
export async function getTokensFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

/**
 * Establece los tokens de acceso
 */
export function setCredentials(tokens) {
  oauth2Client.setCredentials(tokens);
}

/**
 * Obtiene el cliente de Google Drive
 */
export function getDriveClient() {
  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Lista archivos de una carpeta en Google Drive
 */
export async function listFiles(folderId = 'root', pageSize = 20) {
  const drive = getDriveClient();
  
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    pageSize,
    fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
    orderBy: 'modifiedTime desc',
  });

  return response.data.files;
}

/**
 * Busca archivos por nombre
 */
export async function searchFiles(query, pageSize = 20) {
  const drive = getDriveClient();
  
  const response = await drive.files.list({
    q: `name contains '${query}' and trashed = false`,
    pageSize,
    fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
    orderBy: 'modifiedTime desc',
  });

  return response.data.files;
}

/**
 * Obtiene información de un archivo
 */
export async function getFileInfo(fileId) {
  const drive = getDriveClient();
  
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink',
  });

  return response.data;
}

/**
 * Lee el contenido de un archivo de texto o Google Doc
 */
export async function readFileContent(fileId, mimeType) {
  const drive = getDriveClient();

  // Si es un Google Doc, exportar como texto plano
  if (mimeType === 'application/vnd.google-apps.document') {
    const response = await drive.files.export({
      fileId,
      mimeType: 'text/plain',
    });
    return response.data;
  }

  // Si es un Google Sheet, exportar como CSV
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    const response = await drive.files.export({
      fileId,
      mimeType: 'text/csv',
    });
    return response.data;
  }

  // Para otros archivos de texto
  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    const response = await drive.files.get({
      fileId,
      alt: 'media',
    });
    return response.data;
  }

  throw new Error('Tipo de archivo no soportado para lectura de contenido');
}

/**
 * Sube un archivo a Google Drive
 */
export async function uploadFile(filePath, fileName, mimeType, folderId = 'root') {
  const drive = getDriveClient();

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, webViewLink',
  });

  return response.data;
}

/**
 * Sube un archivo desde buffer
 */
export async function uploadFileFromBuffer(buffer, fileName, mimeType, folderId = 'root') {
  const drive = getDriveClient();

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const { Readable } = await import('stream');
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const media = {
    mimeType,
    body: stream,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, webViewLink',
  });

  return response.data;
}

/**
 * Crea una carpeta en Google Drive
 */
export async function createFolder(folderName, parentId = 'root') {
  const drive = getDriveClient();

  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id, name, webViewLink',
  });

  return response.data;
}

/**
 * Elimina un archivo
 */
export async function deleteFile(fileId) {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
  return true;
}

/**
 * Descarga un archivo
 */
export async function downloadFile(fileId, destPath) {
  const drive = getDriveClient();
  
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return new Promise((resolve, reject) => {
    const dest = fs.createWriteStream(destPath);
    response.data
      .on('end', () => resolve(destPath))
      .on('error', reject)
      .pipe(dest);
  });
}

export default {
  getAuthUrl,
  getTokensFromCode,
  setCredentials,
  getDriveClient,
  listFiles,
  searchFiles,
  getFileInfo,
  readFileContent,
  uploadFile,
  uploadFileFromBuffer,
  createFolder,
  deleteFile,
  downloadFile,
};
