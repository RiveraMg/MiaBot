-- ============================================
-- MiaBot - Script de Base de Datos PostgreSQL
-- Asistente Inteligente para PYMES
-- ============================================

-- NOTA: Este script es de referencia. Prisma maneja las migraciones automáticamente.
-- Para crear la BD usa: npm run db:push

-- ============================================
-- TIPOS ENUMERADOS (ENUMS)
-- ============================================

-- Roles de usuario
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE', 'EXTERNAL');

-- Departamentos
CREATE TYPE "Department" AS ENUM ('FINANCE', 'HR');

-- Estados de factura
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- Tipos de evento
CREATE TYPE "EventType" AS ENUM (
    'MEETING',      -- Reunión
    'BIRTHDAY',     -- Cumpleaños
    'ANNIVERSARY',  -- Aniversario laboral
    'EVALUATION',   -- Evaluación de desempeño
    'CONTRACT_END', -- Vencimiento de contrato
    'TRAINING',     -- Capacitación
    'CORPORATE',    -- Evento corporativo
    'DEADLINE',     -- Fecha límite
    'OTHER'         -- Otro
);

-- Estados de solicitud de permiso
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Tipos de permiso
CREATE TYPE "LeaveType" AS ENUM ('VACATION', 'SICK', 'PERSONAL', 'MATERNITY', 'OTHER');

-- Estados de tarea
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Prioridad de tarea
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Tipo de chat
CREATE TYPE "ChatType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- Rol del mensaje
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- Tipo de notificación
CREATE TYPE "NotificationType" AS ENUM (
    'LOW_STOCK',
    'INVOICE_DUE',
    'INVOICE_OVERDUE',
    'EVENT_REMINDER',
    'TASK_DUE',
    'LEAVE_REQUEST',
    'CONTRACT_END',
    'BIRTHDAY',
    'GENERAL'
);

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- 1. EMPRESAS (Dato Maestro Principal)
CREATE TABLE "companies" (
    "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"       TEXT NOT NULL,
    "nit"        TEXT UNIQUE,                    -- NIT en Colombia
    "email"      TEXT,
    "phone"      TEXT,
    "address"    TEXT,
    "logo"       TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL
);

-- 2. USUARIOS
CREATE TABLE "users" (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "email"       TEXT UNIQUE NOT NULL,
    "password"    TEXT NOT NULL,                 -- Hasheado con bcrypt
    "name"        TEXT NOT NULL,
    "role"        "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "department"  "Department",                  -- Solo para EMPLOYEE
    "phone"       TEXT,
    "avatar"      TEXT,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    
    -- Datos de empleado
    "position"    TEXT,                          -- Cargo
    "hireDate"    TIMESTAMP(3),                  -- Fecha de contratación
    "birthDate"   TIMESTAMP(3),                  -- Para cumpleaños
    "contractEnd" TIMESTAMP(3),                  -- Vencimiento de contrato
    
    "companyId"   TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "users_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

-- 3. CATEGORÍAS DE PRODUCTOS (Dato Maestro)
CREATE TABLE "categories" (
    "id"   TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL
);

-- 4. PRODUCTOS / INVENTARIO
CREATE TABLE "products" (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "sku"         TEXT,                          -- Código único del producto
    "name"        TEXT NOT NULL,
    "description" TEXT,
    
    -- Inventario
    "stock"       INTEGER NOT NULL DEFAULT 0,
    "minStock"    INTEGER NOT NULL DEFAULT 5,    -- Alerta cuando stock < minStock
    "unit"        TEXT NOT NULL DEFAULT 'unidad',
    
    -- Precios
    "costPrice"   DECIMAL(12,2) NOT NULL,        -- Precio de costo
    "salePrice"   DECIMAL(12,2) NOT NULL,        -- Precio de venta
    
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "categoryId"  TEXT,
    "companyId"   TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "products_categoryId_fkey" 
        FOREIGN KEY ("categoryId") REFERENCES "categories"("id"),
    CONSTRAINT "products_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
    CONSTRAINT "products_companyId_sku_key" UNIQUE ("companyId", "sku")
);

-- 5. CLIENTES
CREATE TABLE "clients" (
    "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"      TEXT NOT NULL,
    "email"     TEXT,
    "phone"     TEXT,
    "address"   TEXT,
    "nit"       TEXT,                            -- NIT o cédula
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "clients_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

-- 6. PROVEEDORES
CREATE TABLE "suppliers" (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"        TEXT NOT NULL,
    "email"       TEXT,
    "phone"       TEXT,
    "address"     TEXT,
    "nit"         TEXT,
    "contactName" TEXT,                          -- Nombre del contacto
    "companyId"   TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "suppliers_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

-- 7. FACTURAS
CREATE TABLE "invoices" (
    "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "number"    TEXT NOT NULL,                   -- Número de factura (FAC-0001)
    "status"    "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    
    -- Fechas
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate"   TIMESTAMP(3) NOT NULL,           -- Fecha de vencimiento
    "paidDate"  TIMESTAMP(3),                    -- Fecha de pago
    
    -- Montos
    "subtotal"  DECIMAL(12,2) NOT NULL,
    "tax"       DECIMAL(12,2) NOT NULL DEFAULT 0, -- IVA
    "total"     DECIMAL(12,2) NOT NULL,
    
    "notes"     TEXT,
    "clientId"  TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "invoices_clientId_fkey" 
        FOREIGN KEY ("clientId") REFERENCES "clients"("id"),
    CONSTRAINT "invoices_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
    CONSTRAINT "invoices_companyId_number_key" UNIQUE ("companyId", "number")
);

-- 8. ITEMS DE FACTURA (Líneas de detalle)
CREATE TABLE "invoice_items" (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "quantity"    INTEGER NOT NULL,
    "unitPrice"   DECIMAL(12,2) NOT NULL,
    "total"       DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "productId"   TEXT,
    "invoiceId"   TEXT NOT NULL,
    
    CONSTRAINT "invoice_items_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "products"("id"),
    CONSTRAINT "invoice_items_invoiceId_fkey" 
        FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE
);

-- 9. PAGOS
CREATE TABLE "payments" (
    "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "amount"    DECIMAL(12,2) NOT NULL,
    "method"    TEXT NOT NULL DEFAULT 'efectivo', -- efectivo, transferencia, tarjeta
    "reference" TEXT,                             -- Número de referencia
    "notes"     TEXT,
    "invoiceId" TEXT NOT NULL,
    "paidAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "payments_invoiceId_fkey" 
        FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE
);

-- 10. EVENTOS (RRHH)
CREATE TABLE "events" (
    "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "title"        TEXT NOT NULL,
    "description"  TEXT,
    "type"         "EventType" NOT NULL DEFAULT 'OTHER',
    
    -- Fechas
    "startDate"    TIMESTAMP(3) NOT NULL,
    "endDate"      TIMESTAMP(3),
    "allDay"       BOOLEAN NOT NULL DEFAULT false,
    
    -- Recordatorios
    "reminderDays" INTEGER NOT NULL DEFAULT 1,   -- Días antes para recordar
    "isRecurring"  BOOLEAN NOT NULL DEFAULT false,
    
    "companyId"    TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "events_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

-- 11. SOLICITUDES DE PERMISOS
CREATE TABLE "leave_requests" (
    "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "type"         "LeaveType" NOT NULL,
    "status"       "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    
    "startDate"    TIMESTAMP(3) NOT NULL,
    "endDate"      TIMESTAMP(3) NOT NULL,
    "reason"       TEXT,
    
    -- Respuesta
    "responseNote" TEXT,
    "respondedAt"  TIMESTAMP(3),
    
    "userId"       TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "leave_requests_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- 12. TAREAS
CREATE TABLE "tasks" (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "status"      "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority"    "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    
    "dueDate"     TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "department"  "Department",
    
    "createdById" TEXT NOT NULL,
    "assigneeId"  TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "tasks_createdById_fkey" 
        FOREIGN KEY ("createdById") REFERENCES "users"("id"),
    CONSTRAINT "tasks_assigneeId_fkey" 
        FOREIGN KEY ("assigneeId") REFERENCES "users"("id")
);

-- 13. SESIONES DE CHAT
CREATE TABLE "chat_sessions" (
    "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "type"         "ChatType" NOT NULL,
    
    -- Para chat externo (sin login)
    "visitorName"  TEXT,
    "visitorEmail" TEXT,
    "visitorPhone" TEXT,
    
    "context"      TEXT,                         -- Contexto para IA
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    
    "companyId"    TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "chat_sessions_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
);

-- 14. MENSAJES DE CHAT
CREATE TABLE "chat_messages" (
    "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "content"   TEXT NOT NULL,
    "role"      "MessageRole" NOT NULL,
    "metadata"  JSONB,                           -- Acciones ejecutadas, etc.
    
    "sessionId" TEXT NOT NULL,
    "userId"    TEXT,                            -- Solo para chat interno
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "chat_messages_sessionId_fkey" 
        FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE,
    CONSTRAINT "chat_messages_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id")
);

-- 15. NOTIFICACIONES
CREATE TABLE "notifications" (
    "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "type"          "NotificationType" NOT NULL,
    "title"         TEXT NOT NULL,
    "message"       TEXT NOT NULL,
    "isRead"        BOOLEAN NOT NULL DEFAULT false,
    
    -- Referencia al objeto relacionado
    "referenceId"   TEXT,
    "referenceType" TEXT,                        -- "invoice", "product", "event", etc.
    
    "userId"        TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "notifications_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- 16. ARCHIVOS
CREATE TABLE "files" (
    "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"          TEXT NOT NULL,
    "mimeType"      TEXT NOT NULL,
    "size"          INTEGER,
    
    -- Almacenamiento
    "storageType"   TEXT NOT NULL DEFAULT 'local', -- "local" | "google_drive"
    "path"          TEXT,                          -- Path local
    "driveFileId"   TEXT,                          -- ID de Google Drive
    "driveUrl"      TEXT,                          -- URL de Google Drive
    
    -- Referencia
    "referenceId"   TEXT,
    "referenceType" TEXT,                          -- "invoice", "contract", etc.
    
    "uploadedById"  TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================

CREATE INDEX "users_companyId_idx" ON "users"("companyId");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_department_idx" ON "users"("department");

CREATE INDEX "products_companyId_idx" ON "products"("companyId");
CREATE INDEX "products_sku_idx" ON "products"("sku");
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

CREATE INDEX "clients_companyId_idx" ON "clients"("companyId");

CREATE INDEX "invoices_companyId_idx" ON "invoices"("companyId");
CREATE INDEX "invoices_clientId_idx" ON "invoices"("clientId");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

CREATE INDEX "events_companyId_idx" ON "events"("companyId");
CREATE INDEX "events_startDate_idx" ON "events"("startDate");
CREATE INDEX "events_type_idx" ON "events"("type");

CREATE INDEX "tasks_createdById_idx" ON "tasks"("createdById");
CREATE INDEX "tasks_assigneeId_idx" ON "tasks"("assigneeId");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_department_idx" ON "tasks"("department");

CREATE INDEX "leave_requests_userId_idx" ON "leave_requests"("userId");
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

CREATE INDEX "chat_sessions_companyId_idx" ON "chat_sessions"("companyId");
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Para usar con Prisma:
-- 1. Configura DATABASE_URL en .env
-- 2. Ejecuta: npm run db:push (crea las tablas)
-- 3. Ejecuta: npm run db:seed (datos de prueba)
