# Man's Accounting Firm - Receipt to P&L Automation

## 🚀 Quick Setup

### 1. Create PostgreSQL Database on Fly.io

```bash
# Create a new Postgres cluster
fly postgres create --name mans-accounting-db --region iad

# Attach the database to your app (this sets DATABASE_URL automatically)
fly postgres attach mans-accounting-db
```

### 2. Initialize Database Schema

```bash
# Make the init script executable
chmod +x use-cases/mans-company-receipt-tracking/db/init-db.sh

# Set DATABASE_URL from Fly.io
export DATABASE_URL="$(fly secrets list | grep DATABASE_URL | awk '{print $2}')"

# Run initialization
./use-cases/mans-company-receipt-tracking/db/init-db.sh
```

Or manually with psql:

```bash
psql "$(fly secrets list | grep DATABASE_URL | awk '{print $2}')" \
  -f use-cases/mans-company-receipt-tracking/db/schema.sql
```

### 3. Set Dropbox Access Token

```bash
# Get token from https://www.dropbox.com/developers/apps
fly secrets set DROPBOX_ACCESS_TOKEN="your_token_here"
```

### 4. Deploy

```bash
git add .
git commit -m "Set up receipt processing"
git push
fly deploy
```

## 🐛 Current Error: "Failed to start receipt processing"

This error means the DATABASE_URL is not configured. Follow steps 1-2 above to fix it.
