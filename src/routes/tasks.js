export default async function tasksRoutes(fastify, options) {
  const { prisma } = fastify;

  // GET /api/tasks - Listar tareas
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Listar tareas',
      tags: ['Tasks'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          assigneeId: { type: 'string' },
          department: { type: 'string', enum: ['FINANCE', 'HR'] },
        },
      },
    },
  }, async (request, reply) => {
    const { status, priority, assigneeId, department } = request.query;
    const { role, department: userDept, id: userId } = request.user;

    const where = {};

    // Filtrar por departamento según el rol
    if (role === 'ADMIN') {
      // Admin ve todas las tareas
      if (department) where.department = department;
    } else {
      // Empleados ven tareas de su departamento o asignadas a ellos
      where.OR = [
        { department: userDept },
        { assigneeId: userId },
        { createdById: userId },
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true },
        },
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    return tasks;
  });

  // GET /api/tasks/my - Mis tareas
  fastify.get('/my', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener mis tareas asignadas',
      tags: ['Tasks'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: request.user.id,
        status: { not: 'CANCELLED' },
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    return tasks;
  });

  // GET /api/tasks/pending - Tareas pendientes
  fastify.get('/pending', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener tareas pendientes',
      tags: ['Tasks'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { role, department, id: userId } = request.user;

    const where = {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    };

    if (role !== 'ADMIN') {
      where.OR = [
        { department },
        { assigneeId: userId },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    return tasks;
  });

  // GET /api/tasks/:id - Obtener tarea por ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener tarea por ID',
      tags: ['Tasks'],
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

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!task) {
      return reply.status(404).send({ error: 'Tarea no encontrada' });
    }

    return task;
  });

  // POST /api/tasks - Crear tarea
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Crear nueva tarea',
      tags: ['Tasks'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          dueDate: { type: 'string', format: 'date-time' },
          assigneeId: { type: 'string' },
          department: { type: 'string', enum: ['FINANCE', 'HR'] },
        },
      },
    },
  }, async (request, reply) => {
    const { title, description, priority, dueDate, assigneeId, department } = request.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId,
        department: department || request.user.department,
        createdById: request.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true },
        },
      },
    });

    return reply.status(201).send(task);
  });

  // PUT /api/tasks/:id - Actualizar tarea
  fastify.put('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Actualizar tarea',
      tags: ['Tasks'],
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
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          dueDate: { type: 'string', format: 'date-time' },
          assigneeId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const data = { ...request.body };

    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.status === 'COMPLETED') data.completedAt = new Date();

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true },
        },
      },
    });

    return task;
  });

  // PATCH /api/tasks/:id/complete - Marcar tarea como completada
  fastify.patch('/:id/complete', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Marcar tarea como completada',
      tags: ['Tasks'],
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

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return task;
  });

  // DELETE /api/tasks/:id - Cancelar tarea
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Cancelar tarea',
      tags: ['Tasks'],
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

    await prisma.task.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Tarea cancelada correctamente' };
  });
}
