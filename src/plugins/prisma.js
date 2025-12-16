import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

async function prismaPlugin(fastify, options) {
  // Decorar fastify con el cliente de Prisma
  fastify.decorate('prisma', prisma);

  // Cerrar conexión cuando el servidor se detenga
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
}

export default fp(prismaPlugin);
