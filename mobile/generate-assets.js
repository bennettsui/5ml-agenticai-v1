#!/usr/bin/env node
/**
 * EventFlow asset generator
 * Creates all required Expo PNG assets + web SVG logo
 * using the `sharp` library (SVG → PNG rasterization).
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ─── SVG Templates ────────────────────────────────────────────────────────────

/**
 * Full EventFlow icon mark: rounded-square bg + stylised calendar/ticket mark.
 * size: total canvas size (background fills the whole square).
 * padding: inner padding so the icon fits nicely inside a rounded square.
 */
function iconSvg(size, { rounded = true, padFactor = 0.18, bgColor = null } = {}) {
  const p = Math.round(size * padFactor);        // padding on each side
  const inner = size - p * 2;                    // inner content area

  // Icon elements drawn inside a `inner × inner` box, starting at (p, p).
  // We draw a stylised event/ticket shape: a rectangle with a notch + lines.

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.22;   // corner radius of the inner white shape

  // Ticket body (white rounded rect occupying ~55% width, 65% height)
  const tw = inner * 0.62;
  const th = inner * 0.72;
  const tx = cx - tw / 2;
  const ty = cy - th / 2;
  const tr = tw * 0.12;

  // Notch circles on the left/right mid-point of the ticket
  const notchR = th * 0.075;
  const notchY = ty + th * 0.42;

  // Header band inside ticket (where date goes)
  const hh = th * 0.28;

  // Content lines (3 small rounded rectangles)
  const lineW = tw * 0.52;
  const lineH = th * 0.055;
  const lineX = tx + tw * 0.14;
  const line1Y = ty + hh + th * 0.09;
  const line2Y = line1Y + lineH * 2.4;
  const line3Y = line2Y + lineH * 2.4;

  // Calendar grid dots in header
  const dotR = hh * 0.09;
  const dotY = ty + hh * 0.55;
  const dotSpacing = tw * 0.13;
  const dotStartX = tx + tw * 0.24;

  // Dashed divider y
  const divY = ty + hh;

  // Flow arrow (small orange right-pointing chevron to the bottom-right)
  const arrowCX = tx + tw * 0.82;
  const arrowCY = ty + th * 0.77;
  const arrowSize = tw * 0.12;

  const bgCorner = rounded ? size * 0.22 : 0;
  const bgFill = bgColor
    ? `<rect width="${size}" height="${size}" rx="${bgCorner}" ry="${bgCorner}" fill="${bgColor}"/>`
    : `<defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f97316"/>
          <stop offset="100%" stop-color="#dc2626"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${bgCorner}" ry="${bgCorner}" fill="url(#bg)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bgFill}

  <!-- Ticket body shadow -->
  <rect x="${tx + size * 0.012}" y="${ty + size * 0.016}" width="${tw}" height="${th}" rx="${tr}" ry="${tr}"
        fill="rgba(0,0,0,0.18)"/>

  <!-- Ticket body -->
  <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${tr}" ry="${tr}" fill="white"/>

  <!-- Header band -->
  <clipPath id="clip${size}">
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${tr}" ry="${tr}"/>
  </clipPath>
  <rect x="${tx}" y="${ty}" width="${tw}" height="${hh}" fill="#f97316" clip-path="url(#clip${size})"/>

  <!-- Divider dashes -->
  <line x1="${tx + tw * 0.18}" y1="${divY}" x2="${tx + tw * 0.82}" y2="${divY}"
        stroke="#e2e8f0" stroke-width="${lineH * 0.9}" stroke-dasharray="${lineH * 1.8} ${lineH * 1.2}"
        stroke-linecap="round"/>

  <!-- Left notch -->
  <circle cx="${tx}" cy="${notchY}" r="${notchR}" fill="#f97316"/>

  <!-- Right notch -->
  <circle cx="${tx + tw}" cy="${notchY}" r="${notchR}" fill="#f97316"/>

  <!-- Calendar dots in header (3 dots) -->
  <circle cx="${dotStartX}" cy="${dotY}" r="${dotR}" fill="rgba(255,255,255,0.85)"/>
  <circle cx="${dotStartX + dotSpacing}" cy="${dotY}" r="${dotR}" fill="rgba(255,255,255,0.85)"/>
  <circle cx="${dotStartX + dotSpacing * 2}" cy="${dotY}" r="${dotR}" fill="rgba(255,255,255,0.85)"/>

  <!-- "EF" text initials in header -->
  <text x="${cx}" y="${ty + hh * 0.72}"
        font-family="system-ui,Arial,sans-serif" font-weight="800" font-size="${hh * 0.52}"
        fill="white" text-anchor="middle" dominant-baseline="auto"
        letter-spacing="-0.5">EF</text>

  <!-- Content lines -->
  <rect x="${lineX}" y="${line1Y}" width="${lineW}" height="${lineH}" rx="${lineH / 2}" fill="#334155"/>
  <rect x="${lineX}" y="${line2Y}" width="${lineW * 0.72}" height="${lineH}" rx="${lineH / 2}" fill="#94a3b8"/>
  <rect x="${lineX}" y="${line3Y}" width="${lineW * 0.55}" height="${lineH}" rx="${lineH / 2}" fill="#cbd5e1"/>

  <!-- Flow arrow chevron (orange) -->
  <polyline points="${arrowCX - arrowSize * 0.5},${arrowCY - arrowSize * 0.5} ${arrowCX + arrowSize * 0.1},${arrowCY} ${arrowCX - arrowSize * 0.5},${arrowCY + arrowSize * 0.5}"
            stroke="#f97316" stroke-width="${arrowSize * 0.32}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

/**
 * Notification icon: simple white calendar-with-dot on transparent bg.
 * Android notification icons must be single-colour (white) on transparent.
 */
function notificationSvg(size) {
  const s = size;
  const cx = s / 2, cy = s / 2;
  const bw = s * 0.62, bh = s * 0.56;
  const bx = cx - bw / 2, by = cy - bh / 2 + s * 0.04;
  const br = bw * 0.1;
  const hh = bh * 0.25;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${br}" fill="white"/>
  <rect x="${bx}" y="${by}" width="${bw}" height="${hh}" rx="${br}" fill="white" opacity="0.5"/>
  <rect x="${bx}" y="${by + hh - 2}" width="${bw}" height="2" fill="white" opacity="0.3"/>
  <!-- dot badge -->
  <circle cx="${bx + bw * 0.72}" cy="${by - s * 0.04}" r="${s * 0.12}" fill="white"/>
</svg>`;
}

/**
 * Splash screen: centered icon on dark background.
 */
function splashSvg(size) {
  const iconSize = Math.round(size * 0.28);
  const offset = (size - iconSize) / 2;

  // Embed the icon SVG with a transform
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0f172a"/>
  <g transform="translate(${offset}, ${offset})">
    ${iconSvg(iconSize).replace(/<svg[^>]*>/, '').replace('</svg>', '')}
  </g>
  <!-- EventFlow wordmark -->
  <text x="${size / 2}" y="${size / 2 + iconSize / 2 + size * 0.065}"
        font-family="system-ui,Arial,sans-serif" font-weight="700" font-size="${size * 0.042}"
        fill="#f1f5f9" text-anchor="middle">EventFlow</text>
</svg>`;
}

/**
 * Web logo SVG: horizontal lockup (icon + wordmark).
 */
function webLogoSvg({ height = 48, dark = true } = {}) {
  const iconSize = height;
  const gap = Math.round(height * 0.35);
  const fontSize = Math.round(height * 0.48);
  const totalWidth = iconSize + gap + Math.round(fontSize * 5.5);
  const textColor = dark ? '#f1f5f9' : '#0f172a';
  const subColor = dark ? '#94a3b8' : '#64748b';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">
  <!-- Icon mark -->
  <g>
    ${iconSvg(iconSize).replace(/<svg[^>]*>/, '').replace('</svg>', '')}
  </g>
  <!-- Wordmark -->
  <text x="${iconSize + gap}" y="${Math.round(height * 0.67)}"
        font-family="system-ui,-apple-system,Arial,sans-serif" font-weight="700" font-size="${fontSize}"
        fill="${textColor}" dominant-baseline="auto">Event<tspan fill="#f97316">Flow</tspan></text>
</svg>`;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function svgToPng(svgString, outputPath, size) {
  await sharp(Buffer.from(svgString))
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`  ✓ ${outputPath}`);
}

async function svgToPngRect(svgString, outputPath, width, height) {
  await sharp(Buffer.from(svgString))
    .resize(width, height)
    .png()
    .toFile(outputPath);
  console.log(`  ✓ ${outputPath}`);
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✓ ${filePath}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const participantAssets = path.join(__dirname, '../mobile/eventflow-participant/assets');
  const organizerAssets   = path.join(__dirname, '../mobile/eventflow-organizer/assets');
  const webPublic         = path.join(__dirname, '../frontend/public');

  fs.mkdirSync(participantAssets, { recursive: true });
  fs.mkdirSync(organizerAssets, { recursive: true });
  fs.mkdirSync(webPublic, { recursive: true });

  // ── App Icons (1024×1024) ──
  console.log('\nGenerating app icons…');
  const icon1024 = iconSvg(1024);
  await svgToPng(icon1024, path.join(participantAssets, 'icon.png'), 1024);
  await svgToPng(icon1024, path.join(organizerAssets,  'icon.png'), 1024);

  // ── Adaptive Icons (foreground only, on white — Android) ──
  // Android adaptive icon: foreground is the icon, no background (it's provided separately)
  console.log('\nGenerating adaptive icons…');
  const adaptive1024 = iconSvg(1024, { rounded: false, padFactor: 0.12, bgColor: 'transparent' });
  // sharp needs a background to composite onto for transparency — keep transparent
  await sharp(Buffer.from(adaptive1024))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(participantAssets, 'adaptive-icon.png'));
  console.log(`  ✓ ${path.join(participantAssets, 'adaptive-icon.png')}`);
  await sharp(Buffer.from(adaptive1024))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(organizerAssets, 'adaptive-icon.png'));
  console.log(`  ✓ ${path.join(organizerAssets, 'adaptive-icon.png')}`);

  // ── Splash screens (2048×2048) ──
  console.log('\nGenerating splash screens…');
  const splash2048 = splashSvg(2048);
  await svgToPngRect(splash2048, path.join(participantAssets, 'splash.png'), 2048, 2048);
  await svgToPngRect(splash2048, path.join(organizerAssets,  'splash.png'), 2048, 2048);

  // ── Favicons (48×48) ──
  console.log('\nGenerating favicons…');
  const favicon48 = iconSvg(48, { padFactor: 0.1 });
  await svgToPng(favicon48, path.join(participantAssets, 'favicon.png'), 48);
  await svgToPng(favicon48, path.join(organizerAssets,  'favicon.png'), 48);

  // ── Notification icons (96×96, white on transparent) ──
  console.log('\nGenerating notification icons…');
  const notif96 = notificationSvg(96);
  await svgToPng(notif96, path.join(participantAssets, 'notification-icon.png'), 96);
  await svgToPng(notif96, path.join(organizerAssets,  'notification-icon.png'), 96);

  // ── Web favicon / logo ──
  console.log('\nGenerating web assets…');
  await svgToPng(iconSvg(512), path.join(webPublic, 'eventflow-icon.png'), 512);
  await svgToPng(iconSvg(192), path.join(webPublic, 'eventflow-icon-192.png'), 192);
  await svgToPng(favicon48, path.join(webPublic, 'favicon.ico.png'), 48);

  // Web SVG logo (horizontal lockup) — saved as SVG for scalable use
  writeFile(path.join(webPublic, 'eventflow-logo.svg'), webLogoSvg({ height: 48, dark: true }));
  writeFile(path.join(webPublic, 'eventflow-logo-light.svg'), webLogoSvg({ height: 48, dark: false }));

  // Also save the raw icon SVG for any other use
  writeFile(path.join(webPublic, 'eventflow-icon.svg'), iconSvg(256));

  console.log('\nAll assets generated successfully! ✓');
}

main().catch(err => { console.error(err); process.exit(1); });
