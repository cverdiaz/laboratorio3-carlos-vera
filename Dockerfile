# ============================================================
# ETAPA 1: BASE
# Define la versión de Node.js e instala pnpm.
# Esta etapa será reutilizada para instalar y compilar.
# ============================================================
FROM node:24-alpine AS base

WORKDIR /app

# Instalamos explícitamente la misma versión de pnpm
# utilizada durante las pruebas locales.
RUN npm install --global pnpm@11.0.9


# ============================================================
# ETAPA 2: DEPENDENCIAS
# Copia primero los archivos necesarios para instalar paquetes.
# Esto permite reutilizar la caché de Docker cuando el código
# cambia, pero las dependencias permanecen iguales.
# ============================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile


# ============================================================
# ETAPA 3: COMPILACIÓN
# Copia el código fuente y genera la carpeta dist.
# Después elimina las dependencias utilizadas solo en desarrollo.
# ============================================================
FROM deps AS build

COPY . .

RUN pnpm run build
RUN pnpm prune --prod


# ============================================================
# ETAPA 4: EJECUCIÓN
# Contiene solamente los archivos necesarios para iniciar NestJS.
# ============================================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

LABEL org.opencontainers.image.source="https://github.com/cverdiaz/laboratorio3-carlos-vera"

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]