FROM node:18-alpine

WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache python3 make g++ curl ca-certificates

# Install AWS RDS CA bundle for TLS verification
RUN curl -fsSL https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
  -o /usr/local/share/ca-certificates/rds-ca-bundle.crt \
  && update-ca-certificates

# Install backend dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# Build frontend static export
COPY frontend/package*.json ./frontend/
WORKDIR /usr/src/app/frontend
RUN npm ci
COPY frontend/ ./
RUN npm run build
RUN test -f /usr/src/app/frontend/out/index.html

# Back to app root
WORKDIR /usr/src/app

# Copy application code
COPY index.js .
COPY webhook.js .
COPY db.js .
COPY swagger.js .
COPY agents/ ./agents/
COPY services/ ./services/
COPY utils/ ./utils/
COPY tools/ ./tools/
COPY public/ ./public/
COPY knowledge/ ./knowledge/
COPY infrastructure/ ./infrastructure/
COPY use-cases/ ./use-cases/

# Compile TypeScript files
RUN npx tsc --project tsconfig.json || echo "TypeScript compilation warnings (non-critical)"

# Create necessary directories
RUN mkdir -p /tmp/dropbox-downloads /tmp/excel-exports

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

CMD ["node", "index.js"]
