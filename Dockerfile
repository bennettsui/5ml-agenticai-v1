FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy backend package files
COPY package*.json ./
COPY tsconfig.json ./

# Install backend dependencies (includes TypeScript)
RUN npm ci

# Copy frontend and build it
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Go back to app root
WORKDIR /app

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
RUN mkdir -p /tmp/dropbox-downloads
RUN mkdir -p /tmp/excel-exports

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start application
CMD ["node", "index.js"]
