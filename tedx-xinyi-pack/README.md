# TEDxXinyi — Static Site + PHP Admin

A standalone deployment package for the TEDxXinyi website. Pure HTML/CSS/JS frontend with a PHP-powered admin panel for image management.

## Requirements

- **Web Server**: Apache with `mod_rewrite` enabled (or Nginx with equivalent rules)
- **PHP**: 7.4+ with GD extension (`php-gd`)
- No Node.js, Python, or other runtimes needed

## Quick Start

1. Upload the entire `tedx-xinyi-pack/` folder to your web server
2. Ensure the `images/` directory is writable by PHP: `chmod -R 775 images/`
3. Visit `yoursite.com/` to see the public site
4. Visit `yoursite.com/admin/` to access the media library

## Admin Panel

**Default password**: `5milesLab01@`

### Change password
Edit `admin/config.php` and change the `ADMIN_PASS` value. Or set the `TEDX_ADMIN_PASS` environment variable on your server.

### Features
- **Upload images** — JPG, PNG, WebP (auto-compressed on upload)
- **Compress images** — Resize + re-encode for web (heroes max 1920px, speakers max 800px)
- **Batch compress** — Compress all images at once
- **Alt text** — Edit alt text per image (saved to `.media-metadata.json`)
- **Missing visuals** — Shows which expected images are not yet uploaded

## File Structure

```
├── index.html              Home page
├── about.html              About TEDxXinyi
├── blog.html               Blog listing
├── community.html          Community & TED Circles
├── salon.html              Featured Salon event
├── speakers.html           Speakers & Talks
├── sustainability.html     Sustainability Design
├── assets/
│   ├── css/style.css       Tailwind CSS bundle
│   └── js/app.js           Vanilla JS (nav, animations, filters)
├── images/                 All site images (writable)
│   └── speakers/           Speaker photos
├── admin/
│   ├── index.php           Media library UI
│   ├── config.php          Settings (password, paths)
│   └── api/
│       ├── auth.php        Login endpoint
│       ├── media.php       List images
│       ├── metadata.php    Update alt text
│       ├── upload.php      Upload + auto-compress
│       ├── compress.php    Compress single image
│       └── compress-all.php  Batch compress
├── .htaccess               Apache config (caching, security, clean URLs)
└── _build.js               Build script (only needed for regenerating HTML from Next.js)
```

## Notes

- The `_build.js` script is only needed if you want to regenerate the HTML pages from the Next.js source. It's not required for deployment.
- Images are not included in the package — upload them via the admin panel.
- The site uses Google Fonts (Noto Sans TC, Caveat) loaded from Google CDN.
- External images (from tedxxinyi.com, YouTube thumbnails, Wikipedia) are loaded directly.
