export default async function eventsRoutes(fastify, options) {
  const { prisma } = fastify;

  // Middleware para verificar acceso a HR
  const checkHRAccess = async (request, reply) => {
    await request.jwtVerify();
    const { role, department } = request.user;
    if (role !== 'ADMIN' && department !== 'HR') {
      return reply.status(403).send({ error: 'No tienes acceso al módulo de eventos' });
    }
  };

  // GET /api/events - Listar eventos
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Listar eventos',
      tags: ['Events'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
        },
      },
    },
  }, async (request, reply) => {
    const { type, startDate, endDate } = request.query;

    const where = {
      companyId: request.user.companyId,
    };

    if (type) where.type = type;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return events;
  });

  // GET /api/events/upcoming - Próximos eventos
  fastify.get('/upcoming', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener próximos eventos',
      tags: ['Events'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', default: 7 },
        },
      },
    },
  }, async (request, reply) => {
    const { days = 7 } = request.query;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const events = await prisma.event.findMany({
      where: {
        companyId: request.user.companyId,
        startDate: {
          gte: today,
          lte: futureDate,
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return events.map(event => ({
      ...event,
      daysUntil: Math.ceil((new Date(event.startDate) - today) / (1000 * 60 * 60 * 24)),
    }));
  });

  // GET /api/events/today - Eventos de hoy
  fastify.get('/today', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener eventos de hoy',
      tags: ['Events'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await prisma.event.findMany({
      where: {
        companyId: request.user.companyId,
        startDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return events;
  });

  // GET /api/events/:id - Obtener evento por ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener evento por ID',
      tags: ['Events'],
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

    const event = await prisma.event.findFirst({
      where: {
        id,
        companyId: request.user.companyId,
      },
    });

    if (!event) {
      return reply.status(404).send({ error: 'Evento no encontrado' });
    }

    return event;
  });

  // POST /api/events - Crear evento (solo HR y Admin)
  fastify.post('/', {
    preHandler: [checkHRAccess],
    schema: {
      description: 'Crear nuevo evento',
      tags: ['Events'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'startDate'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['MEETING', 'BIRTHDAY', 'ANNIVERSARY', 'EVALUATION', 'CONTRACT_END', 'TRAINING', 'CORPORATE', 'DEADLINE', 'OTHER'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          allDay: { type: 'boolean' },
          reminderDays: { type: 'integer', minimum: 0 },
          isRecurring: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { title, description, type, startDate, endDate, allDay, reminderDays, isRecurring } = request.body;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type: type || 'OTHER',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        allDay: allDay || false,
        reminderDays: reminderDays || 1,
        isRecurring: isRecurring || false,
        companyId: request.user.companyId,
      },
    });

    return reply.status(201).send(event);
  });

  // PUT /api/events/:id - Actualizar evento
  fastify.put('/:id', {
    preHandler: [checkHRAccess],
    schema: {
      description: 'Actualizar evento',
      tags: ['Events'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          allDay: { type: 'boolean' },
          reminderDays: { type: 'integer' },
          isRecurring: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const data = { ...request.body };

    // Verificar que el evento pertenece a la empresa
    const existing = await prisma.event.findFirst({
      where: { id, companyId: request.user.companyId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Evento no encontrado' });
    }

    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    const event = await prisma.event.update({
      where: { id },
      data,
    });

    return event;
  });

  // DELETE /api/events/:id - Eliminar evento
  fastify.delete('/:id', {
    preHandler: [checkHRAccess],
    schema: {
      description: 'Eliminar evento',
      tags: ['Events'],
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

    // Verificar que el evento pertenece a la empresa
    const existing = await prisma.event.findFirst({
      where: { id, companyId: request.user.companyId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Evento no encontrado' });
    }

    await prisma.event.delete({
      where: { id },
    });

    return { message: 'Evento eliminado correctamente' };
  });
}
