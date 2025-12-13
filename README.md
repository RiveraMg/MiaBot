# 🤖 MiaBot - Asistente Inteligente para PYMES

MiaBot es un dashboard inteligente diseñado para automatizar procesos internos operativos y administrativos de PYMES, con asistencia conversacional integrada que facilita la gestión diaria.

## Características Principales

### Sistema de Roles
- **ADMIN** - Acceso total a todos los módulos
- **EMPLOYEE** - Acceso por departamento (FINANCE o HR)
- **EXTERNAL** - Solo chat externo (clientes/proveedores)

### Módulos por Departamento

#### Finanzas (FINANCE)
- Gestión de inventario con alertas de stock bajo
- Facturación digital con seguimiento de pagos
- Gestión de clientes y proveedores
- Recordatorios de cobro automatizados

#### Recursos Humanos (HR)
- Gestión de empleados y contratos
- Eventos y reuniones (cumpleaños, capacitaciones, etc.)
- Solicitudes de permisos y vacaciones
- Alertas de vencimiento de contratos

### Sistema de Chat Dual
- **Chat Interno**: Para empleados autenticados
  - Consultas de inventario, facturas, tareas
  - Creación de tareas y eventos por chat
  - Acceso a información según departamento
  
- **Chat Externo**: Para clientes/público (sin login)
  - Consultas de productos y precios
  - Estado de pedidos
  - Preguntas frecuentes
  - Registro de quejas/solicitudes

### Dashboard Inteligente
- Métricas en tiempo real por departamento
- Alertas automáticas (stock bajo, facturas vencidas, etc.)
- Atajos rápidos personalizados

### Integración con Google Drive
- Lectura de archivos
- Subida de documentos
- Búsqueda de archivos

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Fastify
- **Base de Datos**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **IA**: OpenAI API (GPT-4o-mini)
- **Archivos**: Google Drive API + Local
- **Contenedores**: Docker + Docker Compose

## Instalación

### 1. Clonar e instalar dependencias

```bash
cd Miabot
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
# Base de Datos - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# JWT Secret
JWT_SECRET="tu-secreto-super-seguro"

# OpenAI API Key
OPENAI_API_KEY="sk-..."

# Google Drive (opcional)
GOOGLE_CLIENT_ID="tu-client-id"
GOOGLE_CLIENT_SECRET="tu-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/files/drive/callback"

# Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### 3. Configurar base de datos

```bash
# Generar cliente de Prisma
npm run db:generate

# Crear tablas en la base de datos
npm run db:push

# Cargar datos de prueba
npm run db:seed
```

### 4. Iniciar el servidor

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Docker

### Ejecutar con Docker Compose (recomendado)

```bash
# Construir y ejecutar
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

### Ejecutar con Docker manual

```bash
# Construir imagen
docker build -t miabot .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env -v ./uploads:/app/uploads miabot
```

### Comandos útiles

```bash
# Reconstruir después de cambios
docker-compose up --build -d

# Ver estado de contenedores
docker-compose ps

# Ejecutar comandos dentro del contenedor
docker-compose exec miabot sh
```

## Documentación API

La documentación Swagger está disponible en:
```
http://localhost:3000/docs
```

## Credenciales de Prueba

Después de ejecutar el seed:

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | admin@miabot.com | admin123 | ADMIN |
| Finanzas | finanzas@miabot.com | admin123 | EMPLOYEE (FINANCE) |
| RRHH | rrhh@miabot.com | admin123 | EMPLOYEE (HR) |

## Endpoints Principales

### Autenticación
```
POST /api/auth/login          # Iniciar sesión
GET  /api/auth/me             # Usuario actual
PUT  /api/auth/password       # Cambiar contraseña
```

> **Nota:** No hay registro público. Los usuarios son creados por el Admin desde `/api/users`.

### Dashboard
```
GET /api/dashboard            # Dashboard según departamento
GET /api/dashboard/metrics/finance  # Métricas financieras
GET /api/dashboard/metrics/hr       # Métricas de RRHH
```

### Chat
```
POST /api/chat/internal       # Chat interno (autenticado)
POST /api/chat/external       # Chat externo (público)
POST /api/chat/action         # Ejecutar acción desde chat
```

### Inventario (FINANCE)
```
GET    /api/products          # Listar productos
GET    /api/products/low-stock # Productos con stock bajo
POST   /api/products          # Crear producto
PATCH  /api/products/:id/stock # Ajustar stock
```

### Facturación (FINANCE)
```
GET  /api/invoices            # Listar facturas
GET  /api/invoices/pending    # Facturas pendientes
POST /api/invoices            # Crear factura
POST /api/invoices/:id/payments # Registrar pago
```

### Eventos (HR)
```
GET  /api/events              # Listar eventos
GET  /api/events/upcoming     # Próximos eventos
POST /api/events              # Crear evento
```

### Permisos (HR)
```
GET  /api/leave-requests      # Listar solicitudes
POST /api/leave-requests      # Crear solicitud
PUT  /api/leave-requests/:id/respond # Aprobar/Rechazar
```

### Archivos
```
POST /api/files/upload           # Subir archivo local
GET  /api/files                  # Listar archivos
GET  /api/files/:id/download     # Descargar archivo
DELETE /api/files/:id            # Eliminar archivo
```

### Google Drive
```
GET  /api/files/drive/auth-url   # Obtener URL de autorización
GET  /api/files/drive/callback   # Callback OAuth
GET  /api/files/drive/list       # Listar archivos de Drive
GET  /api/files/drive/search     # Buscar en Drive
POST /api/files/drive/upload     # Subir a Google Drive
GET  /api/files/drive/:id/content # Leer contenido de archivo
```

## Automatizaciones (n8n)

El sistema está preparado para integrarse con n8n para:

1. **Alertas de inventario bajo**
   - Trigger: Stock < mínimo
   - Acción: Email automático

2. **Recordatorios de facturas**
   - Trigger: 3 días antes de vencimiento
   - Acción: Notificación + Email

3. **Facturas vencidas**
   - Trigger: Fecha límite pasada
   - Acción: Cambiar estado a OVERDUE

4. **Resumen diario**
   - Trigger: 8:00 AM
   - Acción: Email con métricas

5. **Eventos de RRHH**
   - Cumpleaños, contratos por vencer, etc.

## 📁 Estructura del Proyecto

```
Miabot/
├── prisma/
│   ├── schema.prisma      # Modelo de datos
│   └── seed.js            # Datos iniciales
├── src/
│   ├── plugins/
│   │   └── prisma.js      # Plugin de Prisma
│   ├── routes/
│   │   ├── auth.js        # Autenticación
│   │   ├── users.js       # Usuarios
│   │   ├── products.js    # Inventario
│   │   ├── clients.js     # Clientes
│   │   ├── suppliers.js   # Proveedores
│   │   ├── invoices.js    # Facturación
│   │   ├── tasks.js       # Tareas
│   │   ├── events.js      # Eventos
│   │   ├── leaveRequests.js # Permisos
│   │   ├── chat.js        # Chat IA
│   │   ├── dashboard.js   # Dashboard
│   │   ├── notifications.js # Notificaciones
│   │   └── files.js       # Archivos
│   ├── services/
│   │   └── googleDrive.js # Integración Drive
│   └── server.js          # Servidor principal
├── database/
│   ├── schema.sql         # Script SQL de referencia
│   └── DIAGRAMA_BD.md     # Diagrama de la BD
├── uploads/               # Archivos locales
├── .env.example
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## ✅ Funcionalidades Implementadas

- [x] Backend completo con Fastify
- [x] Base de datos PostgreSQL con Prisma
- [x] Autenticación JWT
- [x] Sistema de roles (Admin, Employee, External)
- [x] Módulos de Finanzas (inventario, facturas, clientes, proveedores)
- [x] Módulos de RRHH (eventos, permisos, empleados)
- [x] Dashboard con métricas por departamento
- [x] Chat con IA (OpenAI GPT-4o-mini)
- [x] Integración con Google Drive
- [x] Gestión de archivos locales
- [x] Docker y Docker Compose
- [x] Documentación Swagger

## Próximos Pasos

1. [ ] Frontend con React + TailwindCSS
2. [ ] Integración con Google Calendar
3. [ ] Integración completa con n8n
4. [ ] Notificaciones push
5. [ ] Reportes PDF
6. [ ] Multi-empresa (SaaS)

## Licencia

MIT

---

Desarrollado con ❤️ para las PYMES de Colombia
