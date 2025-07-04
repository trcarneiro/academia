# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S academy -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=academy:nodejs /app/dist ./dist
COPY --from=builder --chown=academy:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=academy:nodejs /app/prisma ./prisma
COPY --from=builder --chown=academy:nodejs /app/package*.json ./

# Switch to non-root user
USER academy

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]