# MiaBot - Dockerfile
FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

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
