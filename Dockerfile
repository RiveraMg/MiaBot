# MiaBot - Dockerfile
FROM node:20-bullseye-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
# Instalar dependencias
RUN npm ci --only=production

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar código fuente
COPY src ./src/

# Crear directorio de uploads
RUN mkdir -p uploads

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["node", "src/server.js"]
