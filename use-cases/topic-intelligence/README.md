# Topic-Based News Intelligence System

A comprehensive topic-based news intelligence system supporting multi-topic monitoring, daily scraping, real-time UI updates, and weekly newsletter delivery.

## Overview

This use case implements a complete news intelligence pipeline with:

- **L1 (Frontend)**: 4 pages for topic setup, live scanning, dashboard, and settings
- **L2 (Tools)**: 4 tools for LLM, Notion, scraping, and email
- **L3 (Agents)**: 3 specialized agents for source curation, news analysis, and newsletter writing
- **L4 (Knowledge)**: Notion database provisioning for topics, sources, news, and digests
- **L5 (Workflows)**: 3 workflows for setup, daily discovery, and weekly digest
- **L6 (Orchestration)**: Multi-topic scheduler with health monitoring
- **L7 (WebSocket)**: Real-time updates for live scanning

## Environment Variables

```bash
# Required
NOTION_API_KEY=ntn_xxx                    # Notion integration token
NOTION_PARENT_PAGE_ID=xxx                 # Parent page for databases

# Required for email
RESEND_API_KEY=re_xxx                     # Resend API key for email

# Required for LLM
INTERNAL_LLM_ENDPOINT=https://xxx         # 5ML internal LLM endpoint
INTERNAL_LLM_API_KEY=xxx                  # 5ML internal LLM key

# Optional
WEBSOCKET_PORT=3001                       # WebSocket server port (default: 3001)

# Database IDs (auto-created or set manually)
NOTION_TOPICS_MASTER_DB=xxx               # Topics Master List DB ID
NOTION_TOPIC_SOURCES_DB=xxx               # Topic Sources DB ID
NOTION_DAILY_NEWS_DB=xxx                  # Daily News DB ID
NOTION_WEEKLY_DIGEST_DB=xxx               # Weekly Digest DB ID
```

## Directory Structure

```
use-cases/topic-intelligence/
├── agents/                    # L3: AI Agents
│   ├── source-curator.ts      # SourceCuratorAgent (源頭策展官)
│   ├── news-analyst.ts        # NewsAnalystAgent (新聞分析官)
│   ├── news-writer.ts         # NewsWriterAgent (新聞編寫官)
│   └── index.ts
├── api/                       # API Routes
│   └── routes.ts              # Express router for all endpoints
├── orchestration/             # L6: Orchestration
│   └── topic-news-orchestrator.ts
├── scripts/                   # L4: Knowledge
│   └── init-topic-databases.ts
├── tools/                     # L2: Tools
│   ├── internal-llm-tool.ts   # InternalLLMTool
│   ├── notion-tool.ts         # NotionTool
│   ├── multi-source-scraper.ts # MultiSourceScraperTool
│   ├── resend-email-tool.ts   # ResendEmailTool
│   └── index.ts
├── websocket/                 # L7: WebSocket
│   └── scan-server.ts         # Real-time updates server
├── workflows/                 # L5: Workflows
│   ├── setup-topic-workflow.ts
│   ├── daily-news-workflow.ts
│   ├── weekly-digest-workflow.ts
│   └── index.ts
└── README.md
```

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/intelligence/setup` | TopicSetupPage | Create new topic, discover sources |
| `/intelligence/live-scan` | LiveScanPage | Real-time WebSocket scanning UI |
| `/intelligence/dashboard` | IntelligenceDashboardPage | Daily news feed and stats |
| `/intelligence/settings` | TopicSettingsPage | Configure topic settings |

## API Endpoints

### Topic Management
- `POST /api/intelligence/topics` - Create new topic
- `GET /api/intelligence/topics` - List all topics
- `GET /api/intelligence/topics/:id` - Get topic details
- `PUT /api/intelligence/topics/:id/pause` - Pause topic
- `PUT /api/intelligence/topics/:id/resume` - Resume topic
- `DELETE /api/intelligence/topics/:id` - Archive topic

### Orchestration
- `POST /api/orchestration/trigger-scan?topic_id=xxx` - Manual daily scan
- `POST /api/orchestration/trigger-digest?topic_id=xxx` - Manual weekly digest
- `GET /api/orchestration/health` - Health status

### Utilities
- `POST /api/intelligence/databases/init` - Initialize Notion databases
- `POST /api/intelligence/sources/discover` - Discover sources (without saving)
- `POST /api/intelligence/email/test` - Send test email

## Agents

### SourceCuratorAgent (源頭策展官)
- **Purpose**: Discover 20 authoritative sources for a topic
- **Model**: `5ml-source-curator-v1`
- **Temperature**: 0.3 (deterministic)
- **Output**: Curated sources with URLs, authority scores, descriptions

### NewsAnalystAgent (新聞分析官)
- **Purpose**: Analyze and score news importance
- **Model**: `5ml-news-analyst-v1`
- **Temperature**: 0.4 (consistent analysis)
- **Scoring**: 5 dimensions (Relevance, Actionability, Authority, Timeliness, Originality)
- **Filter**: Only returns articles with score >= 60

### NewsWriterAgent (新聞編寫官)
- **Purpose**: Generate HTML email newsletters
- **Model**: `5ml-news-writer-v1`
- **Temperature**: 0.7 (creative)
- **Output**: Complete HTML email with top 15 articles

## Workflows

### SetupTopicAndSourcesWorkflow (One-time)
1. Receive user input (Topic Name, Keywords)
2. Validate topic
3. Generate keywords (if not provided)
4. Activate SourceCuratorAgent
5. Validate URLs
6. Display for user approval
7. Save to Notion
8. Initialize databases
9. Schedule workflows

### DailyNewsDiscoveryWorkflow (Daily 06:00 HKT)
1. Initialize session
2. Query topic sources from Notion
3. Prepare scrape targets
4. Multi-source scraper (streaming)
5. News analyst (streaming)
6. Stream to UI via WebSocket
7. Batch sync to Notion
8. Display summary
9. Log and monitor

### WeeklyNewsDigestWorkflow (Monday 08:00 HKT)
1. Initialize session
2. Query Notion for 7-day metadata
3. Fetch 7-day articles
4. Curate top 15 articles
5. NewsWriterAgent drafts HTML
6. Validate HTML
7. Send via Resend
8. Archive to Notion
9. Generate report

## WebSocket Events

| Event | Description |
|-------|-------------|
| `source_status_update` | Per-source status change (active/complete/failed) |
| `article_analyzed` | New article analyzed |
| `progress_update` | Overall progress metrics |
| `scan_complete` | Workflow finished |
| `error_occurred` | Error during workflow |

## Usage

### 1. Initialize Databases

```bash
# Set environment variables
export NOTION_API_KEY=xxx
export NOTION_PARENT_PAGE_ID=xxx

# Run initialization script
npx ts-node use-cases/topic-intelligence/scripts/init-topic-databases.ts
```

### 2. Start WebSocket Server

```typescript
import { getScanWebSocketServer } from './use-cases/topic-intelligence/websocket/scan-server';

const wsServer = getScanWebSocketServer();
wsServer.start();
```

### 3. Initialize Orchestrator

```typescript
import { createTopicNewsOrchestrator } from './use-cases/topic-intelligence/orchestration/topic-news-orchestrator';

const orchestrator = createTopicNewsOrchestrator();
await orchestrator.initialize();
```

### 4. Mount API Routes

```typescript
import { getRouter } from './use-cases/topic-intelligence/api/routes';

app.use('/api/intelligence', getRouter());
```

## Notion Database Schema

### Topics Master List
- Topic Name (Title)
- Status (Select: Active, Paused, Archived)
- Keywords (Rich Text)
- Created Date (Date)
- Daily Scan Time (Text)
- Weekly Digest Day (Select)
- Weekly Digest Time (Text)
- Total Sources (Number)
- Last Scan (Date)
- Last Digest Sent (Date)

### Topic Sources
- Source Name (Title)
- Topic (Relation)
- Primary URL (URL)
- Secondary URLs (Rich Text)
- Content Types (Multi-select)
- Authority Score (Number 0-100)
- Focus Areas (Multi-select)
- Posting Frequency (Select)
- Status (Select: Active, Inactive)
- Why Selected (Rich Text)

### Daily News
- Title (Title)
- Topic (Relation)
- Source Name (Text)
- Source URL (URL)
- Content Summary (Rich Text)
- Published Date (Date)
- Scraped Date (Date)
- Importance Score (Number 0-100)
- Key Insights (Rich Text)
- Action Items (Rich Text)
- Tags (Multi-select)
- Status (Select: New, Read, Archived)

### Weekly Digest
- Week (Title)
- Topic (Relation)
- Week Start (Date)
- Total Articles (Number)
- High Importance Count (Number)
- Email Subject (Text)
- Email HTML (Rich Text)
- Email Sent Date (Date)
- Status (Select: Draft, Sent, Failed)

## Health Check Response

```json
{
  "orchestratorStatus": "healthy",
  "activeTopics": 3,
  "topics": [
    {
      "topicId": "xxx",
      "topicName": "IG Growth Hacking",
      "status": "active",
      "lastDailyScan": "2026-01-24T06:15:00Z",
      "nextDailyScan": "2026-01-25T06:00:00Z",
      "lastWeeklyDigest": "2026-01-20T08:30:00Z",
      "nextWeeklyDigest": "2026-01-27T08:00:00Z"
    }
  ],
  "apiHealth": {
    "notion": "ok",
    "resend": "ok",
    "internalLlm": "ok"
  },
  "failedJobs24h": 0,
  "uptime": 86400000
}
```
