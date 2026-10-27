# ============================================================
# Builds the whole app into one image, in two stages.
# Stage 1 builds the React client into static files.
# Stage 2 is the Express server, which also serves those files.
# Only stage 2 ends up in the final image.
# ============================================================

# ---------- Stage 1: build the client ----------
FROM node:22-alpine AS client-build
WORKDIR /client

# package files first: Docker caches this layer, so npm ci only
# re-runs when the dependencies change, not on every code change.
COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ---------- Stage 2: the server ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Build the Prisma client from the schema.
COPY server/prisma ./prisma
RUN npx prisma generate

COPY server/src ./src

COPY server/src ./src
COPY --from=client-build /client/dist ./public

# Don't run as root inside the container.
RUN mkdir logs && chown node:node logs
USER node

EXPOSE 3000
# Bring the database up to date with the migrations, then start.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
