import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de MiaBot...');

  // Crear empresa demo
  const company = await prisma.company.upsert({
    where: { nit: '900123456-1' },
    update: {},
    create: {
      name: 'PYME Demo S.A.S',
      nit: '900123456-1',
      email: 'contacto@pymedemo.com',
      phone: '+57 300 123 4567',
      address: 'Calle 72 #45-30, Barranquilla, Colombia',
    },
  });

  console.log('✅ Empresa creada:', company.name);

  // Crear categorías de productos
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-electronica' },
      update: {},
      create: { id: 'cat-electronica', name: 'Electrónica' },
    }),
    prisma.category.upsert({
      where: { id: 'cat-oficina' },
      update: {},
      create: { id: 'cat-oficina', name: 'Oficina' },
    }),
    prisma.category.upsert({
      where: { id: 'cat-servicios' },
      update: {},
      create: { id: 'cat-servicios', name: 'Servicios' },
    }),
  ]);

  console.log('✅ Categorías creadas:', categories.length);

  // Crear usuario Admin
  const hashedPassword = await bcrypt.hash('MiaBot123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'Miabotofficial@gmail.com' },
    update: {},
    create: {
      email: 'Miabotofficial@gmail.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
      position: 'Gerente General',
      companyId: company.id,
    },
  });

  console.log('✅ Admin creado:', admin.email);

  // Crear empleado de Finanzas
  const financeUser = await prisma.user.upsert({
    where: { email: 'finanzas@miabot.com' },
    update: {},
    create: {
      email: 'finanzas@miabot.com',
      password: hashedPassword,
      name: 'María García',
      role: 'EMPLOYEE',
      department: 'FINANCE',
      position: 'Contador',
      hireDate: new Date('2023-01-15'),
      birthDate: new Date('1990-05-20'),
      companyId: company.id,
    },
  });

  console.log('✅ Usuario Finanzas creado:', financeUser.email);

  // Crear empleado de RRHH
  const hrUser = await prisma.user.upsert({
    where: { email: 'rrhh@miabot.com' },
    update: {},
    create: {
      email: 'rrhh@miabot.com',
      password: hashedPassword,
      name: 'Carlos Pérez',
      role: 'EMPLOYEE',
      department: 'HR',
      position: 'Coordinador de RRHH',
      hireDate: new Date('2022-06-01'),
      birthDate: new Date('1988-11-15'),
      companyId: company.id,
    },
  });

  console.log('✅ Usuario RRHH creado:', hrUser.email);

  // Crear productos de ejemplo
  const products = await Promise.all([
    prisma.product.upsert({
      where: { companyId_sku: { companyId: company.id, sku: 'LAPTOP-001' } },
      update: {},
      create: {
        sku: 'LAPTOP-001',
        name: 'Laptop HP ProBook',
        description: 'Laptop empresarial 15.6" Intel i5',
        stock: 10,
        minStock: 3,
        unit: 'unidad',
        costPrice: 2500000,
        salePrice: 3200000,
        categoryId: 'cat-electronica',
        companyId: company.id,
      },
    }),
    prisma.product.upsert({
      where: { companyId_sku: { companyId: company.id, sku: 'MOUSE-001' } },
      update: {},
      create: {
        sku: 'MOUSE-001',
        name: 'Mouse Inalámbrico Logitech',
        description: 'Mouse ergonómico inalámbrico',
        stock: 25,
        minStock: 10,
        unit: 'unidad',
        costPrice: 45000,
        salePrice: 75000,
        categoryId: 'cat-electronica',
        companyId: company.id,
      },
    }),
    prisma.product.upsert({
      where: { companyId_sku: { companyId: company.id, sku: 'PAPEL-001' } },
      update: {},
      create: {
        sku: 'PAPEL-001',
        name: 'Resma Papel Carta',
        description: 'Resma de papel carta 500 hojas',
        stock: 5, // Stock bajo para probar alertas
        minStock: 10,
        unit: 'resma',
        costPrice: 12000,
        salePrice: 18000,
        categoryId: 'cat-oficina',
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Productos creados:', products.length);

  // Crear clientes de ejemplo
  const client = await prisma.client.upsert({
    where: { id: 'client-demo-1' },
    update: {},
    create: {
      id: 'client-demo-1',
      name: 'Empresa ABC S.A.S',
      email: 'compras@empresaabc.com',
      phone: '+57 301 234 5678',
      nit: '800987654-3',
      address: 'Carrera 50 #80-25, Barranquilla',
      companyId: company.id,
    },
  });

  console.log('✅ Cliente creado:', client.name);

  // Crear proveedor de ejemplo
  const supplier = await prisma.supplier.upsert({
    where: { id: 'supplier-demo-1' },
    update: {},
    create: {
      id: 'supplier-demo-1',
      name: 'Distribuidora Tech Colombia',
      email: 'ventas@techcolombia.com',
      phone: '+57 302 345 6789',
      nit: '900111222-5',
      contactName: 'Pedro Martínez',
      companyId: company.id,
    },
  });

  console.log('✅ Proveedor creado:', supplier.name);

  // Crear factura de ejemplo
  const invoice = await prisma.invoice.upsert({
    where: { companyId_number: { companyId: company.id, number: 'FAC-001' } },
    update: {},
    create: {
      number: 'FAC-001',
      status: 'SENT',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días
      subtotal: 3275000,
      tax: 622250, // 19% IVA
      total: 3897250,
      clientId: client.id,
      companyId: company.id,
      items: {
        create: [
          {
            quantity: 1,
            unitPrice: 3200000,
            total: 3200000,
            description: 'Laptop HP ProBook',
            productId: products[0].id,
          },
          {
            quantity: 1,
            unitPrice: 75000,
            total: 75000,
            description: 'Mouse Inalámbrico Logitech',
            productId: products[1].id,
          },
        ],
      },
    },
  });

  console.log('✅ Factura creada:', invoice.number);

  // Crear eventos de ejemplo
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Reunión de equipo semanal',
        description: 'Revisión de avances y planificación',
        type: 'MEETING',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // En 2 días
        allDay: false,
        reminderDays: 1,
        companyId: company.id,
      },
    }),
    prisma.event.create({
      data: {
        title: `Cumpleaños de ${hrUser.name}`,
        type: 'BIRTHDAY',
        startDate: new Date('2024-11-15'),
        allDay: true,
        reminderDays: 3,
        companyId: company.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Capacitación: Nuevas herramientas digitales',
        description: 'Entrenamiento sobre uso de MiaBot',
        type: 'TRAINING',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // En 7 días
        allDay: false,
        reminderDays: 2,
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Eventos creados:', events.length);

  // Crear tareas de ejemplo
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Revisar facturas pendientes',
        description: 'Verificar estado de cobro de facturas del mes',
        status: 'PENDING',
        priority: 'HIGH',
        department: 'FINANCE',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdById: admin.id,
        assigneeId: financeUser.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Actualizar contratos de empleados',
        description: 'Renovar contratos que vencen este mes',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        department: 'HR',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        createdById: admin.id,
        assigneeId: hrUser.id,
      },
    }),
  ]);

  console.log('✅ Tareas creadas:', tasks.length);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de prueba:');
  console.log('   Admin: Miabotofficial@gmail.com / MiaBot123');
  console.log('   Finanzas: finanzas@miabot.com / admin123');
  console.log('   RRHH: rrhh@miabot.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
