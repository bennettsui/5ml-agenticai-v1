FROM node:20-alpine

WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache python3 make g++ curl ca-certificates ffmpeg

# Install AWS RDS CA bundle for TLS verification
RUN curl -fsSL https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
  -o /usr/local/share/ca-certificates/rds-ca-bundle.crt \
  && curl -fsSL https://truststore.pki.rds.amazonaws.com/ap-southeast-1/ap-southeast-1-bundle.pem \
  -o /usr/local/share/ca-certificates/rds-ca-ap-southeast-1.crt \
  && update-ca-certificates

# Ensure Node trusts the full system CA bundle (includes RDS CAs after update-ca-certificates)
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

# Install backend dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# Build frontend static export
COPY frontend/package*.json ./frontend/
WORKDIR /usr/src/app/frontend
RUN npm ci
COPY frontend/ ./
ENV NODE_OPTIONS=--max_old_space_size=2048
RUN npm run build
ENV NODE_OPTIONS=
RUN test -f /usr/src/app/frontend/out/index.html

# Back to app root
WORKDIR /usr/src/app

# Copy application code
COPY index.js .
COPY instrument.js .
COPY webhook.js .
COPY db.js .
COPY swagger.js .
COPY agents/ ./agents/
COPY lib/ ./lib/
COPY routes/ ./routes/
COPY middleware/ ./middleware/
COPY validation/ ./validation/
COPY services/ ./services/
COPY utils/ ./utils/
COPY tools/ ./tools/
COPY public/ ./public/
COPY knowledge/ ./knowledge/
COPY infrastructure/ ./infrastructure/
COPY use-cases/ ./use-cases/
COPY data/ ./data/

# Compile TypeScript files
RUN npx tsc --project tsconfig.json || echo "TypeScript compilation warnings (non-critical)"

# Create necessary directories
RUN mkdir -p /tmp/dropbox-downloads /tmp/excel-exports \
    && mkdir -p /usr/src/app/use-cases/event-checkin/data

# Back up static tedx-xinyi assets so the entrypoint can seed the
# persistent volume on first mount without losing built-in files.
RUN cp -r /usr/src/app/frontend/public/tedx-xinyi /usr/src/app/tedx-xinyi-static

# Copy and make entrypoint executable
COPY entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1))"

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
CMD ["node", "index.js"]
