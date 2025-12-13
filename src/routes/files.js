import path from 'path';
import fs from 'fs/promises';
import { pipeline } from 'stream/promises';
import googleDrive from '../services/googleDrive.js';

// Directorio para archivos locales
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export default async function filesRoutes(fastify, options) {
  const { prisma } = fastify;

  // Asegurar que existe el directorio de uploads
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    // Ignorar si ya existe
  }

  // ============================================
  // ARCHIVOS LOCALES
  // ============================================

  // POST /api/files/upload - Subir archivo local
  fastify.post('/upload', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Subir archivo al servidor',
      tags: ['Files'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No se proporcionó ningún archivo' });
    }

    const { filename, mimetype, file } = data;
    const uniqueName = `${Date.now()}-${filename}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    // Guardar archivo
    await pipeline(file, (await import('fs')).createWriteStream(filePath));

    // Obtener tamaño
    const stats = await fs.stat(filePath);

    // Guardar en base de datos
    const fileRecord = await prisma.file.create({
      data: {
        name: filename,
        mimeType: mimetype,
        size: stats.size,
        storageType: 'local',
        path: uniqueName,
        uploadedById: request.user.id,
      },
    });

    return reply.status(201).send(fileRecord);
  });

  // GET /api/files - Listar archivos
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Listar archivos',
      tags: ['Files'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          referenceType: { type: 'string' },
          referenceId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { referenceType, referenceId } = request.query;

    const where = {};
    if (referenceType) where.referenceType = referenceType;
    if (referenceId) where.referenceId = referenceId;

    const files = await prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return files;
  });

  // GET /api/files/:id/download - Descargar archivo local
  fastify.get('/:id/download', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Descargar archivo',
      tags: ['Files'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return reply.status(404).send({ error: 'Archivo no encontrado' });
    }

    if (file.storageType === 'local') {
      const filePath = path.join(UPLOAD_DIR, file.path);
      
      try {
        await fs.access(filePath);
      } catch {
        return reply.status(404).send({ error: 'Archivo no encontrado en el servidor' });
      }

      return reply
        .header('Content-Disposition', `attachment; filename="${file.name}"`)
        .header('Content-Type', file.mimeType)
        .send((await import('fs')).createReadStream(filePath));
    }

    if (file.storageType === 'google_drive' && file.driveUrl) {
      return reply.redirect(file.driveUrl);
    }

    return reply.status(400).send({ error: 'Tipo de almacenamiento no soportado' });
  });

  // DELETE /api/files/:id - Eliminar archivo
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Eliminar archivo',
      tags: ['Files'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return reply.status(404).send({ error: 'Archivo no encontrado' });
    }

    // Eliminar archivo físico si es local
    if (file.storageType === 'local' && file.path) {
      try {
        await fs.unlink(path.join(UPLOAD_DIR, file.path));
      } catch {
        // Ignorar si no existe
      }
    }

    // Eliminar de Google Drive si aplica
    if (file.storageType === 'google_drive' && file.driveFileId) {
      try {
        await googleDrive.deleteFile(file.driveFileId);
      } catch {
        // Ignorar errores de Drive
      }
    }

    await prisma.file.delete({
      where: { id },
    });

    return { message: 'Archivo eliminado correctamente' };
  });

  // ============================================
  // GOOGLE DRIVE
  // ============================================

  // GET /api/files/drive/auth-url - Obtener URL de autorización de Google
  fastify.get('/drive/auth-url', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener URL de autorización de Google Drive',
      tags: ['Files', 'Google Drive'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Solo administradores pueden conectar Google Drive' });
    }

    const authUrl = googleDrive.getAuthUrl();
    return { authUrl };
  });

  // GET /api/files/drive/callback - Callback de OAuth de Google
  fastify.get('/drive/callback', {
    schema: {
      description: 'Callback de autorización de Google Drive',
      tags: ['Files', 'Google Drive'],
      querystring: {
        type: 'object',
        properties: {
          code: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { code } = request.query;

    if (!code) {
      return reply.status(400).send({ error: 'Código de autorización no proporcionado' });
    }

    try {
      const tokens = await googleDrive.getTokensFromCode(code);
      
      // En producción, guardar tokens de forma segura (encriptados en BD)
      // Por ahora, solo confirmamos la conexión
      
      return {
        success: true,
        message: 'Google Drive conectado exitosamente',
        // NO devolver tokens en producción
      };
    } catch (error) {
      return reply.status(500).send({ error: 'Error al conectar con Google Drive' });
    }
  });

  // GET /api/files/drive/list - Listar archivos de Google Drive
  fastify.get('/drive/list', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Listar archivos de Google Drive',
      tags: ['Files', 'Google Drive'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          folderId: { type: 'string' },
          pageSize: { type: 'integer', default: 20 },
        },
      },
    },
  }, async (request, reply) => {
    const { folderId, pageSize } = request.query;

    try {
      const files = await googleDrive.listFiles(folderId || 'root', pageSize);
      return files;
    } catch (error) {
      if (error.code === 401) {
        return reply.status(401).send({ error: 'Google Drive no está conectado o la sesión expiró' });
      }
      throw error;
    }
  });

  // GET /api/files/drive/search - Buscar archivos en Google Drive
  fastify.get('/drive/search', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Buscar archivos en Google Drive',
      tags: ['Files', 'Google Drive'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { query } = request.query;

    try {
      const files = await googleDrive.searchFiles(query);
      return files;
    } catch (error) {
      if (error.code === 401) {
        return reply.status(401).send({ error: 'Google Drive no está conectado' });
      }
      throw error;
    }
  });

  // GET /api/files/drive/:fileId/content - Leer contenido de archivo de Drive
  fastify.get('/drive/:fileId/content', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Leer contenido de un archivo de Google Drive',
      tags: ['Files', 'Google Drive'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { fileId } = request.params;

    try {
      const fileInfo = await googleDrive.getFileInfo(fileId);
      const content = await googleDrive.readFileContent(fileId, fileInfo.mimeType);
      
      return {
        file: fileInfo,
        content,
      };
    } catch (error) {
      if (error.message.includes('no soportado')) {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }
  });

  // POST /api/files/drive/upload - Subir archivo a Google Drive
  fastify.post('/drive/upload', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Subir archivo a Google Drive',
      tags: ['Files', 'Google Drive'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No se proporcionó ningún archivo' });
    }

    const { filename, mimetype } = data;
    const folderId = data.fields?.folderId?.value || 'root';

    // Leer archivo a buffer
    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    try {
      const driveFile = await googleDrive.uploadFileFromBuffer(buffer, filename, mimetype, folderId);

      // Guardar referencia en BD
      const fileRecord = await prisma.file.create({
        data: {
          name: filename,
          mimeType: mimetype,
          size: buffer.length,
          storageType: 'google_drive',
          driveFileId: driveFile.id,
          driveUrl: driveFile.webViewLink,
          uploadedById: request.user.id,
        },
      });

      return reply.status(201).send({
        ...fileRecord,
        driveFile,
      });
    } catch (error) {
      if (error.code === 401) {
        return reply.status(401).send({ error: 'Google Drive no está conectado' });
      }
      throw error;
    }
  });
}
