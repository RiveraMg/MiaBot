import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Importar plugins y rutas
import prismaPlugin from './plugins/prisma.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import productsRoutes from './routes/products.js';
import clientsRoutes from './routes/clients.js';
import suppliersRoutes from './routes/suppliers.js';
import invoicesRoutes from './routes/invoices.js';
import tasksRoutes from './routes/tasks.js';
import eventsRoutes from './routes/events.js';
import leaveRequestsRoutes from './routes/leaveRequests.js';
import chatRoutes from './routes/chat.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationsRoutes from './routes/notifications.js';
import filesRoutes from './routes/files.js';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Registrar plugins
await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'miabot-secret-key-change-in-production',
  sign: {
    expiresIn: '7d',
  },
});

await app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Swagger para documentación API
await app.register(swagger, {
  openapi: {
    info: {
      title: 'MiaBot API',
      description: 'API del Asistente Inteligente para PYMES',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
});

// Plugin de Prisma
await app.register(prismaPlugin);

// Decorador para verificar autenticación
app.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'No autorizado' });
  }
});

// Decorador para verificar roles
app.decorate('authorize', function (allowedRoles) {
  return async function (request, reply) {
    await request.jwtVerify();
    if (!allowedRoles.includes(request.user.role)) {
      reply.status(403).send({ error: 'Acceso denegado' });
    }
  };
});

// Decorador para verificar departamento
app.decorate('authorizeDepart', function (allowedDepartments) {
  return async function (request, reply) {
    await request.jwtVerify();
    const { role, department } = request.user;
    
    // Admin tiene acceso a todo
    if (role === 'ADMIN') return;
    
    // Verificar departamento
    if (!allowedDepartments.includes(department)) {
      reply.status(403).send({ error: 'No tienes acceso a este módulo' });
    }
  };
});

// Ruta de salud
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Ruta raíz
app.get('/', async () => {
  return {
    name: 'MiaBot API',
    version: '1.0.0',
    description: 'Asistente Inteligente para Automatización de Procesos en PYMES',
    docs: '/docs',
  };
});

// Registrar rutas
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(usersRoutes, { prefix: '/api/users' });
await app.register(productsRoutes, { prefix: '/api/products' });
await app.register(clientsRoutes, { prefix: '/api/clients' });
await app.register(suppliersRoutes, { prefix: '/api/suppliers' });
await app.register(invoicesRoutes, { prefix: '/api/invoices' });
await app.register(tasksRoutes, { prefix: '/api/tasks' });
await app.register(eventsRoutes, { prefix: '/api/events' });
await app.register(leaveRequestsRoutes, { prefix: '/api/leave-requests' });
await app.register(chatRoutes, { prefix: '/api/chat' });
await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
await app.register(notificationsRoutes, { prefix: '/api/notifications' });
await app.register(filesRoutes, { prefix: '/api/files' });

// Manejador de errores global
app.setErrorHandler(function (error, request, reply) {
  this.log.error(error);
  
  // Error de validación de Prisma
  if (error.code === 'P2002') {
    return reply.status(409).send({
      error: 'Ya existe un registro con estos datos',
      field: error.meta?.target,
    });
  }
  
  // Error de registro no encontrado
  if (error.code === 'P2025') {
    return reply.status(404).send({
      error: 'Registro no encontrado',
    });
  }
  
  reply.status(error.statusCode || 500).send({
    error: error.message || 'Error interno del servidor',
  });
});

// Iniciar servidor
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`\n🤖 MiaBot API corriendo en http://localhost:${port}`);
    console.log(`📚 Documentación en http://localhost:${port}/docs\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
