#!/usr/bin/env node
/**
 * Build script: Extracts clean HTML from Next.js static export
 * Strips RSC payload, rewrites paths for standalone deployment.
 * Run: node _build.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'frontend', 'out');
const PACK_DIR = __dirname;

// Page mapping: source → dest
const PAGES = [
  { src: 'vibe-demo/tedx-xinyi.html', dest: 'index.html', isHome: true },
  { src: 'vibe-demo/tedx-xinyi/about.html', dest: 'about.html' },
  { src: 'vibe-demo/tedx-xinyi/blog.html', dest: 'blog.html' },
  { src: 'vibe-demo/tedx-xinyi/community.html', dest: 'community.html' },
  { src: 'vibe-demo/tedx-xinyi/salon.html', dest: 'salon.html' },
  { src: 'vibe-demo/tedx-xinyi/speakers.html', dest: 'speakers.html' },
  { src: 'vibe-demo/tedx-xinyi/sustainability.html', dest: 'sustainability.html' },
];

function processHTML(html, page) {
  let out = html;

  // 1. Remove Next.js comment marker
  out = out.replace(/<!--[a-zA-Z0-9_]+-->/g, '');

  // 2. Remove all <script src="/_next/..."> tags (framework JS)
  out = out.replace(/<script[^>]*src="\/_next\/[^"]*"[^>]*><\/script>/g, '');

  // 3. Remove <link rel="preload" as="script" .../_next/...> tags
  out = out.replace(/<link[^>]*rel="preload"[^>]*as="script"[^>]*href="\/_next\/[^"]*"[^>]*\/>/g, '');

  // 4. Remove all RSC payload scripts: <script>self.__next_f...</script> and <script>(self.__next_f...)</script>
  out = out.replace(/<script>\s*self\.__next_f[^<]*<\/script>/g, '');
  out = out.replace(/<script>\s*\(self\.__next_f[^<]*<\/script>/g, '');

  // 5. Remove the hidden div (React internals)
  out = out.replace(/<div hidden=""><!--\$--><!--\/\$--><\/div>/g, '');

  // 6. Remove the <script id="_R_"...> tag
  out = out.replace(/<script[^>]*id="_R_"[^>]*><\/script>/g, '');

  // 7. Replace CSS link: /_next/static/css/xxx.css → assets/css/style.css
  out = out.replace(
    /<link rel="stylesheet" href="\/_next\/static\/css\/[^"]*" data-precedence="next"\/>/g,
    '<link rel="stylesheet" href="assets/css/style.css"/>'
  );

  // 8. Replace internal nav links FIRST (before image path rewrite)
  // /vibe-demo/tedx-xinyi/X → X.html, /vibe-demo/tedx-xinyi → index.html
  out = out.replace(/href="\/vibe-demo\/tedx-xinyi\/([a-z-]+)"/g, 'href="$1.html"');
  out = out.replace(/href="\/vibe-demo\/tedx-xinyi"/g, 'href="index.html"');

  // 9. Replace image paths: /tedx-xinyi/ → images/
  out = out.replace(/\/tedx-xinyi\//g, 'images/');

  // 11. Remove polyfills script (noModule)
  out = out.replace(/<script[^>]*noModule[^>]*><\/script>/g, '');

  // 12. Remove favicon link pointing to /icon.svg (we don't have it)
  // Keep it but make it relative
  out = out.replace(/href="\/icon\.svg[^"]*"/g, 'href="assets/favicon.svg"');

  // 13. Add our custom JS before </body>
  out = out.replace('</body>', '<script src="assets/js/app.js"></script>\n</body>');

  // 14. Add data attributes for JS interactivity
  // Mark nav for scroll behavior
  out = out.replace(
    /(<nav class="fixed[^"]*")/g,
    '$1 data-nav="main"'
  );

  // Mark mobile menu button
  out = out.replace(
    /(aria-controls="mobile-menu")/g,
    '$1 data-action="toggle-menu"'
  );

  // 15. Fix canonical URL
  out = out.replace(
    /href="https:\/\/5ml-agenticai-v1\.fly\.dev\/vibe-demo\/tedx-xinyi"/g,
    'href="./"'
  );
  out = out.replace(
    /content="https:\/\/5ml-agenticai-v1\.fly\.dev\/vibe-demo\/tedx-xinyi"/g,
    'content="./"'
  );

  // 16. Fix OG image URLs — make relative
  out = out.replace(
    /content="https:\/\/5ml-agenticai-v1\.fly\.dev\/tedx-xinyi\//g,
    'content="images/'
  );

  // 17. Fix JSON-LD URLs
  out = out.replace(
    /https:\/\/5ml-agenticai-v1\.fly\.dev\/vibe-demo\/tedx-xinyi/g,
    './'
  );
  out = out.replace(
    /https:\/\/5ml-agenticai-v1\.fly\.dev\/tedx-xinyi\//g,
    'images/'
  );

  // 18. Add data-youtube attribute to the video play container (speakers page)
  // Pattern: <button ... aria-label="Play video"> inside a div with YouTube thumbnail
  out = out.replace(
    /(<div[^>]*class="[^"]*relative[^"]*aspect-video[^"]*"[^>]*>)(<button[^>]*aria-label="Play video")/g,
    '$1<div data-youtube="wvv9lGRh6RI" class="absolute inset-0">$2'
  );
  // If the above didn't match, try a simpler approach: add data-youtube to the nearest parent of Play video button
  if (out.includes('aria-label="Play video"') && !out.includes('data-youtube')) {
    out = out.replace(
      /(aria-label="Play video")/,
      '$1 data-play="true"'
    );
    // Wrap the play button section
    out = out.replace(
      /(<div class="relative aspect-video[^"]*"[^>]*>)/,
      '$1<div data-youtube="wvv9lGRh6RI" style="position:relative;width:100%;height:100%">'
    );
  }

  // 19. Clean up multiple empty lines
  out = out.replace(/\n{3,}/g, '\n\n');

  return out;
}

// Process each page
for (const page of PAGES) {
  const srcPath = path.join(OUT_DIR, page.src);
  if (!fs.existsSync(srcPath)) {
    console.error(`MISSING: ${srcPath}`);
    continue;
  }
  const raw = fs.readFileSync(srcPath, 'utf8');
  const clean = processHTML(raw, page);
  const destPath = path.join(PACK_DIR, page.dest);
  fs.writeFileSync(destPath, clean, 'utf8');

  const savings = ((1 - clean.length / raw.length) * 100).toFixed(1);
  console.log(`✓ ${page.dest} (${(raw.length / 1024).toFixed(1)}KB → ${(clean.length / 1024).toFixed(1)}KB, -${savings}%)`);
}

console.log('\nDone! HTML pages extracted.');
