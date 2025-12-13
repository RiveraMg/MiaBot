export default async function suppliersRoutes(fastify, options) {
  const { prisma } = fastify;

  // Middleware para verificar acceso a Finanzas
  const checkFinanceAccess = async (request, reply) => {
    await request.jwtVerify();
    const { role, department } = request.user;
    if (role !== 'ADMIN' && department !== 'FINANCE') {
      return reply.status(403).send({ error: 'No tienes acceso al módulo de proveedores' });
    }
  };

  // GET /api/suppliers - Listar proveedores
  fastify.get('/', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Listar proveedores',
      tags: ['Suppliers'],
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
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return suppliers;
  });

  // GET /api/suppliers/:id - Obtener proveedor por ID
  fastify.get('/:id', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Obtener proveedor por ID',
      tags: ['Suppliers'],
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

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        companyId: request.user.companyId,
      },
    });

    if (!supplier) {
      return reply.status(404).send({ error: 'Proveedor no encontrado' });
    }

    return supplier;
  });

  // POST /api/suppliers - Crear proveedor
  fastify.post('/', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Crear nuevo proveedor',
      tags: ['Suppliers'],
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
          contactName: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const data = request.body;

    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        companyId: request.user.companyId,
      },
    });

    return reply.status(201).send(supplier);
  });

  // PUT /api/suppliers/:id - Actualizar proveedor
  fastify.put('/:id', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Actualizar proveedor',
      tags: ['Suppliers'],
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
          contactName: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    // Verificar que el proveedor pertenece a la empresa
    const existing = await prisma.supplier.findFirst({
      where: { id, companyId: request.user.companyId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Proveedor no encontrado' });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: request.body,
    });

    return supplier;
  });

  // DELETE /api/suppliers/:id - Eliminar proveedor
  fastify.delete('/:id', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Eliminar proveedor',
      tags: ['Suppliers'],
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

    // Verificar que el proveedor pertenece a la empresa
    const existing = await prisma.supplier.findFirst({
      where: { id, companyId: request.user.companyId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Proveedor no encontrado' });
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return { message: 'Proveedor eliminado correctamente' };
  });
}
