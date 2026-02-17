/**
 * Debug / Health-Check API Routes
 *
 * Provides endpoints for the Website Health Check and Debug QA use cases.
 * Sessions live in-memory (no extra DB tables required).
 *
 * Module runners actually fetch the target URL and parse the HTML to produce
 * specific, actionable findings with evidence.
 */
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const router = express.Router();
const uuidv4 = () => crypto.randomUUID();

module.exports = function createDebugRoutes() {
  // In-memory session store (sufficient for demo / single-instance deployment)
  const sessions = new Map();
  const issues = new Map(); // id -> issue

  // --------------------------------------------------
  // Module definitions
  // --------------------------------------------------
  const MODULE_DEFS = [
    { id: 'brand_guardian', name: 'Brand Guardian', description: 'Checks deliverables against brand profile, tone, do/don\'t lists', applicable_subject_types: ['web_page','design','video','social_post','document'], version: '1.0', status: 'active' },
    { id: 'web_qc', name: 'Web Quality Check', description: 'Broken links, accessibility, performance auditing', applicable_subject_types: ['web_page'], version: '1.0', status: 'active' },
    { id: 'social_best_practice', name: 'Social Best Practice', description: 'Platform-specific social post guidelines', applicable_subject_types: ['social_post'], version: '1.0', status: 'active' },
    { id: 'design_accuracy', name: 'Design Accuracy', description: 'Visual compliance with brand style guide', applicable_subject_types: ['design'], version: '1.0', status: 'active' },
    { id: 'content_review', name: 'Content Review', description: 'Tone, message alignment, grammar', applicable_subject_types: ['document','web_page'], version: '1.0', status: 'active' },
    { id: 'seo_aiseo', name: 'SEO / AI SEO Audit', description: 'Ahrefs-style SEO analysis, meta tags, structured data, internal linking, AI content signals, Core Web Vitals SEO impact', applicable_subject_types: ['web_page'], version: '1.0', status: 'active' },
    { id: 'website_health', name: 'Website Health Check', description: 'Google PageSpeed, Core Web Vitals (LCP, INP, CLS), broken links, mobile-friendliness, HTTPS, WCAG 2.2', applicable_subject_types: ['web_page'], version: '1.0', status: 'active' },
  ];

  // ==================================================================
  // Page Fetching
  // ==================================================================

  async function fetchPage(rawUrl) {
    let url = rawUrl;
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }

    const start = Date.now();
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; 5MLHealthBot/1.0; +https://5ml.ai)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        validateStatus: () => true, // Don't throw on non-2xx
        responseType: 'text',
      });

      const responseTimeMs = Date.now() - start;
      const html = typeof response.data === 'string' ? response.data : String(response.data || '');
      const finalUrl = response.request?.res?.responseUrl || url;

      return {
        url,
        finalUrl,
        html,
        headers: response.headers || {},
        statusCode: response.status,
        responseTimeMs,
        contentLength: html.length,
        error: null,
      };
    } catch (err) {
      return {
        url,
        finalUrl: url,
        html: '',
        headers: {},
        statusCode: 0,
        responseTimeMs: Date.now() - start,
        contentLength: 0,
        error: err.code === 'ECONNABORTED' ? 'Request timed out (15s)' : err.message,
      };
    }
  }

  // ==================================================================
  // HTML Parsing Helpers
  // ==================================================================

  function extractTitle(html) {
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return match ? match[1].replace(/\s+/g, ' ').trim() : null;
  }

  function extractMetaContent(html, nameOrProp) {
    const patterns = [
      new RegExp(`<meta[^>]*name=["']${nameOrProp}["'][^>]*content=["']([^"']*)["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${nameOrProp}["']`, 'i'),
      new RegExp(`<meta[^>]*property=["']${nameOrProp}["'][^>]*content=["']([^"']*)["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${nameOrProp}["']`, 'i'),
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m) return m[1];
    }
    return null;
  }

  function extractAllHeadings(html) {
    const headings = [];
    const regex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let m;
    while ((m = regex.exec(html))) {
      headings.push({ level: parseInt(m[1]), text: m[2].replace(/<[^>]+>/g, '').trim() });
    }
    return headings;
  }

  function extractAllLinks(html, baseUrl) {
    const links = [];
    const regex = /<a\s[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = regex.exec(html))) {
      const href = m[1].trim();
      const text = m[2].replace(/<[^>]+>/g, '').trim();
      let isInternal = false;
      try {
        const linkUrl = new URL(href, baseUrl);
        const pageUrl = new URL(baseUrl);
        isInternal = linkUrl.hostname === pageUrl.hostname;
      } catch {}
      links.push({ href, text, isInternal });
    }
    return links;
  }

  function extractAllImages(html) {
    const images = [];
    const regex = /<img\s([^>]*?)>/gi;
    let m;
    while ((m = regex.exec(html))) {
      const attrs = m[1];
      const src = (attrs.match(/src=["']([^"']*)["']/i) || [])[1] || '';
      const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
      const hasAlt = /\balt\s*=/i.test(attrs);
      images.push({ src, alt: altMatch ? altMatch[1] : null, hasAlt });
    }
    return images;
  }

  function extractJsonLd(html) {
    const schemas = [];
    const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = regex.exec(html))) {
      try { schemas.push(JSON.parse(m[1])); } catch {}
    }
    return schemas;
  }

  function hasViewportMeta(html) {
    return /<meta[^>]*name=["']viewport["']/i.test(html);
  }

  function hasCharsetDeclaration(html) {
    return /<meta[^>]*charset=/i.test(html) || /<meta[^>]*http-equiv=["']Content-Type["']/i.test(html);
  }

  function hasDoctype(html) {
    return /^\s*<!DOCTYPE\s+html/i.test(html);
  }

  function getHtmlLang(html) {
    const m = html.match(/<html[^>]*\slang=["']([^"']*)["']/i);
    return m ? m[1] : null;
  }

  function hasFavicon(html) {
    return /<link[^>]*rel=["'][^"']*icon[^"']*["']/i.test(html);
  }

  function extractCanonical(html) {
    const m = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    if (m) return m[1];
    const m2 = html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
    return m2 ? m2[1] : null;
  }

  function countDeprecatedTags(html) {
    const deprecated = ['font', 'center', 'marquee', 'blink', 'strike', 'big', 'tt'];
    const found = [];
    for (const tag of deprecated) {
      const regex = new RegExp(`<${tag}[\\s>]`, 'gi');
      const matches = html.match(regex);
      if (matches && matches.length > 0) {
        found.push({ tag, count: matches.length });
      }
    }
    return found;
  }

  function countInlineStyles(html) {
    const matches = html.match(/\sstyle=["']/gi);
    return matches ? matches.length : 0;
  }

  function truncate(str, maxLen) {
    if (!str) return str;
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
  }

  // ==================================================================
  // SEO / AI SEO Audit Module
  // ==================================================================

  function checkSeoAiseo(pageData) {
    const findings = [];
    const { html, finalUrl, error: fetchError } = pageData;

    if (fetchError) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'critical', finding: `Could not fetch page for SEO audit: ${fetchError}`, evidence: { url: pageData.url, error: fetchError }, recommendation: 'Ensure the URL is accessible. Check DNS, SSL certificate, and server availability.', score_impact: 15, business_impact: 'high' });
      return findings;
    }

    // --- Title Tag ---
    const title = extractTitle(html);
    if (!title) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'critical', finding: 'Missing <title> tag. Search engines use this as the primary ranking signal and clickable headline in search results.', evidence: { element: 'title', status: 'missing' }, recommendation: 'Add a <title> tag in the <head> section. Keep it 50-60 characters, include your primary keyword near the start, and make it compelling for clicks.', score_impact: 10, business_impact: 'high' });
    } else if (title.length < 30) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'minor', finding: `Title tag is too short (${title.length} chars). Current title: "${truncate(title, 100)}"`, evidence: { element: 'title', current_value: title, char_count: title.length, recommended_range: '50-60 characters' }, recommendation: 'Expand the title to 50-60 characters. Add descriptive keywords and a value proposition to improve CTR in search results.', score_impact: 3, business_impact: 'medium' });
    } else if (title.length > 60) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'minor', finding: `Title tag is too long (${title.length} chars — Google truncates at ~60). Current title: "${truncate(title, 100)}"`, evidence: { element: 'title', current_value: title, char_count: title.length, recommended_range: '50-60 characters', truncated_preview: title.slice(0, 57) + '...' }, recommendation: 'Shorten to 50-60 characters. Move the most important keywords to the beginning. Remove filler words.', score_impact: 2, business_impact: 'medium' });
    } else {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'info', finding: `Title tag is well-optimized (${title.length} chars): "${title}"`, evidence: { element: 'title', current_value: title, char_count: title.length, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Meta Description ---
    const desc = extractMetaContent(html, 'description');
    if (!desc) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'major', finding: 'Missing meta description. Google shows this as the snippet below your title in search results. Without it, Google auto-generates one (often poorly).', evidence: { element: 'meta[name="description"]', status: 'missing' }, recommendation: 'Add <meta name="description" content="..."> in <head>. Write 150-160 characters with a clear value proposition and call to action.', score_impact: 6, business_impact: 'high' });
    } else if (desc.length < 120) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'minor', finding: `Meta description is short (${desc.length} chars). Current: "${truncate(desc, 120)}"`, evidence: { element: 'meta[name="description"]', current_value: desc, char_count: desc.length, recommended_range: '150-160 characters' }, recommendation: 'Expand to 150-160 characters. Include your target keyword, a benefit statement, and a call to action.', score_impact: 2, business_impact: 'medium' });
    } else if (desc.length > 160) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'minor', finding: `Meta description is too long (${desc.length} chars — Google truncates at ~160). Current: "${truncate(desc, 120)}"`, evidence: { element: 'meta[name="description"]', current_value: desc, char_count: desc.length, recommended_range: '150-160 characters' }, recommendation: 'Shorten to 150-160 characters so Google displays the full snippet. Front-load the most compelling text.', score_impact: 1, business_impact: 'low' });
    } else {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'info', finding: `Meta description is well-optimized (${desc.length} chars): "${truncate(desc, 120)}"`, evidence: { element: 'meta[name="description"]', current_value: desc, char_count: desc.length, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- H1 Tags ---
    const headings = extractAllHeadings(html);
    const h1s = headings.filter(h => h.level === 1);
    if (h1s.length === 0) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'major', finding: 'No H1 tag found. The H1 is a key on-page SEO signal that tells search engines what the page is about.', evidence: { element: 'h1', count: 0, all_headings: headings.slice(0, 10).map(h => `H${h.level}: ${truncate(h.text, 60)}`) }, recommendation: 'Add exactly one <h1> tag near the top of the page content. Include your primary target keyword naturally.', score_impact: 5, business_impact: 'high' });
    } else if (h1s.length > 1) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'minor', finding: `Found ${h1s.length} H1 tags — best practice is exactly 1. Found: ${h1s.map(h => `"${truncate(h.text, 50)}"`).join(', ')}`, evidence: { element: 'h1', count: h1s.length, h1_values: h1s.map(h => h.text) }, recommendation: 'Reduce to a single H1 that clearly describes the page topic. Use H2-H6 for subsections.', score_impact: 2, business_impact: 'medium' });
    } else {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'info', finding: `H1 tag is present: "${truncate(h1s[0].text, 80)}"`, evidence: { element: 'h1', count: 1, value: h1s[0].text, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Heading Hierarchy ---
    if (headings.length > 0) {
      const hierarchyIssues = [];
      for (let i = 1; i < headings.length; i++) {
        if (headings[i].level > headings[i - 1].level + 1) {
          hierarchyIssues.push(`H${headings[i - 1].level} → H${headings[i].level} (skipped H${headings[i - 1].level + 1})`);
        }
      }
      if (hierarchyIssues.length > 0) {
        findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'minor', finding: `Heading hierarchy has ${hierarchyIssues.length} skip(s): ${hierarchyIssues.slice(0, 3).join('; ')}${hierarchyIssues.length > 3 ? ` and ${hierarchyIssues.length - 3} more` : ''}`, evidence: { heading_structure: headings.slice(0, 15).map(h => `H${h.level}: ${truncate(h.text, 40)}`), skips: hierarchyIssues }, recommendation: 'Maintain proper heading hierarchy (H1 → H2 → H3). Don\'t skip levels. This helps screen readers and SEO crawlers understand content structure.', score_impact: 1, business_impact: 'low' });
      }
    }

    // --- Canonical URL ---
    const canonical = extractCanonical(html);
    if (!canonical) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'minor', finding: 'No canonical URL declared. This can cause duplicate content issues if the page is accessible at multiple URLs.', evidence: { element: 'link[rel="canonical"]', status: 'missing' }, recommendation: 'Add <link rel="canonical" href="..."> in <head> pointing to the preferred URL for this page.', score_impact: 2, business_impact: 'medium' });
    } else {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'info', finding: `Canonical URL is set: ${truncate(canonical, 80)}`, evidence: { element: 'link[rel="canonical"]', value: canonical, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Open Graph Tags ---
    const ogTitle = extractMetaContent(html, 'og:title');
    const ogDesc = extractMetaContent(html, 'og:description');
    const ogImage = extractMetaContent(html, 'og:image');
    const ogMissing = [];
    if (!ogTitle) ogMissing.push('og:title');
    if (!ogDesc) ogMissing.push('og:description');
    if (!ogImage) ogMissing.push('og:image');
    if (ogMissing.length > 0) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: ogMissing.length >= 2 ? 'minor' : 'info', finding: `Missing Open Graph tags: ${ogMissing.join(', ')}. Social shares (Facebook, LinkedIn, Slack) will show generic previews.`, evidence: { missing_tags: ogMissing, og_title: ogTitle || null, og_description: ogDesc ? truncate(ogDesc, 80) : null, og_image: ogImage || null }, recommendation: `Add the missing Open Graph meta tags in <head>: ${ogMissing.map(t => `<meta property="${t}" content="...">`).join(', ')}`, score_impact: ogMissing.length >= 2 ? 2 : 0, business_impact: ogMissing.length >= 2 ? 'medium' : 'low' });
    } else {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'info', finding: 'Open Graph tags are complete (og:title, og:description, og:image). Social shares will display rich previews.', evidence: { og_title: truncate(ogTitle, 60), og_description: truncate(ogDesc, 60), og_image: truncate(ogImage, 80), status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Structured Data (JSON-LD) ---
    const schemas = extractJsonLd(html);
    if (schemas.length === 0) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'minor', finding: 'No JSON-LD structured data found. Structured data enables rich snippets in Google (star ratings, FAQs, breadcrumbs, etc.).', evidence: { element: 'script[type="application/ld+json"]', count: 0 }, recommendation: 'Add JSON-LD structured data for your content type. Common schemas: Organization, WebPage, BreadcrumbList, Article, Product, FAQ. Use Google\'s Structured Data Testing Tool to validate.', score_impact: 3, business_impact: 'medium' });
    } else {
      const types = schemas.map(s => s['@type'] || (Array.isArray(s['@graph']) ? 'Graph' : 'Unknown'));
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'info', finding: `Found ${schemas.length} JSON-LD schema(s): ${types.join(', ')}`, evidence: { element: 'script[type="application/ld+json"]', count: schemas.length, types, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Internal Links ---
    const links = extractAllLinks(html, finalUrl);
    const internalLinks = links.filter(l => l.isInternal);
    const externalLinks = links.filter(l => !l.isInternal);
    const emptyTextLinks = links.filter(l => !l.text);
    if (internalLinks.length < 3) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'minor', finding: `Only ${internalLinks.length} internal links found. Internal linking helps search engines discover pages and distributes page authority.`, evidence: { internal_count: internalLinks.length, external_count: externalLinks.length, total_links: links.length }, recommendation: 'Add more internal links to related pages. Aim for 3+ contextual internal links per page. Use descriptive anchor text (not "click here").', score_impact: 2, business_impact: 'medium' });
    } else {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'info', finding: `Found ${internalLinks.length} internal links and ${externalLinks.length} external links.`, evidence: { internal_count: internalLinks.length, external_count: externalLinks.length, total_links: links.length, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Robots Meta ---
    const robotsMeta = extractMetaContent(html, 'robots');
    if (robotsMeta && /noindex/i.test(robotsMeta)) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'critical', finding: `Page has "noindex" robots meta — search engines will NOT index this page. Current value: "${robotsMeta}"`, evidence: { element: 'meta[name="robots"]', current_value: robotsMeta }, recommendation: 'If this page should appear in search results, remove "noindex" from the robots meta tag. If intentional (staging, private page), this is fine.', score_impact: 15, business_impact: 'high' });
    }

    // --- SPA / Low Content Detection ---
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
    if (bodyText.length < 200 && html.length > 500) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'major', finding: `Very little text content found (${bodyText.length} chars). This may be a JavaScript-rendered SPA — search engines may not see the full content.`, evidence: { visible_text_length: bodyText.length, html_length: html.length, sample: truncate(bodyText, 200) }, recommendation: 'If using a JavaScript framework (React, Vue, Angular), implement Server-Side Rendering (SSR) or Static Site Generation (SSG) so search engines can index your content.', score_impact: 5, business_impact: 'high' });
    }

    return findings;
  }

  // ==================================================================
  // Website Health Module
  // ==================================================================

  function checkWebsiteHealth(pageData) {
    const findings = [];
    const { html, headers, statusCode, responseTimeMs, finalUrl, url, contentLength, error: fetchError } = pageData;

    if (fetchError) {
      findings.push({ module: 'website_health', area: 'Health', severity: 'critical', finding: `Website is unreachable: ${fetchError}`, evidence: { url, error: fetchError, response_time_ms: responseTimeMs }, recommendation: 'Check that the server is running, DNS is configured correctly, and SSL certificate is valid.', score_impact: 20, business_impact: 'high' });
      return findings;
    }

    // --- HTTP Status Code ---
    if (statusCode >= 500) {
      findings.push({ module: 'website_health', area: 'Health', severity: 'critical', finding: `Server error: HTTP ${statusCode}. The server is returning an error response.`, evidence: { status_code: statusCode, url: finalUrl }, recommendation: 'Check server logs for errors. Common causes: misconfigured server, application crash, database connection failure.', score_impact: 15, business_impact: 'high' });
    } else if (statusCode >= 400) {
      findings.push({ module: 'website_health', area: 'Health', severity: 'major', finding: `Client error: HTTP ${statusCode}. ${statusCode === 404 ? 'Page not found.' : statusCode === 403 ? 'Access forbidden.' : 'The URL returned an error.'}`, evidence: { status_code: statusCode, url: finalUrl }, recommendation: statusCode === 404 ? 'Verify the URL is correct. Set up proper 404 handling and redirects for moved pages.' : 'Check access permissions and authentication requirements.', score_impact: 10, business_impact: 'high' });
    } else if (statusCode >= 300) {
      findings.push({ module: 'website_health', area: 'Health', severity: 'info', finding: `Redirect detected: HTTP ${statusCode}. Original URL redirected to: ${truncate(finalUrl, 80)}`, evidence: { status_code: statusCode, original_url: url, final_url: finalUrl }, recommendation: 'Redirects add latency. Update links to point directly to the final URL where possible.', score_impact: 0, business_impact: 'low' });
    } else {
      findings.push({ module: 'website_health', area: 'Health', severity: 'info', finding: `HTTP ${statusCode} OK — page loads successfully.`, evidence: { status_code: statusCode, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Response Time ---
    if (responseTimeMs > 3000) {
      findings.push({ module: 'website_health', area: 'Health', severity: 'major', finding: `Very slow response time: ${responseTimeMs}ms. Google recommends server response under 200ms (TTFB).`, evidence: { response_time_ms: responseTimeMs, threshold_good: '< 500ms', threshold_fair: '500-1500ms', threshold_slow: '> 1500ms' }, recommendation: 'Investigate server performance. Common fixes: enable caching (Redis, CDN), optimize database queries, use a faster hosting provider, enable gzip compression.', score_impact: 6, business_impact: 'high' });
    } else if (responseTimeMs > 1500) {
      findings.push({ module: 'website_health', area: 'Health', severity: 'minor', finding: `Slow response time: ${responseTimeMs}ms. Users may notice lag, and Google factors page speed into rankings.`, evidence: { response_time_ms: responseTimeMs, threshold_good: '< 500ms' }, recommendation: 'Consider enabling a CDN (Cloudflare, AWS CloudFront), server-side caching, and gzip/brotli compression.', score_impact: 3, business_impact: 'medium' });
    } else if (responseTimeMs > 500) {
      findings.push({ module: 'website_health', area: 'Health', severity: 'info', finding: `Acceptable response time: ${responseTimeMs}ms. Could be improved for better Core Web Vitals.`, evidence: { response_time_ms: responseTimeMs, status: 'acceptable' }, recommendation: 'Good performance. For further optimization, consider CDN and edge caching.', score_impact: 0, business_impact: 'low' });
    } else {
      findings.push({ module: 'website_health', area: 'Health', severity: 'info', finding: `Fast response time: ${responseTimeMs}ms.`, evidence: { response_time_ms: responseTimeMs, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- HTTPS ---
    const isHttps = finalUrl.startsWith('https://');
    if (!isHttps) {
      findings.push({ module: 'website_health', area: 'Security', severity: 'critical', finding: `Page is served over HTTP (not HTTPS). Browsers show "Not Secure" warning, and Google penalizes non-HTTPS sites in rankings.`, evidence: { url: finalUrl, protocol: 'http', secure: false }, recommendation: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS. Free options: Let\'s Encrypt, Cloudflare. Update all internal links to use https://.', score_impact: 10, business_impact: 'high' });
    } else {
      findings.push({ module: 'website_health', area: 'Security', severity: 'info', finding: 'Page is served over HTTPS with a valid SSL certificate.', evidence: { protocol: 'https', secure: true, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Page Size ---
    const pageSizeKB = Math.round(contentLength / 1024);
    if (contentLength > 1500000) {
      findings.push({ module: 'website_health', area: 'Performance', severity: 'major', finding: `Page HTML is very large: ${pageSizeKB}KB (${(contentLength / 1048576).toFixed(1)}MB). Recommended: under 1.5MB total page weight.`, evidence: { html_size_bytes: contentLength, html_size_kb: pageSizeKB }, recommendation: 'Reduce page weight: compress images (WebP/AVIF), minify CSS/JS, remove unused code, lazy-load below-fold content.', score_impact: 5, business_impact: 'high' });
    } else if (contentLength > 500000) {
      findings.push({ module: 'website_health', area: 'Performance', severity: 'minor', finding: `Page HTML is ${pageSizeKB}KB. While acceptable, a leaner page loads faster on slow connections.`, evidence: { html_size_bytes: contentLength, html_size_kb: pageSizeKB }, recommendation: 'Consider minifying HTML, reducing inline CSS/JS, and deferring non-critical resources.', score_impact: 2, business_impact: 'medium' });
    } else {
      findings.push({ module: 'website_health', area: 'Performance', severity: 'info', finding: `Page HTML size is ${pageSizeKB}KB — within healthy range.`, evidence: { html_size_bytes: contentLength, html_size_kb: pageSizeKB, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Viewport Meta (Mobile-Friendliness) ---
    if (!hasViewportMeta(html)) {
      findings.push({ module: 'website_health', area: 'Mobile', severity: 'major', finding: 'Missing viewport meta tag. The page will not scale properly on mobile devices, and Google uses mobile-first indexing.', evidence: { element: 'meta[name="viewport"]', status: 'missing' }, recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> in <head>. This is essential for responsive design.', score_impact: 5, business_impact: 'high' });
    } else {
      findings.push({ module: 'website_health', area: 'Mobile', severity: 'info', finding: 'Viewport meta tag is present — page supports mobile scaling.', evidence: { element: 'meta[name="viewport"]', status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Security Headers ---
    const securityHeaders = [];
    const hsts = headers['strict-transport-security'];
    const csp = headers['content-security-policy'];
    const xfo = headers['x-frame-options'];
    const xcto = headers['x-content-type-options'];
    const xss = headers['x-xss-protection'];

    if (!hsts) securityHeaders.push('Strict-Transport-Security (HSTS)');
    if (!csp) securityHeaders.push('Content-Security-Policy (CSP)');
    if (!xfo) securityHeaders.push('X-Frame-Options');
    if (!xcto) securityHeaders.push('X-Content-Type-Options');

    if (securityHeaders.length > 0) {
      const severity = securityHeaders.length >= 3 ? 'minor' : 'info';
      findings.push({ module: 'website_health', area: 'Security', severity, finding: `Missing ${securityHeaders.length} security header(s): ${securityHeaders.join(', ')}`, evidence: { missing_headers: securityHeaders, present_headers: { hsts: !!hsts, csp: !!csp, x_frame_options: !!xfo, x_content_type_options: !!xcto } }, recommendation: `Add the missing security headers to your server configuration. Key headers:\n• Strict-Transport-Security: max-age=31536000; includeSubDomains\n• Content-Security-Policy: default-src 'self'\n• X-Frame-Options: DENY\n• X-Content-Type-Options: nosniff`, score_impact: severity === 'minor' ? 2 : 0, business_impact: severity === 'minor' ? 'medium' : 'low' });
    } else {
      findings.push({ module: 'website_health', area: 'Security', severity: 'info', finding: 'All major security headers are present (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).', evidence: { hsts: truncate(hsts, 60), csp: truncate(csp, 60), x_frame_options: xfo, x_content_type_options: xcto, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Character Encoding ---
    if (!hasCharsetDeclaration(html)) {
      findings.push({ module: 'website_health', area: 'Health', severity: 'minor', finding: 'No character encoding declared. Browsers may misinterpret special characters, causing garbled text.', evidence: { element: 'meta[charset]', status: 'missing' }, recommendation: 'Add <meta charset="UTF-8"> as the first element in <head>.', score_impact: 1, business_impact: 'low' });
    }

    // --- Compression ---
    const contentEncoding = headers['content-encoding'] || '';
    if (!contentEncoding && contentLength > 10000) {
      findings.push({ module: 'website_health', area: 'Performance', severity: 'minor', finding: `No compression detected (no Content-Encoding header). The ${pageSizeKB}KB page could be significantly smaller with gzip or brotli.`, evidence: { content_encoding: 'none', html_size_kb: pageSizeKB }, recommendation: 'Enable gzip or brotli compression on your web server. This typically reduces transfer size by 60-80%. In nginx: gzip on; In Apache: mod_deflate.', score_impact: 2, business_impact: 'medium' });
    }

    return findings;
  }

  // ==================================================================
  // Web Quality Check Module
  // ==================================================================

  function checkWebQc(pageData) {
    const findings = [];
    const { html, finalUrl, error: fetchError } = pageData;

    if (fetchError) {
      findings.push({ module: 'web_qc', area: 'QC', severity: 'critical', finding: `Could not fetch page for quality check: ${fetchError}`, evidence: { url: pageData.url, error: fetchError }, recommendation: 'Ensure the URL is accessible and returns a valid HTML response.', score_impact: 10, business_impact: 'high' });
      return findings;
    }

    // --- DOCTYPE ---
    if (!hasDoctype(html)) {
      findings.push({ module: 'web_qc', area: 'Standards', severity: 'minor', finding: 'Missing <!DOCTYPE html> declaration. The page may render in quirks mode, causing inconsistent layout across browsers.', evidence: { element: '<!DOCTYPE html>', status: 'missing' }, recommendation: 'Add <!DOCTYPE html> as the very first line of the HTML document.', score_impact: 1, business_impact: 'low' });
    }

    // --- HTML Lang Attribute ---
    const lang = getHtmlLang(html);
    if (!lang) {
      findings.push({ module: 'web_qc', area: 'Accessibility', severity: 'minor', finding: 'Missing lang attribute on <html> tag. Screen readers need this to pronounce content correctly, and it\'s a WCAG 2.2 requirement.', evidence: { element: '<html>', attribute: 'lang', status: 'missing' }, recommendation: 'Add lang="en" (or appropriate language code) to the <html> tag: <html lang="en">', score_impact: 2, business_impact: 'medium' });
    } else {
      findings.push({ module: 'web_qc', area: 'Accessibility', severity: 'info', finding: `HTML lang attribute is set: "${lang}"`, evidence: { element: '<html>', attribute: 'lang', value: lang, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Images Without Alt Text ---
    const images = extractAllImages(html);
    const noAltImages = images.filter(img => !img.hasAlt);
    const emptyAltImages = images.filter(img => img.hasAlt && (!img.alt || img.alt.trim() === ''));
    if (noAltImages.length > 0) {
      const examples = noAltImages.slice(0, 5).map(img => truncate(img.src, 60));
      findings.push({ module: 'web_qc', area: 'Accessibility', severity: noAltImages.length >= 5 ? 'major' : 'minor', finding: `${noAltImages.length} image(s) missing alt attribute (out of ${images.length} total). Screen readers cannot describe these to visually impaired users.`, evidence: { total_images: images.length, missing_alt_count: noAltImages.length, example_sources: examples }, recommendation: `Add descriptive alt text to each <img> tag. For decorative images, use alt="" (empty but present). Missing on: ${examples.join(', ')}`, score_impact: noAltImages.length >= 5 ? 4 : 2, business_impact: noAltImages.length >= 5 ? 'high' : 'medium' });
    } else if (images.length > 0) {
      findings.push({ module: 'web_qc', area: 'Accessibility', severity: 'info', finding: `All ${images.length} images have alt attributes.`, evidence: { total_images: images.length, missing_alt_count: 0, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Deprecated Tags ---
    const deprecated = countDeprecatedTags(html);
    if (deprecated.length > 0) {
      const totalCount = deprecated.reduce((sum, d) => sum + d.count, 0);
      findings.push({ module: 'web_qc', area: 'Standards', severity: 'minor', finding: `Found ${totalCount} deprecated HTML tag(s): ${deprecated.map(d => `<${d.tag}> (${d.count}x)`).join(', ')}. These are obsolete in HTML5.`, evidence: { deprecated_tags: deprecated }, recommendation: 'Replace deprecated tags with modern CSS equivalents. <font> → CSS font-family/color, <center> → CSS text-align/margin:auto, <marquee> → CSS animation.', score_impact: 1, business_impact: 'low' });
    }

    // --- Inline Styles ---
    const inlineCount = countInlineStyles(html);
    if (inlineCount > 20) {
      findings.push({ module: 'web_qc', area: 'Maintainability', severity: 'minor', finding: `Found ${inlineCount} inline style attributes. Excessive inline styles make the code harder to maintain and increase page size.`, evidence: { inline_style_count: inlineCount, threshold: 20 }, recommendation: 'Move inline styles to external CSS files or use CSS classes. This improves caching, reduces HTML size, and makes design changes easier.', score_impact: 1, business_impact: 'low' });
    }

    // --- Favicon ---
    if (!hasFavicon(html)) {
      findings.push({ module: 'web_qc', area: 'UX', severity: 'minor', finding: 'No favicon link tag found. The browser tab will show a generic icon, and bookmarks will lack visual identity.', evidence: { element: 'link[rel="icon"]', status: 'missing' }, recommendation: 'Add a favicon: <link rel="icon" href="/favicon.ico"> or <link rel="icon" type="image/svg+xml" href="/favicon.svg"> in <head>.', score_impact: 1, business_impact: 'low' });
    }

    // --- Empty Links ---
    const links = extractAllLinks(html, finalUrl);
    const emptyLinks = links.filter(l => !l.text && l.href);
    if (emptyLinks.length > 0) {
      findings.push({ module: 'web_qc', area: 'Accessibility', severity: 'minor', finding: `Found ${emptyLinks.length} link(s) with no visible text. Screen readers cannot convey the purpose of these links.`, evidence: { empty_link_count: emptyLinks.length, example_hrefs: emptyLinks.slice(0, 5).map(l => truncate(l.href, 60)) }, recommendation: 'Add descriptive text inside each <a> tag, or use aria-label for icon-only links: <a href="..." aria-label="Go to homepage">...</a>', score_impact: 1, business_impact: 'low' });
    }

    // --- Mixed Content (HTTP resources on HTTPS page) ---
    if (finalUrl.startsWith('https://')) {
      const httpResources = [];
      const resourceRegex = /(?:src|href)=["'](http:\/\/[^"']+)["']/gi;
      let m;
      while ((m = resourceRegex.exec(html))) {
        httpResources.push(m[1]);
      }
      if (httpResources.length > 0) {
        findings.push({ module: 'web_qc', area: 'Security', severity: 'major', finding: `Mixed content detected: ${httpResources.length} resource(s) loaded over HTTP on an HTTPS page. Browsers may block these.`, evidence: { http_resource_count: httpResources.length, examples: httpResources.slice(0, 5).map(u => truncate(u, 80)) }, recommendation: 'Update all resource URLs to use https:// or protocol-relative URLs (//). Mixed content causes security warnings and may be blocked by browsers.', score_impact: 4, business_impact: 'high' });
      }
    }

    return findings;
  }

  // ==================================================================
  // Other Module Runners (unchanged stubs for non-web checks)
  // ==================================================================

  function checkBrandGuardian(subjectRef, kbContext) {
    const bp = kbContext.brand_profile || {};
    if (!bp.brand_tone && !bp.brand_values) {
      return [{ module: 'brand_guardian', area: 'Brand', severity: 'info', finding: 'No brand profile configured for this client. Brand checks were skipped.', recommendation: 'Set up a brand profile with tone, values, and do/don\'t lists to enable brand compliance checking.', priority: 'P3', score_impact: 0, business_impact: 'low' }];
    }
    return [];
  }

  // ==================================================================
  // Module Dispatcher
  // ==================================================================

  function runModule(moduleId, pageData, kbContext) {
    switch (moduleId) {
      case 'seo_aiseo': return checkSeoAiseo(pageData);
      case 'website_health': return checkWebsiteHealth(pageData);
      case 'web_qc': return checkWebQc(pageData);
      case 'brand_guardian': return checkBrandGuardian(pageData.url, kbContext);
      case 'social_best_practice':
        return [{ module: 'social_best_practice', area: 'Social', severity: 'info', finding: 'Social best practice check requires a social post URL or content. Not applicable for web pages.', recommendation: 'Use this module when checking social media posts.', priority: 'P2', score_impact: 0, business_impact: 'none' }];
      case 'design_accuracy':
        return [{ module: 'design_accuracy', area: 'Design', severity: 'info', finding: 'Design accuracy check requires visual analysis. Not applicable for web page URL checks.', recommendation: 'Use this module when checking design deliverables (images, mockups).', priority: 'P2', score_impact: 0, business_impact: 'none' }];
      case 'content_review':
        return [{ module: 'content_review', area: 'Brand', severity: 'info', finding: 'Content review requires AI analysis integration. Basic content checks are included in the SEO module.', recommendation: 'AI-powered tone and message alignment analysis will be available in a future update.', priority: 'P2', score_impact: 0, business_impact: 'none' }];
      default: return [];
    }
  }

  // ==================================================================
  // GET /debug/modules
  // ==================================================================
  router.get('/debug/modules', (req, res) => {
    res.json(MODULE_DEFS);
  });

  // ==================================================================
  // GET /debug/sessions
  // ==================================================================
  router.get('/debug/sessions', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let items = Array.from(sessions.values())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (req.query.client_id) items = items.filter(s => s.client_id === req.query.client_id);
    if (req.query.project_id) items = items.filter(s => s.project_id === req.query.project_id);
    if (req.query.status) items = items.filter(s => s.status === req.query.status);

    const total = items.length;
    items = items.slice(offset, offset + limit);

    res.json({ items, total, page, limit });
  });

  // ==================================================================
  // GET /debug/sessions/:id
  // ==================================================================
  router.get('/debug/sessions/:id', (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) return res.status(404).json({ detail: 'Session not found' });
    const sessionIssues = Array.from(issues.values())
      .filter(i => i.debug_session_id === session.id);
    res.json({ ...session, issues: sessionIssues });
  });

  // ==================================================================
  // Shared: execute modules on a session (ASYNC — fetches URL)
  // ==================================================================
  async function executeSession(session) {
    // Fetch the page once, share data across all modules
    const pageData = await fetchPage(session.subject_ref || '');

    const kbContext = { brand_profile: {}, rules: [], patterns: [] };
    const allIssues = [];
    const updatedModules = [];

    for (const moduleEntry of (session.modules_invoked || [])) {
      const moduleId = moduleEntry.module;
      const start = Date.now();
      try {
        const moduleIssues = runModule(moduleId, pageData, kbContext);
        const elapsed = Date.now() - start;
        updatedModules.push({ module: moduleId, status: 'success', execution_time_ms: elapsed, issues_found: moduleIssues.length });
        allIssues.push(...moduleIssues);
      } catch (e) {
        const elapsed = Date.now() - start;
        updatedModules.push({ module: moduleId, status: 'failed', execution_time_ms: elapsed, error_message: e.message });
      }
    }

    // Create issue records
    const sessionIssues = allIssues.map(issueData => ({
      id: uuidv4(),
      debug_session_id: session.id,
      client_id: session.client_id,
      project_id: session.project_id,
      module: issueData.module,
      area: issueData.area,
      severity: issueData.severity,
      finding: issueData.finding,
      evidence: issueData.evidence || null,
      recommendation: issueData.recommendation || null,
      priority: issueData.priority || (issueData.score_impact >= 10 ? 'P0' : issueData.score_impact >= 5 ? 'P1' : 'P2'),
      related_rule_ids: issueData.related_rule_ids || null,
      related_pattern_ids: issueData.related_pattern_ids || null,
      score_impact: issueData.score_impact || 0,
      business_impact: issueData.business_impact || 'none',
      user_impact: issueData.user_impact || null,
      resolution_status: 'open',
      assigned_to: null,
      resolved_at: null,
      resolution_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    for (const issue of sessionIssues) {
      issues.set(issue.id, issue);
    }

    // Calculate score
    let score = 100;
    for (const issue of allIssues) {
      score -= (issue.score_impact || 0);
    }
    score = Math.max(0, Math.min(100, score));

    const hasCritical = allIssues.some(i => i.severity === 'critical');
    let overallStatus;
    if (score >= 80 && !hasCritical) overallStatus = 'pass';
    else if (score >= 60 && !hasCritical) overallStatus = 'warning';
    else overallStatus = 'fail';

    // Build summary
    const sevCounts = {};
    for (const i of allIssues) {
      sevCounts[i.severity] = (sevCounts[i.severity] || 0) + 1;
    }
    const actionableCount = allIssues.filter(i => i.severity !== 'info').length;
    const parts = [`Score: ${score}/100 (${overallStatus.toUpperCase()}).`];
    parts.push(`${allIssues.length} findings — ${actionableCount} actionable.`);
    for (const sev of ['critical', 'major', 'minor', 'info']) {
      if (sevCounts[sev]) parts.push(`${sevCounts[sev]} ${sev}`);
    }

    // Update session
    session.modules_invoked = updatedModules;
    session.overall_score = score;
    session.overall_status = overallStatus;
    session.overall_summary = parts.join(' ');
    session.kb_entries_used = [];
    session.updated_at = new Date().toISOString();
    session.issue_count = allIssues.length;
    session.critical_count = sevCounts.critical || 0;
    session.major_count = sevCounts.major || 0;

    return sessionIssues;
  }

  // ==================================================================
  // POST /debug/sessions  (create, optionally auto-run)
  // ==================================================================
  router.post('/debug/sessions', async (req, res) => {
    try {
      const { project_id, client_id, subject_type, subject_ref, module_ids, trace_enabled, auto_run } = req.body;

      if (!subject_type || !module_ids || !Array.isArray(module_ids) || module_ids.length === 0) {
        return res.status(422).json({ detail: 'subject_type and module_ids (non-empty array) are required' });
      }

      const now = new Date().toISOString();
      const session = {
        id: uuidv4(),
        project_id: project_id || null,
        client_id: client_id || null,
        subject_type,
        subject_ref: subject_ref || null,
        modules_invoked: module_ids.map(m => ({ module: m, status: 'pending', execution_time_ms: 0 })),
        overall_score: null,
        overall_status: null,
        overall_summary: null,
        kb_entries_used: [],
        status: 'open',
        status_notes: null,
        initiated_by: null,
        trace_enabled: trace_enabled || false,
        created_at: now,
        updated_at: now,
        issue_count: 0,
        critical_count: 0,
        major_count: 0,
      };
      sessions.set(session.id, session);

      // Auto-run modules immediately if requested
      if (auto_run) {
        const sessionIssues = await executeSession(session);
        return res.status(201).json({ ...session, issues: sessionIssues });
      }

      res.status(201).json(session);
    } catch (err) {
      console.error('Error creating debug session:', err);
      res.status(500).json({ detail: 'Internal server error while running analysis' });
    }
  });

  // ==================================================================
  // POST /debug/sessions/:id/run  (execute modules)
  // ==================================================================
  router.post('/debug/sessions/:id/run', async (req, res) => {
    try {
      const session = sessions.get(req.params.id);
      if (!session) return res.status(404).json({ detail: 'Session not found' });
      if (session.overall_score !== null) {
        return res.status(409).json({ detail: 'Debug session has already been executed' });
      }

      const sessionIssues = await executeSession(session);
      res.json({ ...session, issues: sessionIssues });
    } catch (err) {
      console.error('Error running debug session:', err);
      res.status(500).json({ detail: 'Internal server error while running analysis' });
    }
  });

  // ==================================================================
  // PATCH /debug/sessions/:id
  // ==================================================================
  router.patch('/debug/sessions/:id', (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) return res.status(404).json({ detail: 'Session not found' });

    if (req.body.status) session.status = req.body.status;
    if (req.body.status_notes !== undefined) session.status_notes = req.body.status_notes;
    session.updated_at = new Date().toISOString();

    res.json(session);
  });

  // ==================================================================
  // GET /debug/issues
  // ==================================================================
  router.get('/debug/issues', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let items = Array.from(issues.values());
    if (req.query.client_id) items = items.filter(i => i.client_id === req.query.client_id);
    if (req.query.session_id) items = items.filter(i => i.debug_session_id === req.query.session_id);
    if (req.query.severity) items = items.filter(i => i.severity === req.query.severity);
    if (req.query.resolution) items = items.filter(i => i.resolution_status === req.query.resolution);

    const total = items.length;
    items = items.slice(offset, offset + limit);

    res.json({ items, total, page, limit });
  });

  // ==================================================================
  // PATCH /debug/issues/:id
  // ==================================================================
  router.patch('/debug/issues/:id', (req, res) => {
    const issue = issues.get(req.params.id);
    if (!issue) return res.status(404).json({ detail: 'Issue not found' });

    if (req.body.resolution_status) issue.resolution_status = req.body.resolution_status;
    if (req.body.assigned_to !== undefined) issue.assigned_to = req.body.assigned_to;
    if (req.body.priority) issue.priority = req.body.priority;
    if (req.body.resolution_notes !== undefined) issue.resolution_notes = req.body.resolution_notes;
    issue.updated_at = new Date().toISOString();

    res.json(issue);
  });

  // ==================================================================
  // GET /debug/stats
  // ==================================================================
  router.get('/debug/stats', (req, res) => {
    let sessionList = Array.from(sessions.values());
    if (req.query.client_id) sessionList = sessionList.filter(s => s.client_id === req.query.client_id);

    const completedSessions = sessionList.filter(s => s.overall_score !== null);
    const issueList = Array.from(issues.values());

    const stats = {
      total_sessions: sessionList.length,
      pass_count: completedSessions.filter(s => s.overall_status === 'pass').length,
      warning_count: completedSessions.filter(s => s.overall_status === 'warning').length,
      fail_count: completedSessions.filter(s => s.overall_status === 'fail').length,
      total_issues: issueList.length,
      open_issues: issueList.filter(i => i.resolution_status === 'open').length,
      critical_open: issueList.filter(i => i.severity === 'critical' && i.resolution_status === 'open').length,
      avg_score: completedSessions.length > 0
        ? Math.round(completedSessions.reduce((sum, s) => sum + s.overall_score, 0) / completedSessions.length)
        : null,
    };

    res.json(stats);
  });

  return router;
};
