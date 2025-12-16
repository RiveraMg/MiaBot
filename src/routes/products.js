export default async function productsRoutes(fastify, options) {
  const { prisma } = fastify;

  // Middleware para verificar acceso a Finanzas
  const checkFinanceAccess = async (request, reply) => {
    await request.jwtVerify();
    const { role, department } = request.user;
    if (role !== 'ADMIN' && department !== 'FINANCE') {
      return reply.status(403).send({ error: 'No tienes acceso al módulo de inventario' });
    }
  };

  // GET /api/products - Listar productos
  fastify.get('/', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Listar productos del inventario',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          categoryId: { type: 'string' },
          lowStock: { type: 'boolean' },
          isActive: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { search, categoryId, lowStock, isActive } = request.query;

    const where = {
      companyId: request.user.companyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive;

    let products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    // Filtrar por stock bajo
    if (lowStock) {
      products = products.filter(p => p.stock <= p.minStock);
    }

    return products;
  });

  // GET /api/products/low-stock - Productos con stock bajo
  fastify.get('/low-stock', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Obtener productos con stock bajo',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const products = await prisma.product.findMany({
      where: {
        companyId: request.user.companyId,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    // Filtrar productos donde stock <= minStock
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);

    return lowStockProducts.map(p => ({
      ...p,
      stockStatus: p.stock === 0 ? 'AGOTADO' : 'BAJO',
      deficit: p.minStock - p.stock,
    }));
  });

  // GET /api/products/categories - Listar categorías
  fastify.get('/categories', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Listar categorías de productos',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  });

  // GET /api/products/:id - Obtener producto por ID
  fastify.get('/:id', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Obtener producto por ID',
      tags: ['Products'],
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

    const product = await prisma.product.findFirst({
      where: {
        id,
        companyId: request.user.companyId,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      return reply.status(404).send({ error: 'Producto no encontrado' });
    }

    return product;
  });

  // POST /api/products - Crear producto
  fastify.post('/', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Crear nuevo producto',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'costPrice', 'salePrice'],
        properties: {
          sku: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          stock: { type: 'integer', minimum: 0 },
          minStock: { type: 'integer', minimum: 0 },
          unit: { type: 'string' },
          costPrice: { type: 'number', minimum: 0 },
          salePrice: { type: 'number', minimum: 0 },
          categoryId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const data = request.body;

    const product = await prisma.product.create({
      data: {
        ...data,
        companyId: request.user.companyId,
      },
      include: {
        category: true,
      },
    });

    return reply.status(201).send(product);
  });

  // PUT /api/products/:id - Actualizar producto
  fastify.put('/:id', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Actualizar producto',
      tags: ['Products'],
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
          sku: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          stock: { type: 'integer', minimum: 0 },
          minStock: { type: 'integer', minimum: 0 },
          unit: { type: 'string' },
          costPrice: { type: 'number', minimum: 0 },
          salePrice: { type: 'number', minimum: 0 },
          categoryId: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    // Verificar que el producto pertenece a la empresa
    const existing = await prisma.product.findFirst({
      where: { id, companyId: request.user.companyId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Producto no encontrado' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: request.body,
      include: {
        category: true,
      },
    });

    return product;
  });

  // PATCH /api/products/:id/stock - Ajustar stock
  fastify.patch('/:id/stock', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Ajustar stock de producto',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['adjustment'],
        properties: {
          adjustment: { type: 'integer' }, // Positivo para agregar, negativo para restar
          reason: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { adjustment, reason } = request.body;

    // Verificar que el producto pertenece a la empresa
    const existing = await prisma.product.findFirst({
      where: { id, companyId: request.user.companyId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Producto no encontrado' });
    }

    const newStock = existing.stock + adjustment;
    if (newStock < 0) {
      return reply.status(400).send({ error: 'El stock no puede ser negativo' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });

    return {
      ...product,
      previousStock: existing.stock,
      adjustment,
      reason,
    };
  });

  // DELETE /api/products/:id - Desactivar producto
  fastify.delete('/:id', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Desactivar producto',
      tags: ['Products'],
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

    // Verificar que el producto pertenece a la empresa
    const existing = await prisma.product.findFirst({
      where: { id, companyId: request.user.companyId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Producto no encontrado' });
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Producto desactivado correctamente' };
  });

  // POST /api/products/categories - Crear categoría
  fastify.post('/categories', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Crear categoría de productos',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { name } = request.body;

    const category = await prisma.category.create({
      data: { name },
    });

    return reply.status(201).send(category);
  });
}
