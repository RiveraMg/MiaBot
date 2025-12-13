export default async function leaveRequestsRoutes(fastify, options) {
  const { prisma } = fastify;

  // GET /api/leave-requests - Listar solicitudes de permisos
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Listar solicitudes de permisos',
      tags: ['Leave Requests'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
          type: { type: 'string', enum: ['VACATION', 'SICK', 'PERSONAL', 'MATERNITY', 'OTHER'] },
        },
      },
    },
  }, async (request, reply) => {
    const { status, type } = request.query;
    const { role, department, id: userId } = request.user;

    const where = {};

    // Admin y HR ven todas las solicitudes
    if (role === 'ADMIN' || department === 'HR') {
      // Ver todas de la empresa
      where.user = { companyId: request.user.companyId };
    } else {
      // Empleados solo ven sus propias solicitudes
      where.userId = userId;
    }

    if (status) where.status = status;
    if (type) where.type = type;

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true, position: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  });

  // GET /api/leave-requests/pending - Solicitudes pendientes (para HR)
  fastify.get('/pending', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener solicitudes pendientes de aprobación',
      tags: ['Leave Requests'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { role, department } = request.user;

    // Solo Admin y HR pueden ver solicitudes pendientes
    if (role !== 'ADMIN' && department !== 'HR') {
      return reply.status(403).send({ error: 'No tienes acceso a este módulo' });
    }

    const requests = await prisma.leaveRequest.findMany({
      where: {
        status: 'PENDING',
        user: { companyId: request.user.companyId },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true, position: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return requests;
  });

  // GET /api/leave-requests/my - Mis solicitudes
  fastify.get('/my', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener mis solicitudes de permisos',
      tags: ['Leave Requests'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const requests = await prisma.leaveRequest.findMany({
      where: {
        userId: request.user.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  });

  // GET /api/leave-requests/:id - Obtener solicitud por ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener solicitud de permiso por ID',
      tags: ['Leave Requests'],
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
    const { role, department, id: userId } = request.user;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true, position: true },
        },
      },
    });

    if (!leaveRequest) {
      return reply.status(404).send({ error: 'Solicitud no encontrada' });
    }

    // Verificar acceso
    if (role !== 'ADMIN' && department !== 'HR' && leaveRequest.userId !== userId) {
      return reply.status(403).send({ error: 'No tienes acceso a esta solicitud' });
    }

    return leaveRequest;
  });

  // POST /api/leave-requests - Crear solicitud de permiso
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Crear solicitud de permiso',
      tags: ['Leave Requests'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['type', 'startDate', 'endDate'],
        properties: {
          type: { type: 'string', enum: ['VACATION', 'SICK', 'PERSONAL', 'MATERNITY', 'OTHER'] },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          reason: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { type, startDate, endDate, reason } = request.body;

    // Validar fechas
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return reply.status(400).send({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
    }

    // Verificar si ya tiene una solicitud pendiente en esas fechas
    const existingRequest = await prisma.leaveRequest.findFirst({
      where: {
        userId: request.user.id,
        status: { not: 'REJECTED' },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (existingRequest) {
      return reply.status(400).send({ 
        error: 'Ya tienes una solicitud de permiso en esas fechas' 
      });
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        type,
        startDate: start,
        endDate: end,
        reason,
        userId: request.user.id,
      },
    });

    return reply.status(201).send(leaveRequest);
  });

  // PUT /api/leave-requests/:id/respond - Responder solicitud (aprobar/rechazar)
  fastify.put('/:id/respond', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Aprobar o rechazar solicitud de permiso',
      tags: ['Leave Requests'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['APPROVED', 'REJECTED'] },
          responseNote: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { status, responseNote } = request.body;
    const { role, department } = request.user;

    // Solo Admin y HR pueden responder solicitudes
    if (role !== 'ADMIN' && department !== 'HR') {
      return reply.status(403).send({ error: 'No tienes permiso para responder solicitudes' });
    }

    // Verificar que la solicitud existe y está pendiente
    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Solicitud no encontrada' });
    }

    if (existing.status !== 'PENDING') {
      return reply.status(400).send({ error: 'Esta solicitud ya fue procesada' });
    }

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        responseNote,
        respondedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return leaveRequest;
  });

  // DELETE /api/leave-requests/:id - Cancelar solicitud (solo si está pendiente)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Cancelar solicitud de permiso',
      tags: ['Leave Requests'],
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
    const { role, id: userId } = request.user;

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Solicitud no encontrada' });
    }

    // Solo el creador o Admin puede cancelar
    if (existing.userId !== userId && role !== 'ADMIN') {
      return reply.status(403).send({ error: 'No tienes permiso para cancelar esta solicitud' });
    }

    if (existing.status !== 'PENDING') {
      return reply.status(400).send({ error: 'Solo se pueden cancelar solicitudes pendientes' });
    }

    await prisma.leaveRequest.delete({
      where: { id },
    });

    return { message: 'Solicitud cancelada correctamente' };
  });
}
