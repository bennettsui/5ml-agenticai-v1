# PDF Compression Service

> **5ML Agentic AI** — Document Pipeline Use Case

A modular, self-hosted PDF compression microservice that exposes a simple JSON HTTP API.
Three agentic workflows call it:
- **Ingestion Agent** — normalise PDFs before OCR / RAG
- **Tender Agent** — shrink proposals to meet upload limits (lossless quality)
- **Sharing Agent** — generate compact PDFs for email / WhatsApp / client review

## Architecture

```
Agent / Orchestrator
        │
        │  POST /compress  { source, profile, priority, tags }
        ▼
┌──────────────────────────────────────────┐
│          FastAPI Application              │
│   app.py — request validation, routing   │
│                                          │
│  ┌──────────┐    ┌────────────────────┐  │
│  │ Fetcher  │    │ Compression        │  │
│  │          │    │ Strategy           │  │
│  │ local /  │    │ ─────────────────  │  │
│  │ https:// │    │ inspect file size  │  │
│  │ s3://    │    │ + profile → chain  │  │
│  └──────────┘    └────────┬───────────┘  │
│                           │              │
│               ┌───────────▼───────────┐  │
│               │  Tool Adapters        │  │
│               │ ┌─────────────────┐   │  │
│               │ │ PdfSizeOptAdapter│  │  │
│               │ │ PdfcAdapter      │  │  │
│               │ │ PdfEasyCompress  │  │  │
│               │ │ PaperweightAdapter│  │  │
│               │ └─────────────────┘   │  │
│               └───────────┬───────────┘  │
│                           │              │
│  ┌──────────────────────┐ │              │
│  │ Validator            │◄┘              │
│  │ • magic bytes        │                │
│  │ • page count (pypdf) │                │
│  │ • size improvement   │                │
│  └──────────────────────┘                │
└──────────────────────────────────────────┘
        │
        │  { ok, ratio, tool_chain, output_path, logs }
        ▼
   Agent / Orchestrator
```

### Sequence Diagram

```
Agent           API             Strategy         Adapter         FS
  │               │                │                │              │
  │─POST /compress►               │                │              │
  │               │─select_chain()►                │              │
  │               │               │◄────chain──────│              │
  │               │─compress()──────────────────►  │              │
  │               │               │                │─subprocess──►│
  │               │               │                │◄─result──────│
  │               │─validate()────────────────────────────────────►
  │               │◄─validation────────────────────────────────────
  │◄─CompressResponse─            │                │              │
```

## Tool Decision Matrix

| Profile    | Primary Tool       | Fallback       | DPI  | Use Case                         |
|------------|--------------------|----------------|------|----------------------------------|
| `lossless` | pdfsizeopt         | gs prepress    | 300  | Legal docs, certificates         |
| `balanced` | gs default         | pdfsizeopt     | 150  | Tenders, reports, client drafts  |
| `web`      | gs ebook           | pdfEasyCompress| 120  | Email, WhatsApp, web downloads   |
| `small`    | gs screen          | Paperweight    | 96   | Portal uploads with strict limits|
| `auto`     | size-based select  | —              | —    | General purpose                  |

## Quick Start

### Option A — Docker Compose (recommended)

```bash
cd use-cases/pdf-compression
docker-compose up --build
```

Service available at `http://localhost:8082`

### Option B — Local Python

```bash
# Install system dependencies
apt-get install ghostscript qpdf

# Install Python dependencies
cd use-cases/pdf-compression
pip install -r service/requirements.txt

# Run
uvicorn service.app:app --host 0.0.0.0 --port 8082 --reload
```

## API Reference

### `POST /compress`

```json
{
  "source": "https://example.com/proposal.pdf",
  "profile": "balanced",
  "max_size_mb": 10,
  "priority": "quality",
  "tags": ["tender", "clientX"]
}
```

**Response:**
```json
{
  "ok": true,
  "request_id": "a1b2c3d4",
  "original_size_bytes": 8388608,
  "compressed_size_bytes": 2097152,
  "ratio": 0.25,
  "reduction_pct": 75.0,
  "page_count": 42,
  "tool_chain": ["pdfsizeopt"],
  "output_path": "/tmp/pdf_compress/pdf_out_a1b2c3d4/compressed_proposal.pdf",
  "warnings": [],
  "logs": [
    "Compress request — source='...', profile=balanced",
    "Input resolved: /tmp/pdf_src_abc123.pdf (8,388,608 bytes)",
    "Chain selected: gs → pdfsizeopt",
    "Running tool: pdfc",
    "Tool pdfc finished in 4.21s — ok=True",
    "Success — 8,388,608 → 2,097,152 bytes (75.0% reduction, ratio=0.250)"
  ],
  "elapsed_seconds": 5.34,
  "error": ""
}
```

### `GET /health`

```json
{
  "status": "ok",
  "service": "pdf-compression",
  "version": "1.0.0",
  "tools": {
    "ghostscript": true,
    "pdfsizeopt": false,
    "paperweight": false,
    "pypdf": true
  }
}
```

### `GET /profiles`

Returns descriptions of all 5 compression profiles.

## Example curl Requests

```bash
# Balanced compression (tender submission)
curl -X POST http://localhost:8082/compress \
  -H "Content-Type: application/json" \
  -d '{"source":"/data/proposal.pdf","profile":"balanced","tags":["tender"]}'

# Web-optimised (WhatsApp / email)
curl -X POST http://localhost:8082/compress \
  -H "Content-Type: application/json" \
  -d '{"source":"/data/brochure.pdf","profile":"web","priority":"size","tags":["sharing"]}'

# Lossless (archive / legal)
curl -X POST http://localhost:8082/compress \
  -H "Content-Type: application/json" \
  -d '{"source":"/data/contract.pdf","profile":"lossless","tags":["legal","archive"]}'

# Aggressive (portal with 5 MB limit)
curl -X POST http://localhost:8082/compress \
  -H "Content-Type: application/json" \
  -d '{"source":"/data/deck.pdf","profile":"small","max_size_mb":5,"priority":"size"}'
```

## Profile Guidance

| Scenario                         | Recommended Profile | Why                                               |
|----------------------------------|---------------------|---------------------------------------------------|
| HK/SG tender upload (20 MB cap) | `lossless`          | Zero visual loss, signatures readable             |
| Internal archive                 | `balanced`          | Good compression, still easy to read/search       |
| Client review draft              | `web`               | Fast to email, opens quickly on mobile            |
| WhatsApp / LINE share            | `web` or `small`    | < 5 MB; recipients on mobile data                 |
| RAG / OCR ingestion              | `balanced`          | 150 DPI sufficient for text extraction            |
| Brochure / image-heavy deck      | `web`               | pdfEasyCompress image pass reduces image bulk     |

## Environment Variables

| Variable              | Default                 | Description                                  |
|-----------------------|-------------------------|----------------------------------------------|
| `PORT`                | `8080`                  | HTTP port inside container                   |
| `TEMP_DIR`            | `/tmp/pdf_compress`     | Working directory for intermediate files     |
| `GHOSTSCRIPT_BIN`     | `gs`                    | Path to Ghostscript binary                   |
| `PDFSIZEOPT_BIN`      | `pdfsizeopt`            | Path to pdfsizeopt binary                    |
| `PAPERWEIGHT_URL`     | _(empty)_               | URL of Paperweight service (optional)        |
| `MIN_REDUCTION_RATIO` | `0.05`                  | Skip compression if improvement < 5%         |

## Calling from Node.js Agent Orchestrator

```javascript
const res = await fetch('http://pdf-compression:8082/compress', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    source: '/shared/uploads/proposal.pdf',
    profile: 'balanced',
    priority: 'quality',
    tags: ['ingestion'],
  }),
});
const result = await res.json();
if (result.ok) {
  console.log(`Compressed: ${result.reduction_pct}% reduction → ${result.output_path}`);
} else {
  console.error('Compression failed:', result.error);
}
```

## Tool Installation Notes

### Ghostscript (required for pdfc, balanced, web, small profiles)
```bash
apt-get install ghostscript
```

### pdfsizeopt (for lossless profile)
```bash
# See Dockerfile for automated install
wget https://github.com/pts/pdfsizeopt/releases/download/2023-02-07/pdfsizeopt.single -O /usr/local/bin/pdfsizeopt
chmod +x /usr/local/bin/pdfsizeopt
```

### pypdf / qpdf (for output validation)
```bash
pip install pypdf     # Python PDF reader
apt-get install qpdf  # CLI fallback
```

### pdfEasyCompress (for image-heavy PDFs)
```bash
pip install pdf-easy-compress pikepdf Pillow
```
