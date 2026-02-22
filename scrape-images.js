#!/usr/bin/env node

/**
 * Radiance PR - Image URL Scraper
 * Run this locally (not on server) to harvest all image URLs from radiancehk.com
 * Usage: node scrape-images.js
 * Output: prints updated images object for download-images.js
 */

const https = require('https');

const PAGES = [
  { url: 'https://radiancehk.com/', category: 'hero' },
  { url: 'https://radiancehk.com/about/', category: 'about' },
  { url: 'https://radiancehk.com/work/', category: 'work-listing' },
  { url: 'https://radiancehk.com/services/', category: 'services' },
  { url: 'https://radiancehk.com/team/', category: 'team' },
  // Case Studies
  { url: 'https://radiancehk.com/lung-fu-shan/', category: 'case-studies/lung-fu-shan' },
  { url: 'https://radiancehk.com/her-own-words/', category: 'case-studies/her-own-words-sport' },
  { url: 'https://radiancehk.com/her-own-words-sport/', category: 'case-studies/her-own-words-sport' },
  { url: 'https://radiancehk.com/filorga/', category: 'case-studies/filorga' },
  { url: 'https://radiancehk.com/daikin/', category: 'case-studies/daikin' },
  { url: 'https://radiancehk.com/venice-biennale/', category: 'case-studies/venice-biennale' },
  { url: 'https://radiancehk.com/venice-biennale-hk/', category: 'case-studies/venice-biennale' },
  { url: 'https://radiancehk.com/chinese-culture-exhibition/', category: 'case-studies/chinese-culture' },
  { url: 'https://radiancehk.com/gp-batteries/', category: 'case-studies/gp-batteries' },
  { url: 'https://radiancehk.com/richmond-fellowship/', category: 'case-studies/richmond-fellowship' },
  // Try alternate slugs
  { url: 'https://radiancehk.com/case-studies/', category: 'case-studies-listing' },
  { url: 'https://radiancehk.com/portfolio/', category: 'portfolio-listing' },
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

function fetchPage(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: HEADERS, timeout: 10000 }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve);
      }
      if (res.statusCode !== 200) {
        return resolve({ url, status: res.statusCode, html: '' });
      }
      let html = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { html += chunk; });
      res.on('end', () => resolve({ url, status: 200, html }));
    });
    req.on('error', () => resolve({ url, status: 0, html: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ url, status: 0, html: '' }); });
  });
}

function extractImageUrls(html) {
  const urls = new Set();

  // Match src attributes in img tags
  const imgSrcRe = /(?:src|data-src|data-lazy-src)=["']([^"']+(?:\.jpg|\.jpeg|\.png|\.gif|\.webp)[^"']*?)["']/gi;
  let m;
  while ((m = imgSrcRe.exec(html)) !== null) {
    const u = m[1].split('?')[0].split(' ')[0];
    if (u.includes('wp-content/uploads') || u.includes('radiancehk.com')) {
      urls.add(u.startsWith('http') ? u : `https://radiancehk.com${u}`);
    }
  }

  // Match srcset
  const srcsetRe = /srcset=["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html)) !== null) {
    m[1].split(',').forEach(part => {
      const u = part.trim().split(' ')[0].split('?')[0];
      if (u.includes('wp-content/uploads')) {
        urls.add(u.startsWith('http') ? u : `https://radiancehk.com${u}`);
      }
    });
  }

  // Match background-image urls
  const bgRe = /url\(["']?(https?:\/\/radiancehk\.com\/wp-content\/uploads\/[^"')]+?)["']?\)/gi;
  while ((m = bgRe.exec(html)) !== null) {
    urls.add(m[1].split('?')[0]);
  }

  // Filter out thumbnail sizes (prefer originals)
  const filtered = [];
  const allUrls = [...urls];
  for (const u of allUrls) {
    // Skip if there's a version without -WxH suffix (keeps originals)
    const withoutSize = u.replace(/-\d+x\d+(\.\w+)$/, '$1');
    if (withoutSize !== u && allUrls.includes(withoutSize)) continue;
    filtered.push(u);
  }

  return filtered;
}

async function main() {
  const results = {};
  let totalFound = 0;

  console.log('Scraping radiancehk.com for image URLs...\n');

  for (const page of PAGES) {
    process.stdout.write(`Fetching ${page.url} ... `);
    const { status, html } = await fetchPage(page.url);

    if (status !== 200) {
      console.log(`[${status}] skipped`);
      continue;
    }

    const urls = extractImageUrls(html);
    console.log(`[${status}] found ${urls.length} images`);

    if (urls.length > 0) {
      if (!results[page.category]) results[page.category] = [];
      for (const u of urls) {
        if (!results[page.category].includes(u)) {
          results[page.category].push(u);
          totalFound++;
        }
      }
    }

    // Polite delay
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total images found: ${totalFound}`);
  console.log('='.repeat(60));
  console.log('\nPaste this into download-images.js as the `images` object:\n');
  console.log('const images = ' + JSON.stringify(results, null, 2) + ';');
}

main().catch(console.error);
