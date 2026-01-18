# 5ML Platform Dashboard

Professional Next.js dashboard for the 5ML Agentic AI Platform, featuring architecture visualization, analytics, and agent management.

## Features

### 🏗️ Architecture Visualization
- **7-Layer Architecture** - Interactive visualization of the complete platform stack
- **Status Indicators** - Real-time status for each layer (Active, Partial, Missing)
- **Component Details** - Expandable view showing all components per layer
- **Completion Tracking** - Overall platform completion percentage

### 📊 Analytics Dashboard
- **Usage Metrics** - Track API requests and token consumption over time
- **Model Distribution** - Pie chart showing usage across AI providers
- **Agent Performance** - Bar charts for request volumes and response times
- **Cost Analysis** - Monitor spending across different AI models
- **Performance Table** - Detailed metrics for each agent (success rates, avg response time)

### 🧪 Agent Testing
- **4 Specialized Agents** - Test Creative, SEO, Social Media, and Research agents
- **Model Selection** - Choose from DeepSeek, Claude Haiku/Sonnet, or Perplexity
- **Real-time Results** - View formatted JSON responses with metadata
- **Form Validation** - Required fields and error handling

### 📁 Project Management
- **Project History** - Browse all analyzed projects
- **Analysis Timeline** - View all analyses per project
- **Detailed Results** - Expandable JSON view of analysis results
- **Metadata Tracking** - Track models used, timestamps, and agent types

## Tech Stack

- **Framework**: Next.js 15.1.3 (App Router)
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS 3.4.17
- **Charts**: Recharts 2.15.0
- **Icons**: Lucide React 0.469.0
- **React**: 19.0.0

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:8080`

### Installation

```bash
cd frontend
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The dashboard will proxy API requests to `http://localhost:8080`.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main dashboard page
│   └── globals.css        # Global styles + Tailwind
├── components/
│   ├── ArchitectureViz.tsx      # 7-layer architecture visualization
│   ├── AnalyticsDashboard.tsx   # Usage analytics & charts
│   ├── AgentTesting.tsx         # Agent selection & testing UI
│   └── ProjectManagement.tsx    # Project history & details
├── lib/
│   └── utils.ts           # Utility functions (cn helper)
├── public/                # Static assets
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

## Components

### ArchitectureViz

Displays the 7-layer architecture with:
- Layer 7: Governance & Compliance (Missing)
- Layer 6: Orchestration & Workflow (Missing)
- Layer 5: Task Definitions (Active)
- Layer 4: Knowledge Management (Missing - newly added!)
- Layer 3: Roles & Agents (Active)
- Layer 2: Execution Engine (Active)
- Layer 1: Infrastructure & Storage (Active)

**Props**: None (standalone component)

### AnalyticsDashboard

Real-time analytics with:
- Summary cards (Total Requests, Tokens, Cost, Success Rate)
- Usage over time line chart
- Model distribution pie chart
- Agent performance bar chart
- Cost analysis bar chart
- Detailed performance table

**Data**: Currently uses mock data; replace with API calls to backend

### AgentTesting

Interactive agent testing interface:
- Agent selection cards with descriptions
- Form inputs (client name, industry, brief)
- Model selection dropdown
- Web research toggle (for SEO, Social, Research agents)
- Real-time result display

**API Endpoint**: `POST /api/agents/{agentId}`

### ProjectManagement

Project browsing and analysis history:
- Project list with filtering
- Analysis details per project
- Expandable JSON views
- Metadata display (model, timestamp, agent type)

**API Endpoints**:
- `GET /api/projects?limit=50`
- `GET /api/projects/:project_id`

## API Integration

The dashboard expects the following backend endpoints:

### Health Check
```
GET /health
```

### Agents
```
GET /agents
POST /agents/creative
POST /agents/seo
POST /agents/social
POST /agents/research
```

### Projects
```
GET /projects?limit=50&offset=0
GET /projects/:project_id
```

### General Analysis
```
POST /analyze
```

## Customization

### Colors

Edit `tailwind.config.ts` to customize the color palette:

```typescript
colors: {
  primary: {
    50: '#f0f9ff',
    // ... customize as needed
  },
}
```

### Charts

Charts use Recharts. Customize in each component:

```typescript
// Example: Change line color
<Line type="monotone" dataKey="requests" stroke="#your-color" />
```

### Analytics Data

Replace mock data in `AnalyticsDashboard.tsx`:

```typescript
useEffect(() => {
  // Replace this with actual API call
  fetch('/api/analytics')
    .then(res => res.json())
    .then(data => setData(data));
}, []);
```

## Environment Variables

Create `.env.local` for development:

```bash
# Backend API URL (default: http://localhost:8080)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Self-hosted

```bash
npm run build
npm start

# Or use PM2
pm2 start npm --name "5ml-dashboard" -- start
```

## Performance

- **Code Splitting**: Automatic via Next.js App Router
- **Image Optimization**: Use Next.js `<Image>` component
- **Font Optimization**: Automatic font subsetting
- **Bundle Size**: ~200KB gzipped (initial load)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Tips

### Live Reload

Changes to components auto-reload. No restart needed.

### Type Safety

TypeScript is configured in strict mode. Use proper types:

```typescript
interface MyProps {
  title: string;
  count: number;
}

export default function MyComponent({ title, count }: MyProps) {
  // ...
}
```

### Tailwind IntelliSense

Install the Tailwind CSS IntelliSense VS Code extension for autocomplete.

## Troubleshooting

### "Module not found" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### API calls failing

Check `next.config.js` rewrites and ensure backend is running on port 8080.

### Styles not applying

Rebuild Tailwind:

```bash
npm run dev
# Tailwind rebuilds automatically
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Part of the 5ML Agentic AI Platform v1
