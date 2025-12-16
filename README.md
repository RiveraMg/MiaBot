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

### Backend
- **Runtime**: Node.js 20
- **Framework**: Fastify
- **Base de Datos**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **IA**: Groq API (Llama) / OpenAI API (GPT-4o-mini)
- **Archivos**: Google Drive API + Local

### Frontend
- **Framework**: React 19 + Vite
- **Estilos**: TailwindCSS
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Iconos**: Lucide React

### DevOps
- **Contenedores**: Docker + Docker Compose
- **Servidor estático**: Nginx (para frontend en producción)

## Instalación

### 1. Clonar e instalar dependencias

```bash
cd MiaBot-feature-frontend

# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

**Backend (`.env` en la raíz):**
```env
# Base de Datos - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# JWT Secret
JWT_SECRET="tu-secreto-super-seguro"

# IA - Groq API (gratis y rápido)
GROQ_API_KEY="gsk_..."

# OpenAI API Key (alternativa de pago)
# OPENAI_API_KEY="sk-..."

# Google Drive (opcional)
GOOGLE_CLIENT_ID="tu-client-id"
GOOGLE_CLIENT_SECRET="tu-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/files/drive/callback"

# Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:3000/api
VITE_COMPANY_ID=<tu-company-id-de-supabase>
VITE_COMPANY_NAME="Tu Empresa"
VITE_COMPANY_TAGLINE="Asistente virtual para tu negocio"
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
# Backend - Desarrollo (con hot reload)
npm run dev

# Frontend - Desarrollo (en otra terminal)
cd frontend
npm run dev
```

- **Backend**: `http://localhost:3000`
- **Frontend**: `http://localhost:5173`
- **Documentación API**: `http://localhost:3000/docs`

## Docker (Backend + Frontend)

La aplicación está completamente dockerizada con dos servicios:
- **miabot-api**: Backend Fastify en puerto `3000`
- **miabot-frontend**: Frontend React (Nginx) en puerto `8081`

### Ejecutar con Docker Compose (recomendado)

```bash
# Construir y ejecutar (desde la raíz del proyecto)
docker compose up --build

# Ejecutar en segundo plano
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

### URLs en Docker
- **Frontend**: `http://localhost:8081`
- **API**: `http://localhost:3000`
- **Docs**: `http://localhost:3000/docs`

### Ejecutar solo el backend con Docker

```bash
# Construir imagen
docker build -t miabot-api .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env -v ./uploads:/app/uploads miabot-api
```

### Comandos útiles

```bash
# Reconstruir después de cambios
docker compose up --build -d

# Ver estado de contenedores
docker compose ps

# Ejecutar comandos dentro del contenedor
docker compose exec miabot sh
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
| Admin | admin@miabot.com | MiaBot123 | ADMIN |
| Finanzas | finanzas@miabot.com | MiaBot123 | EMPLOYEE (FINANCE) |
| RRHH | rrhh@miabot.com | MiaBot123 | EMPLOYEE (HR) |

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
MiaBot-feature-frontend/
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
├── frontend/              # Aplicación React
│   ├── public/
│   │   └── logo.png       # Logo personalizado
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   │   ├── Sidebar.jsx
│   │   │   ├── PublicChatWidget.jsx
│   │   │   └── dashboard/
│   │   ├── pages/         # Páginas de la app
│   │   │   ├── Login.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Invoices.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── ExternalChat.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/
│   │   │   └── api.js     # Cliente Axios + interceptores
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css      # Estilos Tailwind
│   ├── Dockerfile         # Build + Nginx
│   ├── nginx.conf         # Config Nginx (SPA + proxy /api)
│   ├── package.json
│   └── vite.config.js
├── database/
│   ├── schema.sql         # Script SQL de referencia
│   └── DIAGRAMA_BD.md     # Diagrama de la BD
├── uploads/               # Archivos locales
├── .env.example
├── .dockerignore
├── Dockerfile             # Backend
├── docker-compose.yml     # Backend + Frontend
├── package.json
└── README.md
```

## ✅ Funcionalidades Implementadas

### Backend
- [x] API REST completa con Fastify
- [x] Base de datos PostgreSQL con Prisma (Supabase)
- [x] Autenticación JWT
- [x] Sistema de roles (Admin, Employee, External)
- [x] Módulos de Finanzas (inventario, facturas, clientes, proveedores)
- [x] Módulos de RRHH (eventos, permisos, empleados)
- [x] Dashboard con métricas por departamento
- [x] Chat con IA (Groq / OpenAI)
- [x] Integración con Google Drive
- [x] Gestión de archivos locales
- [x] Documentación Swagger

### Frontend
- [x] Aplicación React 19 + Vite
- [x] UI moderna con TailwindCSS (tema oscuro)
- [x] Landing page pública con chat externo
- [x] Panel de administración por roles/departamento
- [x] Chat interno para empleados
- [x] Gestión de productos con categorías
- [x] Gestión de facturas y clientes
- [x] Calendario de eventos
- [x] Configuración de tema (claro/oscuro/sistema)
- [x] Logo personalizable

### DevOps
- [x] Docker y Docker Compose (backend + frontend)
- [x] Nginx como servidor de producción para frontend
- [x] Proxy reverso `/api` → backend

## Próximos Pasos

1. [ ] Chat con acciones CRUD (crear/actualizar desde el chat)
2. [ ] Gráficas en el chat (Recharts)
3. [ ] Integración con Google Calendar
4. [ ] Integración completa con n8n
5. [ ] Notificaciones push
6. [ ] Reportes PDF
7. [ ] Multi-empresa (SaaS)

## Licencia

MIT

---

Desarrollado con ❤️ para las PYMES de Colombia
