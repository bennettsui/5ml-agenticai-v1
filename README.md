# 5ML Agentic AI Platform v1

**Multi-layer AI agent orchestration platform** built by 5 Miles Lab for marketing and business strategy analysis.

## 🎯 Overview

The 5ML Platform is a production-ready **7-layer architecture** that orchestrates specialized AI agents for marketing analysis, content generation, and strategic planning. It integrates multiple AI providers (DeepSeek, Claude, Perplexity) with intelligent fallback chains and cost optimization.

## ✨ Key Features

### 🤖 **4 Specialized Agents**
- **Creative Agent** - Brand concepts, visual direction, tone of voice
- **SEO Agent** - Keyword research, content strategy, technical SEO (with real-time web research)
- **Social Media Agent** - Platform strategy, content pillars, trending formats
- **Research Agent** - Market insights, competitor analysis, opportunity identification

### 🏗️ **7-Layer Architecture**
1. **Infrastructure & Storage** - PostgreSQL, Express API, Docker/Fly.io ✅
2. **Execution Engine** - DeepSeek, Perplexity, Claude integration ✅
3. **Roles & Agents** - Specialized domain agents ✅
4. **Knowledge Management** - Vector embeddings, semantic search, multi-source connectors 🆕
5. **Task Definitions** - Reusable templates and workflows ✅
6. **Orchestration & Workflow** - Task scheduling, retry logic ⏳
7. **Governance & Compliance** - Audit trails, access control ⏳

### 📊 **Professional Dashboard** 🆕
- **Architecture Visualization** - Interactive 7-layer architecture diagram with status indicators
- **Usage Analytics** - Real-time charts for API usage, token consumption, cost tracking
- **Agent Performance** - Detailed metrics, success rates, response times
- **Project Management** - Browse history, view analysis results, metadata tracking
- **Agent Testing** - Live testing interface for all agents with model selection

### 🧠 **Knowledge Management System** 🆕
- **Multi-Source Connectors** - Notion, Web Crawler, PDF, Email (Gmail/IMAP)
- **Vector Embeddings** - OpenAI text-embedding-3-small support
- **Semantic Search** - Natural language queries with relevance ranking
- **pgvector Storage** - PostgreSQL with vector similarity search

### 🔄 **Intelligent Model Routing**
- **Cost Optimization** - Default to DeepSeek (fastest/cheapest)
- **Automatic Fallback** - Claude Haiku → Sonnet chain
- **Web Enhancement** - Perplexity Sonar Pro for real-time data
- **Flexible Selection** - User-controlled model choice per request

## 🛠️ Tech Stack

### Backend
- **Node.js 18+** + Express.js 4.19
- **AI Providers**: DeepSeek, Anthropic Claude, Perplexity
- **Database**: PostgreSQL 14+ with pgvector extension
- **API Documentation**: Swagger/OpenAPI 3.0
- **Deployment**: Docker + Fly.io (IAD region)

### Frontend
- **Next.js 15.1.3** (App Router) with TypeScript
- **Tailwind CSS 3.4** for styling
- **Recharts 2.15** for data visualization
- **Lucide React** for icons

### Knowledge Layer
- **TypeScript** microservices architecture
- **Vector Store**: PostgreSQL + pgvector / Redis
- **Embeddings**: OpenAI, Anthropic (future)
- **Connectors**: Notion API, Axios, UUID

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (optional, with pgvector extension)
- API Keys:
  - DeepSeek API Key (primary)
  - Anthropic API Key (fallback)
  - Perplexity API Key (research features)
  - OpenAI API Key (knowledge embeddings, optional)

### 1. Backend Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start backend server
npm start
# Backend runs on http://localhost:8080
```

### 2. Frontend Dashboard Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Dashboard runs on http://localhost:3000
```

### 3. Access the Platform

- **Dashboard**: http://localhost:3000
- **API Docs**: http://localhost:8080/api-docs
- **Health Check**: http://localhost:8080/health

## 📖 Usage Examples

### Test an Agent via API

```bash
# Creative Agent
curl -X POST http://localhost:8080/agents/creative \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Tesla",
    "brief": "Launch campaign for new Model Y variant",
    "industry": "Electric Vehicles",
    "model": "deepseek"
  }'

# SEO Agent with web research
curl -X POST http://localhost:8080/agents/seo \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Nike Taiwan",
    "brief": "Chinese New Year campaign",
    "industry": "Sports Apparel",
    "use_web_research": true
  }'
```

### Use the Dashboard

1. Navigate to http://localhost:3000
2. **Architecture** tab - View the 7-layer architecture
3. **Analytics** tab - Monitor usage and performance
4. **Agent Testing** tab - Test agents interactively
5. **Projects** tab - Browse analysis history

### Knowledge Management

```typescript
import { KnowledgeManager } from './knowledge';

// Initialize
const km = new KnowledgeManager({
  provider: 'openai',
  model: 'text-embedding-3-small',
  dimensions: 1536,
}, process.env.DATABASE_URL);

await km.initialize();

// Add knowledge source
km.registerConnector('notion', new NotionConnector({
  apiKey: process.env.NOTION_API_KEY!,
  databaseId: process.env.NOTION_DATABASE_ID,
}));

// Sync and search
await km.syncAll();
const results = await km.search('product launch strategy');
```

See `knowledge/README.md` for detailed documentation.

## 📁 Project Structure

```
5ml-agenticai-v1/
├── agents/                   # Layer 3: Specialized AI agents
│   ├── creativeAgent.js
│   ├── seoAgent.js
│   ├── socialAgent.js
│   └── researchAgent.js
├── services/                 # Layer 2: AI provider services
│   ├── deepseekService.js
│   └── perplexityService.js
├── knowledge/                # Layer 4: Knowledge management 🆕
│   ├── connectors/
│   ├── embeddings/
│   ├── schema/
│   └── README.md
├── frontend/                 # Professional Next.js dashboard 🆕
│   ├── app/
│   ├── components/
│   └── README.md
├── utils/                    # Helper utilities
│   └── modelHelper.js
├── public/                   # Legacy static dashboard
│   └── index.html
├── index.js                  # Main Express application
├── db.js                     # PostgreSQL integration
├── swagger.js                # API documentation
├── Dockerfile                # Docker configuration
└── fly.toml                  # Fly.io deployment config
```

## 🔧 Configuration

### Environment Variables

```bash
# AI Provider API Keys
DEEPSEEK_API_KEY=sk-...                    # Primary model (required)
ANTHROPIC_API_KEY=sk-ant-...               # Fallback model (required)
PERPLEXITY_API_KEY=pplx-...                # Research features (optional)
OPENAI_API_KEY=sk-...                      # Knowledge embeddings (optional)

# Server Configuration
PORT=8080                                   # Backend port

# Database (optional, but recommended)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# GitHub Webhook (optional)
GITHUB_WEBHOOK_SECRET=your-secret

# Knowledge Management (optional)
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=xxx-yyy-zzz
```

## 🚀 Deployment

### Fly.io (Production)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly deploy

# Set secrets
fly secrets set DEEPSEEK_API_KEY=sk-...
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly secrets set DATABASE_URL=postgresql://...
```

### Docker

```bash
# Build
docker build -t 5ml-platform .

# Run
docker run -p 8080:8080 \
  -e DEEPSEEK_API_KEY=sk-... \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  5ml-platform
```

## 📊 Architecture Layers

### ✅ Active Layers

**Layer 1: Infrastructure & Storage**
- PostgreSQL database with pgvector
- Express.js REST API
- Docker containerization
- Fly.io cloud deployment

**Layer 2: Execution Engine**
- DeepSeek Reasoner integration
- Perplexity Sonar Pro service
- Claude Haiku/Sonnet integration
- Model fallback chain

**Layer 3: Roles & Agents**
- Creative Agent
- SEO Agent (web-enhanced)
- Social Media Agent (trends-aware)
- Research Agent (market intelligence)

**Layer 4: Knowledge Management** 🆕
- Notion connector
- Web crawler
- PDF parser
- Email parser
- Vector embeddings
- Semantic search

**Layer 5: Task Definitions**
- Agent templates
- Reusable workflows
- JSON schema definitions

### ⏳ Planned Layers

**Layer 6: Orchestration & Workflow**
- Task scheduling
- Retry logic
- Workflow automation
- Event-driven triggers

**Layer 7: Governance & Compliance**
- Access control
- Audit logging
- Compliance rules
- Usage monitoring

## 🧪 Testing

### Backend API Testing

```bash
# Test health endpoint
curl http://localhost:8080/health

# Test creative agent
curl -X POST http://localhost:8080/agents/creative \
  -H "Content-Type: application/json" \
  -d '{"client_name":"Test","brief":"Test brief","industry":"Tech"}'
```

### Frontend Testing

```bash
cd frontend
npm run dev
# Open http://localhost:3000 and test each tab
```

## 📈 Roadmap

### Current Version (v1.0)
- ✅ 4 specialized agents (Creative, SEO, Social, Research)
- ✅ Multi-provider AI integration (DeepSeek, Claude, Perplexity)
- ✅ PostgreSQL persistence
- ✅ Next.js dashboard with analytics
- ✅ Knowledge Management layer with vector search

### Upcoming (v1.1)
- ⏳ Layer 6: Orchestration & Workflow
- ⏳ Layer 7: Governance & Compliance
- ⏳ GraphQL API
- ⏳ WebSocket support for real-time updates
- ⏳ Multi-language support (English, 中文)

### Future (v2.0)
- 🔮 Custom agent creation UI
- 🔮 Template marketplace
- 🔮 Multi-tenant support
- 🔮 Advanced analytics and reporting
- 🔮 Integration marketplace (Slack, Discord, Teams)

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Documentation

- **API Documentation**: http://localhost:8080/api-docs (when running)
- **Frontend README**: [frontend/README.md](frontend/README.md)
- **Knowledge Layer**: [knowledge/README.md](knowledge/README.md)
- **Agent Guides**: See individual agent files in `agents/`

## 🐛 Known Issues

- Analytics dashboard uses mock data (real-time data collection coming soon)
- PDF parser requires optional `pdf-parse` dependency
- IMAP email connector not yet implemented (use Gmail API)

## 💡 Tips

- **Cost Optimization**: DeepSeek is 10x cheaper than Claude, use it as default
- **Web Research**: Enable for SEO/Social agents to get real-time data
- **Database**: Optional but recommended for project persistence
- **Knowledge Layer**: Best with OpenAI embeddings for production use

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/bennettsui/5ml-agenticai-v1/issues)
- **Email**: Contact 5 Miles Lab
- **Docs**: Check API documentation at `/api-docs`

## ⚖️ License

TBD - Proprietary software by 5 Miles Lab

## 🏢 About

**5 Miles Lab** - Building the future of agentic AI for marketing and business intelligence.

## 🎉 Acknowledgments

- DeepSeek for fast, affordable AI inference
- Anthropic for Claude's advanced reasoning
- Perplexity for real-time web intelligence
- OpenAI for embeddings technology

## 📊 Status

**Production Status**: ✅ Active
**Deployment**: Fly.io (IAD region)
**Version**: 1.0.0
**Last Updated**: January 2026

---

Built with ❤️ by 5 Miles Lab
