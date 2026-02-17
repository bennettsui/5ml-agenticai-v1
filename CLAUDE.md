# 5ML AgenticAI — Claude Code Guidance

This file gives Claude context about this repository so it can work effectively without repeated explanation.

---

## Project Overview

Full-stack agentic AI demo platform. Express (Node.js) backend + Next.js 14 App Router frontend.
Deployed to Fly.io at `https://5ml-agenticai-v1.fly.dev`.

**Key paths:**
- `index.js` — Express server entry point, all API route mounts, static serving
- `frontend/` — Next.js app (App Router), pages under `app/`
- `use-cases/` — Self-contained use-case modules (each has `api/`, `scripts/`, sometimes `agents/`)
- `frontend/public/` — Static assets served by Next.js and Express

---

## NanoBanana — AI Image Generation

**NanoBanana** is the project nickname for Gemini-powered AI image generation (model: `gemini-2.5-flash-image`).

### How It Works

Each use case that needs generated images has:
- A `use-cases/<name>/api/routes.js` with a `VISUALS` array of `{ id, filename, prompt }` objects
- A `use-cases/<name>/scripts/generate-visuals.js` standalone runner script
- Images are saved to `frontend/public/<name>/` and served via Express static middleware

### Adding NanoBanana to a New Use Case

**Step 1** — Copy the pattern from an existing use case:
```
use-cases/tedx-xinyi/api/routes.js           ← API endpoints
use-cases/tedx-xinyi/scripts/generate-visuals.js  ← standalone runner
```

**Step 2** — Add static serving in `index.js`:
```js
app.use('/<name>', express.static(path.join(__dirname, 'frontend', 'public', '<name>')));
```

**Step 3** — Mount the API router in `index.js`:
```js
const myRoutes = require('./use-cases/<name>/api/routes');
app.use('/api/<name>', myRoutes);
```

**Step 4** — Add auto-generation block in `index.js` (after server starts), following the manifest-diff pattern already used for `tedx-boundary-street` and `tedx-xinyi`.

### Running Image Generation

**Option A — Standalone script (recommended for initial generation):**
```bash
GEMINI_API_KEY=your_key node use-cases/<name>/scripts/generate-visuals.js
# Options:
#   --force         Regenerate even if file exists
#   --id=<id>       Generate only one specific image
```

**Option B — HTTP API (when server is running):**
```bash
# Check status (which images exist, Gemini available?)
curl https://5ml-agenticai-v1.fly.dev/api/<name>/status

# Generate all missing images
curl -X POST https://5ml-agenticai-v1.fly.dev/api/<name>/generate-all \
  -H "Content-Type: application/json" -d '{}'

# Force regenerate all
curl -X POST https://5ml-agenticai-v1.fly.dev/api/<name>/generate-all \
  -H "Content-Type: application/json" -d '{"force": true}'

# Generate single image by ID
curl -X POST https://5ml-agenticai-v1.fly.dev/api/<name>/generate \
  -H "Content-Type: application/json" -d '{"id": "hero-home"}'
```

**Option C — Server auto-generation on startup:**
The `index.js` manifest-diff logic auto-generates changed/new visuals on every server start if `GEMINI_API_KEY` is set. This is the Fly.io auto-trigger path — images are generated in the background ~15–30s after startup.

### GEMINI_API_KEY

- **Production (Fly.io):** Set as a Fly.io secret — `fly secrets set GEMINI_API_KEY=AIza...`
- **Local development:** Add to `.env` file as `GEMINI_API_KEY=AIza...`
- The key is NOT committed to the repo. It is NOT in `fly.toml`.

### Image Serving

Generated images live in `frontend/public/<name>/` and are served at `/<name>/<filename>.png` via Express static. In Next.js components, reference them as `/tedx-xinyi/hero-home.png` etc.

**Graceful fallback pattern used in all hero sections:**
```tsx
<img
  src="/tedx-xinyi/hero-home.png"
  alt=""
  className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
  onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '0.45'; }}
  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
/>
<div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-transparent to-white" />
```
The image loads invisibly, fades in on success, and hides on error. The gradient always shows underneath.

---

## Active Use Cases

### TEDxBoundaryStreet
- **URL:** `/vibe-demo/tedx-boundary-street`
- **Design:** Dark noir, monochrome, TED red accent. "The Line as Canvas."
- **Images:** `frontend/public/tedx/` → served at `/tedx/`
- **API:** `/api/tedx/`
- **Script:** `use-cases/tedx-boundary-street/scripts/generate-visuals.js`

### TEDxXinyi
- **URL:** `/vibe-demo/tedx-xinyi`
- **Design:** Bold Festival Poster — warm, light backgrounds, Taipei energy. DISTINCT from Boundary Street.
- **Palette:** TED_RED `#E62B1E`, WARM_AMBER `#F59E0B`, OFF_WHITE `#FAF9F6`, WARM_GRAY `#F3F1EC`
- **Pages:** Home, About, Salon (new 2026), Speakers & Talks, Sustainability, Community, Blog
- **Images:** `frontend/public/tedx-xinyi/` → served at `/tedx-xinyi/`
- **API:** `/api/tedx-xinyi/`
- **Script:** `use-cases/tedx-xinyi/scripts/generate-visuals.js`
- **Visuals (9 total):**
  - `hero-home`, `hero-about`, `hero-speakers`, `hero-sustainability`, `hero-community`
  - `salon-teaser`, `salon-hero`, `salon-galaxy`, `salon-curiosity`

### Current Salon Event (TEDxXinyi 2026)
- **Name:** "We are Becoming – AI趨勢沙龍"
- **Date:** 2026/3/31
- **Venue:** 台北藝術表演中心 藍盒子 (Taipei Performing Arts Center – Blue Box)
- **Page:** `/vibe-demo/tedx-xinyi/salon`
- Speaker names NOT publicly shown yet (domain teaser cards only)

---

## Frontend Architecture

- **Framework:** Next.js 14, App Router, `'use client'` components
- **Styling:** Tailwind CSS
- **Chinese font:** Noto Sans TC (Google Fonts, loaded via CSS @import in `globalStyles`)
- **Shared components per vibe:** Each vibe demo has its own `components.tsx` with nav, footer, section wrappers, constants

### TEDxXinyi Shared Components (`frontend/app/vibe-demo/tedx-xinyi/components.tsx`)
- `SiteNav` — sticky nav, `heroMode` prop for transparent-on-dark-hero → white-on-scroll
- `SiteFooter`
- `Section` — section wrapper with `bg` prop: `'white' | 'warm' | 'red' | 'dark'`
- `SectionLabel` — small uppercase label, `dark` prop for white variant
- `FadeIn` — intersection-observer fade-in wrapper with optional `delay` ms
- `NAV_ITEMS` — update this array when adding/removing pages

---

## Deployment

**Branch:** `claude/ai-agent-visual-generation-eW3Gi` → pushes to Fly.io CI/CD
**Deploy:** `git push -u origin claude/ai-agent-visual-generation-eW3Gi` triggers Fly.io build+deploy
**App:** `5ml-agenticai-v1` on Fly.io

NanoBanana images are NOT in git — they regenerate on server startup via the manifest-diff auto-gen system. If images don't appear right after deploy, wait ~2 minutes for generation to complete.

---

## Git Conventions

- Branch: always `claude/ai-agent-visual-generation-eW3Gi`
- Commit messages: imperative, descriptive, include session URL footer
- Never push to main/master
