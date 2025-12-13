export default async function dashboardRoutes(fastify, options) {
  const { prisma } = fastify;

  // GET /api/dashboard - Dashboard principal según departamento
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener datos del dashboard según el departamento del usuario',
      tags: ['Dashboard'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { role, department, companyId } = request.user;

    const dashboard = {
      user: {
        name: request.user.name,
        role,
        department,
      },
      alerts: [],
      metrics: {},
      shortcuts: [],
    };

    // Obtener alertas generales
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tareas pendientes del usuario
    const pendingTasks = await prisma.task.count({
      where: {
        OR: [
          { assigneeId: request.user.id },
          { createdById: request.user.id },
        ],
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    dashboard.metrics.pendingTasks = pendingTasks;

    // Eventos de hoy
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvents = await prisma.event.findMany({
      where: {
        companyId,
        startDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    dashboard.metrics.todayEvents = todayEvents.length;
    if (todayEvents.length > 0) {
      dashboard.alerts.push({
        type: 'EVENT_REMINDER',
        title: `${todayEvents.length} evento(s) hoy`,
        message: todayEvents.map(e => e.title).join(', '),
        priority: 'medium',
      });
    }

    // Dashboard específico por departamento
    if (role === 'ADMIN' || department === 'FINANCE') {
      // Métricas de Finanzas
      const lowStockProducts = await prisma.product.findMany({
        where: {
          companyId,
          isActive: true,
        },
      });

      const lowStock = lowStockProducts.filter(p => p.stock <= p.minStock);
      dashboard.metrics.lowStockProducts = lowStock.length;

      if (lowStock.length > 0) {
        dashboard.alerts.push({
          type: 'LOW_STOCK',
          title: `${lowStock.length} producto(s) con stock bajo`,
          message: lowStock.slice(0, 3).map(p => p.name).join(', '),
          priority: 'high',
        });
      }

      // Facturas pendientes
      const pendingInvoices = await prisma.invoice.count({
        where: {
          companyId,
          status: { in: ['SENT', 'OVERDUE'] },
        },
      });

      dashboard.metrics.pendingInvoices = pendingInvoices;

      // Facturas vencidas
      const overdueInvoices = await prisma.invoice.count({
        where: {
          companyId,
          status: 'OVERDUE',
        },
      });

      if (overdueInvoices > 0) {
        dashboard.alerts.push({
          type: 'INVOICE_OVERDUE',
          title: `${overdueInvoices} factura(s) vencida(s)`,
          message: 'Requieren atención inmediata',
          priority: 'urgent',
        });
      }

      // Facturas por vencer (próximos 3 días)
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const dueSoonInvoices = await prisma.invoice.findMany({
        where: {
          companyId,
          status: 'SENT',
          dueDate: {
            gte: today,
            lte: threeDaysFromNow,
          },
        },
        include: { client: true },
      });

      if (dueSoonInvoices.length > 0) {
        dashboard.alerts.push({
          type: 'INVOICE_DUE',
          title: `${dueSoonInvoices.length} factura(s) por vencer`,
          message: 'Vencen en los próximos 3 días',
          priority: 'high',
        });
      }

      // Total clientes
      dashboard.metrics.totalClients = await prisma.client.count({
        where: { companyId },
      });

      // Total productos
      dashboard.metrics.totalProducts = await prisma.product.count({
        where: { companyId, isActive: true },
      });

      // Atajos de Finanzas
      dashboard.shortcuts = [
        { id: 'inventory', label: 'Ver Inventario', icon: 'package', action: '/products' },
        { id: 'low-stock', label: 'Stock Bajo', icon: 'alert-triangle', action: '/products?lowStock=true' },
        { id: 'invoices', label: 'Facturas', icon: 'file-text', action: '/invoices' },
        { id: 'pending-invoices', label: 'Por Cobrar', icon: 'clock', action: '/invoices?status=SENT' },
        { id: 'clients', label: 'Clientes', icon: 'users', action: '/clients' },
        { id: 'new-invoice', label: 'Nueva Factura', icon: 'plus', action: '/invoices/new' },
      ];
    }

    if (role === 'ADMIN' || department === 'HR') {
      // Métricas de RRHH
      const totalEmployees = await prisma.user.count({
        where: {
          companyId,
          role: 'EMPLOYEE',
          isActive: true,
        },
      });

      dashboard.metrics.totalEmployees = totalEmployees;

      // Solicitudes de permisos pendientes
      const pendingLeaveRequests = await prisma.leaveRequest.count({
        where: {
          status: 'PENDING',
          user: { companyId },
        },
      });

      dashboard.metrics.pendingLeaveRequests = pendingLeaveRequests;

      if (pendingLeaveRequests > 0) {
        dashboard.alerts.push({
          type: 'LEAVE_REQUEST',
          title: `${pendingLeaveRequests} solicitud(es) de permiso pendiente(s)`,
          message: 'Requieren revisión',
          priority: 'medium',
        });
      }

      // Contratos por vencer (próximos 30 días)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringContracts = await prisma.user.findMany({
        where: {
          companyId,
          isActive: true,
          contractEnd: {
            gte: today,
            lte: thirtyDaysFromNow,
          },
        },
      });

      dashboard.metrics.expiringContracts = expiringContracts.length;

      if (expiringContracts.length > 0) {
        dashboard.alerts.push({
          type: 'CONTRACT_END',
          title: `${expiringContracts.length} contrato(s) por vencer`,
          message: expiringContracts.map(u => u.name).join(', '),
          priority: 'high',
        });
      }

      // Cumpleaños próximos (7 días)
      const users = await prisma.user.findMany({
        where: {
          companyId,
          isActive: true,
          birthDate: { not: null },
        },
      });

      const upcomingBirthdays = users.filter(user => {
        const birthday = new Date(user.birthDate);
        const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        return daysUntil <= 7;
      });

      dashboard.metrics.upcomingBirthdays = upcomingBirthdays.length;

      if (upcomingBirthdays.length > 0) {
        dashboard.alerts.push({
          type: 'BIRTHDAY',
          title: `${upcomingBirthdays.length} cumpleaños próximo(s)`,
          message: upcomingBirthdays.map(u => u.name).join(', '),
          priority: 'low',
        });
      }

      // Atajos de RRHH (agregar a los existentes si es Admin)
      const hrShortcuts = [
        { id: 'employees', label: 'Empleados', icon: 'users', action: '/users' },
        { id: 'leave-requests', label: 'Permisos', icon: 'calendar-off', action: '/leave-requests' },
        { id: 'events', label: 'Eventos', icon: 'calendar', action: '/events' },
        { id: 'birthdays', label: 'Cumpleaños', icon: 'cake', action: '/users/birthdays' },
        { id: 'contracts', label: 'Contratos', icon: 'file-signature', action: '/users/contracts' },
        { id: 'new-event', label: 'Nuevo Evento', icon: 'plus', action: '/events/new' },
      ];

      if (role === 'ADMIN') {
        dashboard.shortcuts = [...dashboard.shortcuts, ...hrShortcuts];
      } else {
        dashboard.shortcuts = hrShortcuts;
      }
    }

    // Ordenar alertas por prioridad
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    dashboard.alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return dashboard;
  });

  // GET /api/dashboard/metrics/finance - Métricas financieras detalladas
  fastify.get('/metrics/finance', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener métricas financieras detalladas',
      tags: ['Dashboard'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { role, department, companyId } = request.user;

    if (role !== 'ADMIN' && department !== 'FINANCE') {
      return reply.status(403).send({ error: 'No tienes acceso a este módulo' });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Ventas del mes actual
    const currentMonthInvoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: { not: 'CANCELLED' },
        issueDate: { gte: startOfMonth },
      },
    });

    const currentMonthTotal = currentMonthInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // Ventas del mes anterior
    const lastMonthInvoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: { not: 'CANCELLED' },
        issueDate: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    const lastMonthTotal = lastMonthInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // Cobrado vs Pendiente
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: 'PAID',
        issueDate: { gte: startOfMonth },
      },
    });

    const paidTotal = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // Valor del inventario
    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
    });

    const inventoryValue = products.reduce((sum, p) => sum + (p.stock * Number(p.costPrice)), 0);
    const inventorySaleValue = products.reduce((sum, p) => sum + (p.stock * Number(p.salePrice)), 0);

    return {
      currentMonth: {
        total: currentMonthTotal,
        invoiceCount: currentMonthInvoices.length,
        paid: paidTotal,
        pending: currentMonthTotal - paidTotal,
      },
      lastMonth: {
        total: lastMonthTotal,
        invoiceCount: lastMonthInvoices.length,
      },
      growth: lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : 0,
      inventory: {
        costValue: inventoryValue,
        saleValue: inventorySaleValue,
        productCount: products.length,
        totalUnits: products.reduce((sum, p) => sum + p.stock, 0),
      },
    };
  });

  // GET /api/dashboard/metrics/hr - Métricas de RRHH detalladas
  fastify.get('/metrics/hr', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Obtener métricas de RRHH detalladas',
      tags: ['Dashboard'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { role, department, companyId } = request.user;

    if (role !== 'ADMIN' && department !== 'HR') {
      return reply.status(403).send({ error: 'No tienes acceso a este módulo' });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Empleados por departamento
    const employeesByDept = await prisma.user.groupBy({
      by: ['department'],
      where: {
        companyId,
        role: 'EMPLOYEE',
        isActive: true,
      },
      _count: true,
    });

    // Solicitudes de permisos del mes
    const monthlyLeaveRequests = await prisma.leaveRequest.findMany({
      where: {
        user: { companyId },
        createdAt: { gte: startOfMonth },
      },
    });

    const leaveStats = {
      total: monthlyLeaveRequests.length,
      pending: monthlyLeaveRequests.filter(r => r.status === 'PENDING').length,
      approved: monthlyLeaveRequests.filter(r => r.status === 'APPROVED').length,
      rejected: monthlyLeaveRequests.filter(r => r.status === 'REJECTED').length,
    };

    // Eventos del mes
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthlyEvents = await prisma.event.count({
      where: {
        companyId,
        startDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    return {
      employees: {
        total: employeesByDept.reduce((sum, d) => sum + d._count, 0),
        byDepartment: employeesByDept.reduce((acc, d) => {
          acc[d.department || 'SIN_DEPARTAMENTO'] = d._count;
          return acc;
        }, {}),
      },
      leaveRequests: leaveStats,
      events: {
        thisMonth: monthlyEvents,
      },
    };
  });
}
