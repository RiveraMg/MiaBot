export default async function clientsRoutes(fastify, options) {
  const { prisma } = fastify;

  // Middleware para verificar acceso a Finanzas
  const checkFinanceAccess = async (request, reply) => {
    await request.jwtVerify();
    const { role, department } = request.user;
    if (role !== 'ADMIN' && department !== 'FINANCE') {
      return reply.status(403).send({ error: 'No tienes acceso al módulo de clientes' });
    }
  };

  // GET /api/clients - Listar clientes
  fastify.get('/', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Listar clientes',
      tags: ['Clients'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { search } = request.query;

    const where = {
      companyId: request.user.companyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nit: { contains: search, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        _count: {
          select: { invoices: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return clients;
  });

  // GET /api/clients/:id - Obtener cliente por ID
  fastify.get('/:id', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Obtener cliente por ID',
      tags: ['Clients'],
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

    const client = await prisma.client.findFirst({
      where: {
        id,
        companyId: request.user.companyId,
      },
      include: {
        invoices: {
          orderBy: { issueDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      return reply.status(404).send({ error: 'Cliente no encontrado' });
    }

    return client;
  });

  // POST /api/clients - Crear cliente
  fastify.post('/', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Crear nuevo cliente',
      tags: ['Clients'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { type: 'string' },
          nit: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const data = request.body;

    const client = await prisma.client.create({
      data: {
        ...data,
        companyId: request.user.companyId,
      },
    });

    return reply.status(201).send(client);
  });

  // PUT /api/clients/:id - Actualizar cliente
  fastify.put('/:id', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Actualizar cliente',
      tags: ['Clients'],
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
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { type: 'string' },
          nit: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    // Verificar que el cliente pertenece a la empresa
    const existing = await prisma.client.findFirst({
      where: { id, companyId: request.user.companyId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Cliente no encontrado' });
    }

    const client = await prisma.client.update({
      where: { id },
      data: request.body,
    });

    return client;
  });

  // DELETE /api/clients/:id - Eliminar cliente
  fastify.delete('/:id', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Eliminar cliente',
      tags: ['Clients'],
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

    // Verificar que el cliente pertenece a la empresa
    const existing = await prisma.client.findFirst({
      where: { id, companyId: request.user.companyId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Cliente no encontrado' });
    }

    // Verificar si tiene facturas
    const invoiceCount = await prisma.invoice.count({
      where: { clientId: id },
    });

    if (invoiceCount > 0) {
      return reply.status(400).send({ 
        error: 'No se puede eliminar el cliente porque tiene facturas asociadas' 
      });
    }

    await prisma.client.delete({
      where: { id },
    });

    return { message: 'Cliente eliminado correctamente' };
  });

  // GET /api/clients/:id/invoices - Obtener facturas de un cliente
  fastify.get('/:id/invoices', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Obtener facturas de un cliente',
      tags: ['Clients'],
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

    // Verificar que el cliente pertenece a la empresa
    const existing = await prisma.client.findFirst({
      where: { id, companyId: request.user.companyId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Cliente no encontrado' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { clientId: id },
      include: {
        items: true,
        payments: true,
      },
      orderBy: { issueDate: 'desc' },
    });

    return invoices;
  });
}
