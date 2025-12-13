export default async function notificationsRoutes(fastify, options) {
  const { prisma } = fastify;

  // GET /api/notifications - Listar notificaciones del usuario
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Listar notificaciones del usuario',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          unreadOnly: { type: 'boolean' },
          limit: { type: 'integer', default: 20 },
        },
      },
    },
  }, async (request, reply) => {
    const { unreadOnly, limit = 20 } = request.query;

    const where = {
      userId: request.user.id,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications;
  });

  // GET /api/notifications/unread-count - Contar notificaciones no leídas
  fastify.get('/unread-count', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Contar notificaciones no leídas',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const count = await prisma.notification.count({
      where: {
        userId: request.user.id,
        isRead: false,
      },
    });

    return { count };
  });

  // PUT /api/notifications/:id/read - Marcar notificación como leída
  fastify.put('/:id/read', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Marcar notificación como leída',
      tags: ['Notifications'],
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

    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId: request.user.id,
      },
      data: { isRead: true },
    });

    return { success: notification.count > 0 };
  });

  // PUT /api/notifications/read-all - Marcar todas como leídas
  fastify.put('/read-all', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Marcar todas las notificaciones como leídas',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const result = await prisma.notification.updateMany({
      where: {
        userId: request.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { updated: result.count };
  });

  // DELETE /api/notifications/:id - Eliminar notificación
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Eliminar notificación',
      tags: ['Notifications'],
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

    await prisma.notification.deleteMany({
      where: {
        id,
        userId: request.user.id,
      },
    });

    return { message: 'Notificación eliminada' };
  });

  // POST /api/notifications/create - Crear notificación (interno/sistema)
  fastify.post('/create', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Crear notificación (solo Admin)',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['userId', 'type', 'title', 'message'],
        properties: {
          userId: { type: 'string' },
          type: { type: 'string' },
          title: { type: 'string' },
          message: { type: 'string' },
          referenceId: { type: 'string' },
          referenceType: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    // Solo Admin puede crear notificaciones manualmente
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Solo administradores pueden crear notificaciones' });
    }

    const { userId, type, title, message, referenceId, referenceType } = request.body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        referenceId,
        referenceType,
      },
    });

    return reply.status(201).send(notification);
  });
}
