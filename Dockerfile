FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY index.js .
COPY webhook.js .
COPY db.js .
COPY swagger.js .
COPY agents/ ./agents/
COPY services/ ./services/
COPY utils/ ./utils/
COPY public/ ./public/

# Expose port
EXPOSE 8080

# Start application
CMD ["node", "index.js"]
