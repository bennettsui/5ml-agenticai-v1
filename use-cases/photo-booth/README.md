# AI Photo Booth - Phase 1

18th-century fashion portrait generator for live events with AI-powered transformation.

## Overview

Transform photos into 18th-century aristocratic portraits with AI. Features 6 historical themes from different European countries with period-appropriate costumes and environments.

## Features

- **Face Detection**: Claude Vision-powered face and quality analysis
- **6 Historical Themes**: Versailles Court, Georgian England, Austro-Hungarian Empire, Russian Imperial, Italian Venetian, Spanish Colonial
- **Real-time Progress**: Server-Sent Events (SSE) for live progress updates
- **Image Generation**: ComfyUI integration with Stable Diffusion 1.5
- **Branding**: Automatic 5ML logo and hashtag overlay
- **QR Code Sharing**: Easy download and sharing via QR codes

## Architecture

```
PhotoBoothOrchestrator (Layer 3: Orchestration)
├── Session Manager Agent
│   └── Create/read/update session state
├── Face & Quality Check Agent
│   └── Validate faces, lighting, composition
├── Environment & Context Agent
│   └── Analyze scene → suggest theme (generates SSE feedback)
├── Style Generator Agent
│   └── Compose detailed image prompts for ComfyUI
├── Image Generation Agent
│   └── Call ComfyUI API, handle streaming progress
├── Branding Agent
│   └── Overlay 5ML logo + hashtag
├── QR & Delivery Agent
│   └── Generate QR code, create short links
└── Analytics Logger Agent
    └── Log sessions, errors, theme usage
```

## API Endpoints

### Session Management

- `POST /api/photo-booth/session/create` - Create new session
- `GET /api/photo-booth/session/:session_id/status` - Get session status

### Image Processing

- `POST /api/photo-booth/image/upload` - Upload image (multipart)
- `POST /api/photo-booth/analyze` - Analyze image (SSE stream)
- `POST /api/photo-booth/generate` - Generate styled image (SSE stream)
- `POST /api/photo-booth/finalize` - Apply branding + generate QR

### Themes & Assets

- `GET /api/photo-booth/themes` - Get available themes
- `GET /api/photo-booth/image/:image_id` - Get image by ID
- `GET /api/photo-booth/qr/:qr_id` - Get QR code image
- `GET /api/photo-booth/download/:short_id` - Download branded image

### Analytics

- `GET /api/photo-booth/event/:event_id/analytics` - Get event analytics

## Database Schema

```sql
-- Events table
photo_booth_events (event_id, name, brand_name, logo_path, hashtag, metadata_json)

-- Sessions table
photo_booth_sessions (session_id, event_id, user_consent, language, theme_selected, status)

-- Images table
photo_booth_images (image_id, session_id, image_type, image_path, theme, comfyui_prompt)

-- QR codes table
photo_booth_qr_codes (qr_id, session_id, image_id, qr_code_path, short_link, download_link)

-- Errors table
photo_booth_errors (error_id, session_id, error_code, error_message, agent_name)

-- Analytics table
photo_booth_analytics (event_id, date, total_sessions, completed_count, failed_count)
```

## Themes

| Theme | Country | Era | Description |
|-------|---------|-----|-------------|
| Versailles Court | France | 1700-1789 | French court dress, powdered wigs, palace interior |
| Georgian England | UK | 1714-1830 | British aristocratic fashion, stately home |
| Austro-Hungarian | Austria | 1700-1800 | Habsburg court, baroque embroidered coats |
| Russian Imperial | Russia | 1700-1800 | Catherine era, Winter Palace, fur-trimmed robes |
| Italian Venetian | Italy | 1700-1800 | Carnival masks, palazzo interior |
| Spanish Colonial | Spain | 1700-1800 | Bourbon court, Royal Palace of Madrid |

## Configuration

### Environment Variables

```bash
# ComfyUI
COMFYUI_URL=http://localhost:8188
COMFYUI_MOCK_MODE=true  # Enable mock mode for development

# Storage paths
UPLOAD_PATH=/tmp/photo-booth/uploads
OUTPUT_PATH=/tmp/photo-booth/outputs
QR_CODE_PATH=/tmp/photo-booth/qrcodes
PUBLIC_BASE_URL=http://localhost:8080

# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### ComfyUI Setup (Phase 1 - Mock Mode)

For Phase 1, ComfyUI runs in mock mode. No GPU required for development.

To enable real generation:
1. Install ComfyUI with GPU
2. Download SD 1.5 model
3. Set `COMFYUI_URL` and disable `COMFYUI_MOCK_MODE`

## File Structure

```
use-cases/photo-booth/
├── api/
│   └── routes.js            # Express router
├── agents/
│   ├── orchestrator.ts      # Main coordinator
│   ├── sessionManager.ts    # Session CRUD
│   ├── faceQualityCheck.ts  # Face detection
│   ├── environmentAnalysis.ts # Scene analysis
│   ├── styleGenerator.ts    # Prompt composition
│   ├── imageGeneration.ts   # ComfyUI calls
│   ├── brandingAgent.ts     # Logo overlay
│   ├── qrDelivery.ts        # QR code generation
│   └── analyticsLogger.ts   # Logging
├── lib/
│   ├── comfyuiClient.ts     # ComfyUI API wrapper
│   ├── imageProcessor.ts    # Sharp.js utilities
│   └── errorFormatter.ts    # Error handling
├── config/
│   ├── photoBooth.config.ts # Configuration
│   └── themes.json          # Theme definitions
├── db/
│   └── schema.sql           # Database tables
├── types/
│   └── index.ts             # TypeScript types
└── assets/
    └── 5ml-logo.png         # Branding logo
```

## Frontend Pages

- `/photo-booth` - Main photo booth experience
- `/photo-booth/share/[id]` - Share page for viewing photos

## Error Codes

| Code | Description |
|------|-------------|
| FB_UPLOAD_001 | File too large / invalid format |
| FB_FACE_001 | No faces detected |
| FB_FACE_002 | Multiple faces (Phase 1 constraint) |
| FB_LIGHT_001 | Poor lighting detected |
| FB_THEME_001 | Theme not found |
| FB_GENAI_001 | Generation timeout |
| FB_GENAI_002 | ComfyUI unreachable |
| FB_BRAND_001 | Logo not found |
| FB_QR_001 | QR generation failed |

## Phase 2 Roadmap

- MBTI quiz for personalized theme selection
- LoRA training for 18th-century fashion
- Multi-screen event dashboard
- Learning feedback loop from user preferences
