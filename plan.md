# Plan: Pure HTML + PHP Pack for TEDx Xinyi

## Overview

Create a standalone, deployable package of the TEDx Xinyi site using only HTML, CSS, JS, and PHP — no Node.js, no Python, no framework runtime. The site is already a fully static Next.js export with zero backend API calls from the frontend pages, so conversion is straightforward.

## Package Structure

```
tedx-xinyi-pack/
├── index.html                    # Home page
├── about.html                    # About TEDxXinyi
├── blog.html                     # Blog listing
├── community.html                # Community & TED Circles
├── salon.html                    # Featured Salon event
├── speakers.html                 # Speakers & Talks
├── sustainability.html           # Sustainability Design
├── assets/
│   ├── css/
│   │   └── style.css             # Extracted Tailwind + custom CSS
│   └── js/
│       └── app.js                # Minimal JS (nav toggle, animations, filters, video embeds)
├── images/                       # All site images (copied from public/tedx-xinyi/)
│   └── speakers/                 # Speaker photos
├── admin/
│   ├── index.php                 # Media library admin panel (login + dashboard)
│   ├── config.php                # Password, paths, settings
│   └── api/
│       ├── auth.php              # POST: password login → session token
│       ├── media.php             # GET: list all images with metadata
│       ├── metadata.php          # POST: update alt text / custom name
│       ├── upload.php            # POST: upload image (base64), auto-compress
│       ├── compress.php          # POST: compress single image
│       └── compress-all.php      # POST: batch compress all images
├── .htaccess                     # Clean URLs, security headers, cache rules
└── README.md                     # Deployment instructions
```

## Steps

### Step 1: Build the Next.js static export
- Run `cd frontend && npm run build` to generate fresh `out/` directory
- Verify all 7 HTML pages exist under `out/vibe-demo/tedx-xinyi/`

### Step 2: Create the pack directory and extract clean HTML pages
- Create `tedx-xinyi-pack/` directory at project root
- For each of the 7 pages in `out/vibe-demo/tedx-xinyi/`:
  - Extract the rendered HTML content from the Next.js build output
  - Strip Next.js RSC payload (`self.__next_f.push` scripts) and framework JS chunk references
  - Rewrite internal links from `/vibe-demo/tedx-xinyi/X` → `X.html` (relative paths)
  - Rewrite asset paths from `/_next/static/css/...` → `assets/css/style.css`
  - Rewrite image paths from `/tedx-xinyi/...` → `images/...`
  - Keep the JSON-LD structured data, meta tags, and OG tags
  - The homepage (`index.html` in out) maps to `index.html` in the pack

### Step 3: Extract and bundle CSS
- Copy the Tailwind CSS bundle from `out/_next/static/css/*.css`
- Append the inline `<style>` block (Google Fonts imports, @keyframes for fadeUp, scaleIn, marquee)
- Save as `assets/css/style.css`

### Step 4: Create minimal JavaScript
- Write `assets/js/app.js` with just the interactive behaviors:
  - **Mobile nav toggle**: hamburger menu open/close
  - **Scroll header**: transparent → white background on scroll
  - **Fade-in animations**: IntersectionObserver for `.fade-in` elements
  - **Blog filters**: category toggle (All / Curatorial / Guide)
  - **YouTube embed**: click-to-load video player on salon & speakers pages
  - **Image error handling**: hide broken images gracefully
- This replaces all the React hydration JS (~150KB of Next.js chunks) with ~3KB of vanilla JS

### Step 5: Copy images
- Copy all files from `frontend/public/tedx-xinyi/` → `tedx-xinyi-pack/images/`
- Include `speakers/` subdirectory

### Step 6: Create PHP admin panel

#### `admin/config.php`
- Define `ADMIN_PASS` (default: `5milesLab01@`, overridable via env)
- Define `IMAGES_DIR` (path to `../images/`)
- Define `METADATA_FILE` (path to `.media-metadata.json`)
- Define visual definitions array (the 10 expected visuals with descriptions)

#### `admin/index.php`
- Serve the media library HTML (adapted from existing `MEDIA_LIBRARY_HTML` in routes.js)
- Login form → AJAX to `api/auth.php`
- Same dark-themed UI, grid layout, toolbar buttons
- All fetch URLs point to `api/auth.php`, `api/media.php`, etc. (relative)

#### `admin/api/auth.php`
- Accept POST with `{ password }`
- Compare against `ADMIN_PASS` from config
- Return `{ ok: true, token }` or 401

#### `admin/api/media.php`
- Verify `x-admin-token` header
- Scan `IMAGES_DIR` recursively for image files
- Load metadata from `.media-metadata.json`
- Include missing visuals with `missing: true`
- Return JSON array of image objects

#### `admin/api/metadata.php`
- Verify token, accept POST with `{ key, alt, customName }`
- Read/update/write `.media-metadata.json` with `flock()` for safety

#### `admin/api/upload.php`
- Verify token, accept POST with `{ data, filename, folder, alt }`
- Decode base64 image data
- Resize using PHP GD: max 1920px for heroes, 800px for speakers
- Convert to WebP if GD supports it, otherwise keep original format
- Save to `IMAGES_DIR` (root or speakers/ subfolder)
- Update metadata file with alt text

#### `admin/api/compress.php`
- Verify token, accept POST with `{ key }`
- Load image with GD, resize (1920px heroes / 800px speakers)
- Re-encode with quality 80
- Overwrite original, return savings info

#### `admin/api/compress-all.php`
- Verify token, iterate all images in `IMAGES_DIR`
- Compress each, return aggregate results

### Step 7: Create .htaccess
- Enable mod_rewrite for clean URLs (optional: `/about` → `about.html`)
- Set cache headers (images: 7 days, CSS/JS: 7 days, HTML: 1 hour)
- Deny direct access to `admin/config.php` and `.media-metadata.json`
- Security headers (X-Content-Type-Options, X-Frame-Options)

### Step 8: Create README with deployment instructions
- Requirements: PHP 7.4+ with GD extension, Apache with mod_rewrite
- Deployment steps
- How to change admin password
- Image management guide

### Step 9: Build, verify, commit, and push
- Run frontend build to ensure latest HTML output
- Verify all files in pack are correct
- Commit to `claude/ai-agent-visual-generation-eW3Gi`
- Push

## Key Decisions

1. **No AI image generation in PHP pack** — Gemini API integration would add complexity. Users upload/manage images manually via the admin panel. The "Generate" buttons will be removed from the PHP admin.

2. **PHP GD for image processing** — GD is bundled with PHP by default (no ImageMagick dependency needed). Supports JPEG, PNG, WebP resize and compression. Sufficient for the use case.

3. **Relative paths everywhere** — The pack can be deployed to any subdirectory (e.g., `example.com/tedx/` or `example.com/`). All links and asset references use relative paths.

4. **No React hydration** — The Next.js build output includes ~150KB of JS for React hydration. We strip all of it and replace with ~3KB of vanilla JS for the few interactive behaviors (nav toggle, scroll effects, blog filters, video embeds).

5. **Self-contained** — The entire pack is a single directory with no external dependencies beyond a standard PHP-enabled web server.
