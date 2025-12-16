import OpenAI from 'openai';

export default async function chatRoutes(fastify, options) {
  const { prisma } = fastify;

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY no está configurada en el entorno');
  }

  // Usar Groq (compatible con OpenAI SDK)
  const openai = new OpenAI({
    apiKey: groqApiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  // Función para obtener contexto según departamento
  const getContextForDepartment = async (companyId, department, role) => {
    const context = {
      products: [],
      clients: [],
      invoices: [],
      tasks: [],
      events: [],
      employees: [],
      leaveRequests: [],
    };

    // Admin y Finanzas: acceso a inventario, facturas, clientes
    if (role === 'ADMIN' || department === 'FINANCE') {
      context.products = await prisma.product.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true, sku: true, stock: true, minStock: true, salePrice: true },
        take: 50,
      });

      context.clients = await prisma.client.findMany({
        where: { companyId },
        select: { id: true, name: true, email: true, phone: true },
        take: 50,
      });

      context.invoices = await prisma.invoice.findMany({
        where: { companyId, status: { in: ['SENT', 'OVERDUE'] } },
        include: { client: { select: { name: true } } },
        take: 20,
      });
    }

    // Admin y RRHH: acceso a empleados, eventos, permisos
    if (role === 'ADMIN' || department === 'HR') {
      context.employees = await prisma.user.findMany({
        where: { companyId, role: 'EMPLOYEE', isActive: true },
        select: { id: true, name: true, department: true, position: true, birthDate: true, contractEnd: true },
        take: 50,
      });

      context.leaveRequests = await prisma.leaveRequest.findMany({
        where: { status: 'PENDING', user: { companyId } },
        include: { user: { select: { name: true } } },
        take: 20,
      });
    }

    // Todos: tareas y eventos
    context.tasks = await prisma.task.findMany({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
      select: { id: true, title: true, status: true, priority: true, dueDate: true },
      take: 20,
    });

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    context.events = await prisma.event.findMany({
      where: {
        companyId,
        startDate: { gte: today, lte: nextWeek },
      },
      take: 10,
    });

    return context;
  };

  // Función para generar el system prompt según el tipo de chat
  const getSystemPrompt = (type, department, context) => {
    const basePrompt = `Eres MiaBot, un asistente virtual inteligente para PYMES. 
Eres amable, profesional y eficiente. Respondes en español o inglés.
Fecha actual: ${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    if (type === 'EXTERNAL') {
      return `${basePrompt}

Eres el asistente de atención al cliente. Puedes ayudar con:
- Consultar disponibilidad y precios de productos
- Información sobre horarios de atención
- Estado de pedidos (si proporcionan número de factura) y de la factura
- Preguntas frecuentes sobre la empresa
- Registrar quejas o solicitudes

NO puedes:
- Dar información confidencial de la empresa
- Acceder a datos internos de empleados
- Modificar datos del sistema

Sé amable y si no puedes ayudar con algo, sugiere contactar directamente a la empresa.`;
    }

    // Chat interno
    let internalPrompt = `${basePrompt}

Eres el asistente interno de la empresa. El usuario es un empleado del departamento de ${department || 'la empresa'}.

Puedes ayudar con:
- Consultar información del sistema
- Crear tareas y recordatorios
- Crear eventos y reuniones
- Crear permisos
- Crear clientes
- Crear facturas
- Crear productos
- Crear usuarios
- Buscar información de inventario, clientes, facturas
- Consultar eventos y reuniones
- Responder preguntas sobre procesos internos
- Modificar datos del sistema

CONTEXTO ACTUAL DEL SISTEMA:
`;

    if (context.products?.length > 0) {
      const lowStock = context.products.filter(p => p.stock <= p.minStock);
      internalPrompt += `\n📦 INVENTARIO: ${context.products.length} productos activos.`;
      if (lowStock.length > 0) {
        internalPrompt += ` ⚠️ ${lowStock.length} con stock bajo: ${lowStock.map(p => `${p.name} (${p.stock})`).join(', ')}`;
      }
    }

    if (context.invoices?.length > 0) {
      internalPrompt += `\n💰 FACTURAS PENDIENTES: ${context.invoices.length} facturas por cobrar.`;
    }

    if (context.tasks?.length > 0) {
      internalPrompt += `\n📋 TAREAS PENDIENTES: ${context.tasks.length} tareas activas.`;
    }

    if (context.events?.length > 0) {
      internalPrompt += `\n📅 EVENTOS PRÓXIMOS: ${context.events.map(e => `${e.title} (${new Date(e.startDate).toLocaleDateString('es-CO')})`).join(', ')}`;
    }

    if (context.leaveRequests?.length > 0) {
      internalPrompt += `\n🏖️ PERMISOS PENDIENTES: ${context.leaveRequests.length} solicitudes por revisar.`;
    }

    internalPrompt += `

Cuando el usuario pregunte por datos específicos, proporciona la información disponible.
Si necesitas crear algo (tarea, evento, etc.), confirma los detalles antes de proceder.
Responde de forma concisa pero completa.`;

    return internalPrompt;
  };

  // POST /api/chat/internal - Chat interno (requiere autenticación)
  fastify.post('/internal', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Enviar mensaje al chat interno (empleados)',
      tags: ['Chat'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string' },
          sessionId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { message, sessionId } = request.body;
    const { id: userId, companyId, department, role, name } = request.user;

    try {
      // Obtener o crear sesión
      let session;
      if (sessionId) {
        session = await prisma.chatSession.findFirst({
          where: { id: sessionId, companyId },
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        });
      }

      if (!session) {
        session = await prisma.chatSession.create({
          data: {
            type: 'INTERNAL',
            companyId,
          },
          include: { messages: true },
        });
      }

      // Guardar mensaje del usuario
      await prisma.chatMessage.create({
        data: {
          content: message,
          role: 'USER',
          sessionId: session.id,
          userId,
        },
      });

      // Obtener contexto según departamento
      const context = await getContextForDepartment(companyId, department, role);

      // Construir historial de mensajes para OpenAI
      const messages = [
        { role: 'system', content: getSystemPrompt('INTERNAL', department, context) },
      ];

      // Agregar historial de la conversación
      const history = session.messages.reverse().slice(-8);
      for (const msg of history) {
        messages.push({
          role: msg.role === 'USER' ? 'user' : 'assistant',
          content: msg.content,
        });
      }

      // Agregar mensaje actual
      messages.push({ role: 'user', content: message });

      // Llamar a OpenAI (Groq)
      const completion = await openai.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const assistantMessage = completion.choices[0].message.content;

      // Guardar respuesta del asistente
      await prisma.chatMessage.create({
        data: {
          content: assistantMessage,
          role: 'ASSISTANT',
          sessionId: session.id,
        },
      });

      return {
        sessionId: session.id,
        message: assistantMessage,
        context: {
          department,
          userName: name,
        },
      };
    } catch (error) {
      fastify.log.error(error);
      
      if (error.code === 'insufficient_quota' || error.status === 429) {
        return reply.status(503).send({
          error: 'El servicio de IA está temporalmente no disponible. Por favor intenta más tarde.',
        });
      }

      return reply.status(500).send({
        error: 'Error al procesar el mensaje',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });

  // POST /api/chat/external - Chat externo (público, sin autenticación)
  fastify.post('/external', {
    schema: {
      description: 'Enviar mensaje al chat externo (clientes/público)',
      tags: ['Chat'],
      body: {
        type: 'object',
        required: ['message', 'companyId'],
        properties: {
          message: { type: 'string' },
          companyId: { type: 'string' },
          sessionId: { type: 'string' },
          visitorName: { type: 'string' },
          visitorEmail: { type: 'string' },
          visitorPhone: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { message, companyId, sessionId, visitorName, visitorEmail, visitorPhone } = request.body;

    try {
      // Verificar que la empresa existe
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return reply.status(404).send({ error: 'Empresa no encontrada' });
      }

      // Obtener o crear sesión
      let session;
      if (sessionId) {
        session = await prisma.chatSession.findFirst({
          where: { id: sessionId, companyId, type: 'EXTERNAL' },
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        });
      }

      if (!session) {
        session = await prisma.chatSession.create({
          data: {
            type: 'EXTERNAL',
            companyId,
            visitorName,
            visitorEmail,
            visitorPhone,
          },
          include: { messages: true },
        });
      }

      // Guardar mensaje del visitante
      await prisma.chatMessage.create({
        data: {
          content: message,
          role: 'USER',
          sessionId: session.id,
        },
      });

      // Obtener productos públicos para contexto
      const products = await prisma.product.findMany({
        where: { companyId, isActive: true },
        select: { name: true, salePrice: true, stock: true, description: true },
        take: 30,
      });

      // Construir contexto público
      let publicContext = `
INFORMACIÓN DE LA EMPRESA:
- Nombre: ${company.name}
- Teléfono: ${company.phone || 'No disponible'}
- Email: ${company.email || 'No disponible'}
- Dirección: ${company.address || 'No disponible'}

PRODUCTOS DISPONIBLES:
${products.map(p => `- ${p.name}: $${Number(p.salePrice).toLocaleString('es-CO')} (${p.stock > 0 ? 'Disponible' : 'Agotado'})`).join('\n')}
`;

      // Construir mensajes para OpenAI
      const messages = [
        { role: 'system', content: getSystemPrompt('EXTERNAL', null, {}) + '\n' + publicContext },
      ];

      // Agregar historial
      const history = session.messages.reverse().slice(-6);
      for (const msg of history) {
        messages.push({
          role: msg.role === 'USER' ? 'user' : 'assistant',
          content: msg.content,
        });
      }

      messages.push({ role: 'user', content: message });

      // Llamar a OpenAI (Groq)
      const completion = await openai.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const assistantMessage = completion.choices[0].message.content;

      // Guardar respuesta
      await prisma.chatMessage.create({
        data: {
          content: assistantMessage,
          role: 'ASSISTANT',
          sessionId: session.id,
        },
      });

      return {
        sessionId: session.id,
        message: assistantMessage,
        company: {
          name: company.name,
        },
      };
    } catch (error) {
      fastify.log.error(error);

      if (error.code === 'insufficient_quota' || error.status === 429) {
        return reply.status(503).send({
          error: 'El servicio está temporalmente no disponible. Por favor intenta más tarde.',
        });
      }

      return reply.status(500).send({
        error: 'Error al procesar el mensaje',
      });
    }
  });

  // GET /api/chat/sessions - Listar sesiones de chat (Admin)
  fastify.get('/sessions', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Listar sesiones de chat',
      tags: ['Chat'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['INTERNAL', 'EXTERNAL'] },
        },
      },
    },
  }, async (request, reply) => {
    const { type } = request.query;
    const { role, companyId } = request.user;

    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Solo administradores pueden ver sesiones' });
    }

    const where = { companyId };
    if (type) where.type = type;

    const sessions = await prisma.chatSession.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return sessions;
  });

  // GET /api/chat/sessions/:id - Obtener historial de una sesión
  fastify.get('/sessions/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener historial de una sesión de chat',
      tags: ['Chat'],
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
    const { companyId } = request.user;

    const session = await prisma.chatSession.findFirst({
      where: { id, companyId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return reply.status(404).send({ error: 'Sesión no encontrada' });
    }

    return session;
  });

  // POST /api/chat/action - Ejecutar acción desde el chat
  fastify.post('/action', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Ejecutar acción desde el chat (crear tarea, etc.)',
      tags: ['Chat'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['action', 'data'],
        properties: {
          action: { type: 'string', enum: ['CREATE_TASK', 'CREATE_EVENT', 'CHECK_STOCK', 'CHECK_INVOICE'] },
          data: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    const { action, data } = request.body;
    const { id: userId, companyId, department } = request.user;

    try {
      switch (action) {
        case 'CREATE_TASK': {
          const task = await prisma.task.create({
            data: {
              title: data.title,
              description: data.description,
              priority: data.priority || 'MEDIUM',
              dueDate: data.dueDate ? new Date(data.dueDate) : null,
              department,
              createdById: userId,
              assigneeId: data.assigneeId || userId,
            },
          });
          return { success: true, message: 'Tarea creada', data: task };
        }

        case 'CREATE_EVENT': {
          const event = await prisma.event.create({
            data: {
              title: data.title,
              description: data.description,
              type: data.type || 'OTHER',
              startDate: new Date(data.startDate),
              endDate: data.endDate ? new Date(data.endDate) : null,
              allDay: data.allDay || false,
              reminderDays: data.reminderDays || 1,
              companyId,
            },
          });
          return { success: true, message: 'Evento creado', data: event };
        }

        case 'CHECK_STOCK': {
          const products = await prisma.product.findMany({
            where: {
              companyId,
              isActive: true,
              OR: data.productName ? [
                { name: { contains: data.productName, mode: 'insensitive' } },
                { sku: { contains: data.productName, mode: 'insensitive' } },
              ] : undefined,
            },
            select: { name: true, sku: true, stock: true, minStock: true, salePrice: true },
          });
          return { success: true, data: products };
        }

        case 'CHECK_INVOICE': {
          const invoice = await prisma.invoice.findFirst({
            where: {
              companyId,
              number: data.invoiceNumber,
            },
            include: {
              client: true,
              items: true,
              payments: true,
            },
          });
          return { success: true, data: invoice };
        }

        default:
          return reply.status(400).send({ error: 'Acción no válida' });
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al ejecutar la acción' });
    }
  });
}
