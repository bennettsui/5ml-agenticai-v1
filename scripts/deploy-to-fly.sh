#!/bin/bash

# ============================================================================
# 5ML Agentic AI Platform - Fly.io Deployment Script
# ============================================================================
# This script automates the deployment to Fly.io
# Usage: ./scripts/deploy-to-fly.sh
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 5ML Agentic AI Platform - Fly.io Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if fly CLI is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ flyctl CLI is not installed${NC}"
    echo "Install from: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

echo -e "${GREEN}✅ flyctl CLI found${NC}"
echo ""

# Check if authenticated
if ! fly auth whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with Fly.io${NC}"
    echo "Run: fly auth login"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated with Fly.io${NC}"
echo ""

# Get Fly app name
APP_NAME="5ml-agenticai-v1"
echo -e "${BLUE}📋 App Configuration:${NC}"
echo "   App Name: $APP_NAME"
echo "   URL: https://$APP_NAME.fly.dev"
echo ""

# Check if secrets are set
echo -e "${BLUE}🔐 Checking Fly Secrets...${NC}"
echo ""

MISSING_SECRETS=()

# Check DATABASE_URL
if ! fly secrets show DATABASE_URL --app $APP_NAME &> /dev/null; then
    MISSING_SECRETS+=("DATABASE_URL")
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
else
    echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
fi

# Check ANTHROPIC_API_KEY
if ! fly secrets show ANTHROPIC_API_KEY --app $APP_NAME &> /dev/null; then
    MISSING_SECRETS+=("ANTHROPIC_API_KEY")
    echo -e "${RED}❌ ANTHROPIC_API_KEY not set${NC}"
else
    echo -e "${GREEN}✅ ANTHROPIC_API_KEY is set${NC}"
fi

# Check DEEPSEEK_API_KEY
if ! fly secrets show DEEPSEEK_API_KEY --app $APP_NAME &> /dev/null; then
    MISSING_SECRETS+=("DEEPSEEK_API_KEY")
    echo -e "${RED}❌ DEEPSEEK_API_KEY not set${NC}"
else
    echo -e "${GREEN}✅ DEEPSEEK_API_KEY is set${NC}"
fi

echo ""

# If secrets are missing, prompt to set them
if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing secrets:${NC}"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "   - $secret"
    done
    echo ""
    echo -e "${YELLOW}Set them with: fly secrets set VAR_NAME=value${NC}"
    echo ""
    read -p "Continue without setting missing secrets? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 1
    fi
fi

echo ""

# Build and deploy
echo -e "${BLUE}🏗️  Building and deploying to Fly.io...${NC}"
echo ""

if fly deploy; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}📊 Next steps:${NC}"
    echo ""
    echo "1. View logs:"
    echo "   fly logs --follow"
    echo ""
    echo "2. Test health endpoint:"
    echo "   curl https://$APP_NAME.fly.dev/health"
    echo ""
    echo "3. Test knowledge API:"
    echo "   curl https://$APP_NAME.fly.dev/api/ziwei/knowledge/stats"
    echo ""
    echo "4. Open dashboard:"
    echo "   fly open"
    echo "   (or visit: https://$APP_NAME.fly.dev/use-cases/ziwei?tab=knowledge)"
    echo ""
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check logs with: fly logs --follow"
    exit 1
fi
