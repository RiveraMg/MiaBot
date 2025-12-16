export default async function invoicesRoutes(fastify, options) {
  const { prisma } = fastify;

  // Middleware para verificar acceso a Finanzas
  const checkFinanceAccess = async (request, reply) => {
    await request.jwtVerify();
    const { role, department } = request.user;
    if (role !== 'ADMIN' && department !== 'FINANCE') {
      return reply.status(403).send({ error: 'No tienes acceso al módulo de facturación' });
    }
  };

  // GET /api/invoices - Listar facturas
  fastify.get('/', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Listar facturas',
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] },
          clientId: { type: 'string' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
        },
      },
    },
  }, async (request, reply) => {
    const { status, clientId, startDate, endDate } = request.query;

    const where = {
      companyId: request.user.companyId,
    };

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = new Date(startDate);
      if (endDate) where.issueDate.lte = new Date(endDate);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        items: {
          include: { product: true },
        },
        payments: true,
      },
      orderBy: { issueDate: 'desc' },
    });

    return invoices;
  });

  // GET /api/invoices/pending - Facturas pendientes de pago
  fastify.get('/pending', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Obtener facturas pendientes de pago',
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: request.user.companyId,
        status: { in: ['SENT', 'OVERDUE'] },
      },
      include: {
        client: true,
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    return invoices.map(inv => {
      const totalPaid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balance = Number(inv.total) - totalPaid;
      const daysUntilDue = Math.ceil((new Date(inv.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        ...inv,
        totalPaid,
        balance,
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
      };
    });
  });

  // GET /api/invoices/due-soon - Facturas por vencer (próximos 7 días)
  fastify.get('/due-soon', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Obtener facturas que vencen pronto',
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: request.user.companyId,
        status: 'SENT',
        dueDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        client: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    return invoices.map(inv => ({
      ...inv,
      daysUntilDue: Math.ceil((new Date(inv.dueDate) - today) / (1000 * 60 * 60 * 24)),
    }));
  });

  // GET /api/invoices/:id - Obtener factura por ID
  fastify.get('/:id', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Obtener factura por ID',
      tags: ['Invoices'],
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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        companyId: request.user.companyId,
      },
      include: {
        client: true,
        items: {
          include: { product: true },
        },
        payments: true,
      },
    });

    if (!invoice) {
      return reply.status(404).send({ error: 'Factura no encontrada' });
    }

    return invoice;
  });

  // POST /api/invoices - Crear factura
  fastify.post('/', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Crear nueva factura',
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['clientId', 'dueDate', 'items'],
        properties: {
          clientId: { type: 'string' },
          dueDate: { type: 'string', format: 'date' },
          notes: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['quantity', 'unitPrice'],
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'integer', minimum: 1 },
                unitPrice: { type: 'number', minimum: 0 },
                description: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { clientId, dueDate, notes, items } = request.body;

    // Generar número de factura
    const lastInvoice = await prisma.invoice.findFirst({
      where: { companyId: request.user.companyId },
      orderBy: { createdAt: 'desc' },
    });

    const lastNumber = lastInvoice ? parseInt(lastInvoice.number.split('-')[1]) : 0;
    const invoiceNumber = `FAC-${String(lastNumber + 1).padStart(4, '0')}`;

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.19; // 19% IVA Colombia
    const total = subtotal + tax;

    // Crear factura con items
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        clientId,
        dueDate: new Date(dueDate),
        notes,
        subtotal,
        tax,
        total,
        companyId: request.user.companyId,
        items: {
          create: items.map(item => ({
            productId: item.productId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            description: item.description,
          })),
        },
      },
      include: {
        client: true,
        items: {
          include: { product: true },
        },
      },
    });

    return reply.status(201).send(invoice);
  });

  // PUT /api/invoices/:id/status - Actualizar estado de factura
  fastify.put('/:id/status', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Actualizar estado de factura',
      tags: ['Invoices'],
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
          status: { type: 'string', enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body;

    // Verificar que la factura pertenece a la empresa
    const existing = await prisma.invoice.findFirst({
      where: { id, companyId: request.user.companyId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Factura no encontrada' });
    }

    const updateData = { status };
    
    // Si se marca como pagada, registrar fecha de pago
    if (status === 'PAID') {
      updateData.paidDate = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        items: true,
      },
    });

    // Si se envía la factura, reducir stock de productos
    if (status === 'SENT' && existing.status === 'DRAFT') {
      for (const item of invoice.items) {
        if (item.productId) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
            },
          });
        }
      }
    }

    return invoice;
  });

  // POST /api/invoices/:id/payments - Registrar pago
  fastify.post('/:id/payments', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Registrar pago de factura',
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', minimum: 0 },
          method: { type: 'string' },
          reference: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { amount, method, reference, notes } = request.body;

    // Verificar que la factura pertenece a la empresa
    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId: request.user.companyId },
      include: { payments: true },
    });

    if (!invoice) {
      return reply.status(404).send({ error: 'Factura no encontrada' });
    }

    // Calcular saldo pendiente
    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Number(invoice.total) - totalPaid;

    if (amount > balance) {
      return reply.status(400).send({ 
        error: `El monto excede el saldo pendiente (${balance.toFixed(2)})` 
      });
    }

    // Crear pago
    const payment = await prisma.payment.create({
      data: {
        amount,
        method: method || 'efectivo',
        reference,
        notes,
        invoiceId: id,
      },
    });

    // Si el pago completa la factura, marcarla como pagada
    const newTotalPaid = totalPaid + amount;
    if (newTotalPaid >= Number(invoice.total)) {
      await prisma.invoice.update({
        where: { id },
        data: { 
          status: 'PAID',
          paidDate: new Date(),
        },
      });
    }

    return reply.status(201).send({
      payment,
      invoiceBalance: Number(invoice.total) - newTotalPaid,
    });
  });

  // DELETE /api/invoices/:id - Cancelar factura
  fastify.delete('/:id', {
    preHandler: [checkFinanceAccess],
    schema: {
      description: 'Cancelar factura',
      tags: ['Invoices'],
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

    // Verificar que la factura pertenece a la empresa
    const existing = await prisma.invoice.findFirst({
      where: { id, companyId: request.user.companyId },
      include: { payments: true },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Factura no encontrada' });
    }

    if (existing.payments.length > 0) {
      return reply.status(400).send({ 
        error: 'No se puede cancelar una factura con pagos registrados' 
      });
    }

    await prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Factura cancelada correctamente' };
  });
}
