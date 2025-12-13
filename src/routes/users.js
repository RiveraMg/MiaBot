export default async function usersRoutes(fastify, options) {
  const { prisma } = fastify;

  // GET /api/users - Listar usuarios (Admin ve todos, HR ve empleados)
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Listar usuarios',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          department: { type: 'string', enum: ['FINANCE', 'HR'] },
          role: { type: 'string', enum: ['ADMIN', 'EMPLOYEE', 'EXTERNAL'] },
          isActive: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { role, department } = request.user;
    const { department: filterDept, role: filterRole, isActive } = request.query;

    // Solo Admin y HR pueden ver usuarios
    if (role !== 'ADMIN' && department !== 'HR') {
      return reply.status(403).send({ error: 'No tienes acceso a este módulo' });
    }

    const where = {
      companyId: request.user.companyId,
    };

    // HR solo ve empleados
    if (department === 'HR' && role !== 'ADMIN') {
      where.role = 'EMPLOYEE';
    }

    if (filterDept) where.department = filterDept;
    if (filterRole) where.role = filterRole;
    if (isActive !== undefined) where.isActive = isActive;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        avatar: true,
        isActive: true,
        hireDate: true,
        birthDate: true,
        contractEnd: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return users;
  });

  // GET /api/users/:id - Obtener usuario por ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener usuario por ID',
      tags: ['Users'],
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
    const { role, department } = request.user;

    // Solo Admin y HR pueden ver usuarios
    if (role !== 'ADMIN' && department !== 'HR') {
      return reply.status(403).send({ error: 'No tienes acceso a este módulo' });
    }

    const user = await prisma.user.findFirst({
      where: {
        id,
        companyId: request.user.companyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        avatar: true,
        isActive: true,
        hireDate: true,
        birthDate: true,
        contractEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'Usuario no encontrado' });
    }

    return user;
  });

  // PUT /api/users/:id - Actualizar usuario
  fastify.put('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Actualizar usuario',
      tags: ['Users'],
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
          name: { type: 'string' },
          phone: { type: 'string' },
          position: { type: 'string' },
          department: { type: 'string', enum: ['FINANCE', 'HR'] },
          isActive: { type: 'boolean' },
          hireDate: { type: 'string', format: 'date' },
          birthDate: { type: 'string', format: 'date' },
          contractEnd: { type: 'string', format: 'date' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { role } = request.user;

    // Solo Admin puede actualizar usuarios
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Solo administradores pueden actualizar usuarios' });
    }

    const data = { ...request.body };
    
    // Convertir fechas
    if (data.hireDate) data.hireDate = new Date(data.hireDate);
    if (data.birthDate) data.birthDate = new Date(data.birthDate);
    if (data.contractEnd) data.contractEnd = new Date(data.contractEnd);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        isActive: true,
        hireDate: true,
        birthDate: true,
        contractEnd: true,
      },
    });

    return user;
  });

  // DELETE /api/users/:id - Desactivar usuario (soft delete)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Desactivar usuario',
      tags: ['Users'],
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
    const { role } = request.user;

    // Solo Admin puede desactivar usuarios
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Solo administradores pueden desactivar usuarios' });
    }

    // No permitir desactivarse a sí mismo
    if (id === request.user.id) {
      return reply.status(400).send({ error: 'No puedes desactivarte a ti mismo' });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Usuario desactivado correctamente' };
  });

  // GET /api/users/birthdays/upcoming - Próximos cumpleaños
  fastify.get('/birthdays/upcoming', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener próximos cumpleaños',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { role, department } = request.user;

    // Solo Admin y HR pueden ver cumpleaños
    if (role !== 'ADMIN' && department !== 'HR') {
      return reply.status(403).send({ error: 'No tienes acceso a este módulo' });
    }

    const users = await prisma.user.findMany({
      where: {
        companyId: request.user.companyId,
        isActive: true,
        birthDate: { not: null },
      },
      select: {
        id: true,
        name: true,
        birthDate: true,
        department: true,
        position: true,
      },
    });

    // Calcular próximos cumpleaños
    const today = new Date();
    const upcomingBirthdays = users
      .map(user => {
        const birthday = new Date(user.birthDate);
        const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        
        return {
          ...user,
          nextBirthday,
          daysUntil,
        };
      })
      .filter(u => u.daysUntil <= 30) // Próximos 30 días
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return upcomingBirthdays;
  });

  // GET /api/users/contracts/expiring - Contratos por vencer
  fastify.get('/contracts/expiring', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener contratos por vencer',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { role, department } = request.user;

    // Solo Admin y HR pueden ver contratos
    if (role !== 'ADMIN' && department !== 'HR') {
      return reply.status(403).send({ error: 'No tienes acceso a este módulo' });
    }

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const users = await prisma.user.findMany({
      where: {
        companyId: request.user.companyId,
        isActive: true,
        contractEnd: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true,
        contractEnd: true,
      },
      orderBy: { contractEnd: 'asc' },
    });

    return users.map(user => ({
      ...user,
      daysUntilExpiry: Math.ceil((new Date(user.contractEnd) - new Date()) / (1000 * 60 * 60 * 24)),
    }));
  });
}
