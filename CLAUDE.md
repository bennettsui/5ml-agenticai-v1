# 5ML Agentic AI Platform

## Project Structure
- **Backend**: `index.js` — Express API server (single file, ~2200 lines)
- **Frontend**: `frontend/` — Next.js 14, App Router, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with pgvector for embeddings
- **Services**: `services/` — deepseek, rag-service, schedule-registry
- **Knowledge**: `knowledge/` — VectorStore, EmbeddingService, SemanticSearch, connectors

## Build & Verify

**Always use `npm`, not `bun` or `yarn`.**

```sh
# 1. Frontend build (ALWAYS run before committing frontend changes)
cd frontend && npm run build

# 2. Backend start
npm start
```

**Verification rule**: Never commit without a successful `npm run build` first. If the build fails, fix it before committing.

## Key Files
- Dashboard tabs: `frontend/app/dashboard/page.tsx`
- Cost/stats data: `/stats` endpoint in `index.js` (search `useCases:`)
- Cron scheduling: `services/schedule-registry.js`
- Workflow chat: `/api/workflow-chat` endpoint in `index.js`
- Health checks: `/api/health/services` and `/api/health/services/:id` in `index.js`

## UI / Dark Theme Conventions
- Cards: `dark:bg-slate-800/60` — NEVER `dark:bg-slate-800` (too harsh)
- Subtle backgrounds: `dark:bg-white/[0.03]` or `dark:bg-white/[0.04]`
- Hover states: `dark:hover:bg-white/[0.02]` — NEVER solid hover colors like `dark:hover:bg-slate-750`
- Table row borders: `dark:border-slate-700/50` — not full opacity
- Formula/code boxes: `dark:bg-white/[0.02]`

## Component Patterns
- **No auto-fetch on mount**: Dashboard components must NOT call `fetch()` in `useEffect` on load. Let users trigger via button click (e.g., API health tab).
- **Dashboard tabs over separate pages**: New features go as tabs in `frontend/app/dashboard/page.tsx`, not standalone pages.
- **Canvas pan/zoom**: Use CSS `transform: translate() scale()` — never `overflow-auto` for pannable canvases.
- **Node interactions**: Use `onMouseDown={e => e.stopPropagation()}` on interactive elements inside pannable canvases.

## Model Routing
- **Primary**: DeepSeek Reasoner ($0.14/$0.28 per 1M tokens) — most agent tasks
- **Fallback**: Claude Haiku ($0.25/$1.25 per 1M) — simple classification/extraction
- **Research**: Perplexity Sonar ($3.00/$15.00 per 1M) — web search tasks
- **Vision/complex only**: Claude Sonnet ($3.00/$15.00 per 1M)

## TEDxXinyi Admin / Media Library

### Fly.dev Ephemeral Filesystem — Critical
Fly.dev machines have **ephemeral filesystems**. All files written at runtime (generated images, `.media-metadata.json`) are **wiped on every machine restart, deploy, or sleep/wake cycle**. `fly.toml` has NO volume mounts.

**How it manifests**: Images appear in the admin media library after generation, but disappear "after a while" when the Fly machine restarts.

**Current mitigations**:
1. **CDN fallback** (`index.js`): If a `/tedx-xinyi/*` image file is missing locally, middleware checks `.media-metadata.json` for a `publicUrl` and 302-redirects to mmdbfiles CDN
2. **Seed file** (`use-cases/tedx-xinyi/api/.media-metadata-seed.json`): Committed to git. On startup, if `.media-metadata.json` is missing, metadata is restored from this seed
3. **mmdbfiles backup**: After every metadata save, the JSON is backed up to mmdbfiles (debounced 5s)
4. **Admin not-missing logic**: Images with a CDN URL in metadata are shown as available even if the local file is gone

**After generating images**: Always commit the updated `.media-metadata-seed.json` to git so CDN URLs survive deploys.

**Recovery endpoints**:
- `GET /api/tedx-xinyi/metadata-export` — download current metadata JSON
- `POST /api/tedx-xinyi/metadata-import` — restore metadata from JSON (merges with existing)

**Permanent fix**: Add a Fly persistent volume (`[[mounts]]` in `fly.toml`) to persist `/app/frontend/public/tedx-xinyi/`.

### Media Library Key Files
- Routes: `use-cases/tedx-xinyi/api/routes.js`
- Metadata: `frontend/public/tedx-xinyi/.media-metadata.json` (runtime, ephemeral)
- Seed: `use-cases/tedx-xinyi/api/.media-metadata-seed.json` (git, persistent)
- CDN fallback: `index.js` (after `/tedx-xinyi` static middleware)

## Known Mistakes to Avoid
- Marketing strategy was set to 5 runs/day — should be 1 run/day ($3.60/mo not $18/mo)
- API health tab auto-fetched on every tab switch — expensive and unnecessary
- Cost analysis was a separate page — should be a dashboard tab
- Dark hover backgrounds used `dark:bg-slate-750` — too harsh, use subtle opacity values
- `overflow-auto` on workflow canvas prevented proper pan/zoom — use transform-based approach
- **TEDx media metadata on ephemeral Fly filesystem** — stored in `.media-metadata.json` which is wiped on restart. Always commit seed file and use CDN URLs as source of truth
- **Modifying TSX source files at runtime** has no effect — Next.js is pre-built at deploy time. Use CDN redirect fallback in Express middleware instead
