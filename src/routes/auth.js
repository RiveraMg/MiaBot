import bcrypt from 'bcryptjs';

export default async function authRoutes(fastify, options) {
  const { prisma } = fastify;

  // POST /api/auth/login - Iniciar sesión
  fastify.post('/login', {
    schema: {
      description: 'Iniciar sesión',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body;

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    if (!user.isActive) {
      return reply.status(401).send({ error: 'Usuario desactivado' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      companyId: user.companyId,
    });

    // Remover password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  });

  // GET /api/auth/me - Obtener usuario actual
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener información del usuario actual',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      include: { company: true },
    });

    if (!user) {
      return reply.status(404).send({ error: 'Usuario no encontrado' });
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  // PUT /api/auth/password - Cambiar contraseña
  fastify.put('/password', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Cambiar contraseña',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
    },
  }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body;

    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
    });

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Contraseña actual incorrecta' });
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: request.user.id },
      data: { password: hashedPassword },
    });

    return { message: 'Contraseña actualizada correctamente' };
  });
}
