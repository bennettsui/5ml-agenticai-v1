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
  // 7-Layer Health Check Architecture:
  //  L1: Infrastructure & Server  → website_health (area: "Health")
  //  L2: Security & Privacy       → security_scan
  //  L3: Performance & Speed      → website_health (area: "Performance"/"Mobile")
  //  L4: SEO Foundation           → seo_aiseo (area: "SEO")
  //  L5: AI & Content Intelligence→ seo_aiseo (area: "AI SEO")
  //  L6: Accessibility (WCAG)     → wcag_accessibility
  //  L7: Quality & Standards      → web_qc

  const MODULE_DEFS = [
    { id: 'website_health', name: 'Infrastructure & Performance', description: 'Server health, response time, HTTPS, compression, Core Web Vitals, mobile-friendliness', applicable_subject_types: ['web_page'], version: '2.0', status: 'active', layer: 'L1/L3', cost_weight: 1 },
    { id: 'security_scan', name: 'Security & Privacy', description: 'Data leakage detection, XSS vectors, header security, cookie safety, API key exposure, code injection risks', applicable_subject_types: ['web_page'], version: '1.0', status: 'active', layer: 'L2', cost_weight: 1 },
    { id: 'seo_aiseo', name: 'SEO & AI Content Intelligence', description: 'Meta tags, structured data, internal linking, E-E-A-T signals, content quality, AI readability, keyword analysis', applicable_subject_types: ['web_page'], version: '2.0', status: 'active', layer: 'L4/L5', cost_weight: 1 },
    { id: 'wcag_accessibility', name: 'Accessibility (WCAG 2.2)', description: 'ARIA landmarks, form labels, image alt text, skip navigation, focus management, keyboard accessibility', applicable_subject_types: ['web_page'], version: '1.0', status: 'active', layer: 'L6', cost_weight: 1 },
    { id: 'web_qc', name: 'Quality & Standards', description: 'HTML standards compliance, deprecated tags, mixed content, favicon, inline styles, code quality', applicable_subject_types: ['web_page'], version: '2.0', status: 'active', layer: 'L7', cost_weight: 1 },
    { id: 'brand_guardian', name: 'Brand Guardian', description: 'Checks deliverables against brand profile, tone, do/don\'t lists', applicable_subject_types: ['web_page','design','video','social_post','document'], version: '1.0', status: 'active', layer: 'N/A', cost_weight: 2 },
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

    // =====================================================
    // AI SEO & Content Intelligence Checks (Layer 5)
    // =====================================================

    // --- Word Count & Reading Level ---
    const words = bodyText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const readingTime = Math.ceil(wordCount / 200);
    if (wordCount > 50 && wordCount < 300) {
      findings.push({ module: 'seo_aiseo', area: 'AI SEO', severity: 'minor', finding: `Thin content: only ${wordCount} words (~${readingTime} min read). Google and AI models prefer in-depth content (1000+ words for informational pages).`, evidence: { word_count: wordCount, reading_time_min: readingTime, threshold: '300-1000+ recommended' }, recommendation: 'Expand content with more comprehensive coverage of the topic. Add sections, examples, data, and expert insights. Aim for 1000+ words for informational pages.', score_impact: 3, business_impact: 'medium' });
    } else if (wordCount >= 300) {
      findings.push({ module: 'seo_aiseo', area: 'AI SEO', severity: 'info', finding: `Content length: ${wordCount} words (~${readingTime} min read).`, evidence: { word_count: wordCount, reading_time_min: readingTime, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Content-to-HTML Ratio ---
    const contentRatio = html.length > 0 ? (bodyText.length / html.length * 100) : 0;
    if (contentRatio > 0 && contentRatio < 10) {
      findings.push({ module: 'seo_aiseo', area: 'AI SEO', severity: 'minor', finding: `Low content-to-code ratio: ${contentRatio.toFixed(1)}%. The page is mostly code/markup with little visible text — AI crawlers value content-rich pages.`, evidence: { content_ratio_pct: contentRatio.toFixed(1), text_length: bodyText.length, html_length: html.length }, recommendation: 'Increase visible text content. Reduce unnecessary JavaScript/CSS in the HTML. Move scripts to external files.', score_impact: 2, business_impact: 'medium' });
    }

    // --- E-E-A-T Signals (Experience, Expertise, Authoritativeness, Trustworthiness) ---
    const eatSignals = {
      has_author: /<[^>]*class=["'][^"']*author[^"']*["']/i.test(html) || /rel=["']author["']/i.test(html) || extractMetaContent(html, 'author'),
      has_date: /<time[\s>]/i.test(html) || extractMetaContent(html, 'article:published_time') || extractMetaContent(html, 'date'),
      has_about_link: /href=["'][^"']*\/about/i.test(html),
      has_contact_link: /href=["'][^"']*\/contact/i.test(html),
      has_privacy_link: /href=["'][^"']*\/privacy/i.test(html),
      has_terms_link: /href=["'][^"']*\/terms/i.test(html),
    };
    const eatMissing = [];
    if (!eatSignals.has_author) eatMissing.push('Author attribution');
    if (!eatSignals.has_date) eatMissing.push('Publication date');
    if (!eatSignals.has_about_link) eatMissing.push('About page link');
    if (!eatSignals.has_contact_link) eatMissing.push('Contact page link');
    if (!eatSignals.has_privacy_link) eatMissing.push('Privacy policy link');

    if (eatMissing.length >= 3) {
      findings.push({ module: 'seo_aiseo', area: 'AI SEO', severity: 'minor', finding: `Missing ${eatMissing.length} E-E-A-T signals: ${eatMissing.join(', ')}. Google and AI systems use these to assess content trustworthiness.`, evidence: { missing: eatMissing, signals: eatSignals }, recommendation: 'Add author bios, publication dates, About/Contact page links, and privacy policy links. These build trust signals for both users and AI crawlers.', score_impact: 3, business_impact: 'medium' });
    } else if (eatMissing.length > 0) {
      findings.push({ module: 'seo_aiseo', area: 'AI SEO', severity: 'info', finding: `E-E-A-T partially covered. Missing: ${eatMissing.join(', ')}.`, evidence: { missing: eatMissing, signals: eatSignals }, recommendation: `Consider adding: ${eatMissing.join(', ')} to strengthen trust signals.`, score_impact: 0, business_impact: 'low' });
    } else {
      findings.push({ module: 'seo_aiseo', area: 'AI SEO', severity: 'info', finding: 'Strong E-E-A-T signals: author, date, about, contact, and privacy links all present.', evidence: { signals: eatSignals, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Twitter Card Meta ---
    const twCard = extractMetaContent(html, 'twitter:card');
    const twTitle = extractMetaContent(html, 'twitter:title');
    const twDesc = extractMetaContent(html, 'twitter:description');
    const twMissing = [];
    if (!twCard) twMissing.push('twitter:card');
    if (!twTitle) twMissing.push('twitter:title');
    if (!twDesc) twMissing.push('twitter:description');
    if (twMissing.length > 0) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: twMissing.length >= 2 ? 'minor' : 'info', finding: `Missing Twitter Card tags: ${twMissing.join(', ')}. Shares on X/Twitter will show generic previews.`, evidence: { missing: twMissing, twitter_card: twCard, twitter_title: twTitle ? truncate(twTitle, 60) : null }, recommendation: `Add Twitter Card meta tags: ${twMissing.map(t => `<meta name="${t}" content="...">`).join(', ')}`, score_impact: twMissing.length >= 2 ? 1 : 0, business_impact: 'low' });
    }

    // --- URL SEO Analysis ---
    try {
      const urlObj = new URL(finalUrl);
      const urlPath = urlObj.pathname;
      const urlIssues = [];
      if (urlPath.length > 75) urlIssues.push(`URL path too long (${urlPath.length} chars)`);
      if (/[A-Z]/.test(urlPath)) urlIssues.push('URL contains uppercase letters');
      if (/_/.test(urlPath)) urlIssues.push('URL uses underscores (prefer hyphens)');
      if (/\?.*=/.test(urlObj.search) && urlObj.search.length > 50) urlIssues.push('Long query string may cause duplicate content');
      if (urlIssues.length > 0) {
        findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'minor', finding: `URL structure issues: ${urlIssues.join('; ')}. Clean, short URLs rank better and are more shareable.`, evidence: { url: finalUrl, path_length: urlPath.length, issues: urlIssues }, recommendation: 'Use short, lowercase, hyphen-separated URLs with keywords. Avoid query parameters for main content pages.', score_impact: 1, business_impact: 'low' });
      }
    } catch {}

    // --- Image SEO ---
    const allImgs = extractAllImages(html);
    const noLazyImages = allImgs.filter(img => {
      const srcStr = img.src || '';
      return srcStr && !/loading=["']lazy["']/i.test(html.slice(Math.max(0, html.indexOf(srcStr) - 100), html.indexOf(srcStr) + 10));
    });
    const hasSrcset = /<img[^>]*srcset=/i.test(html);
    const imgIssues = [];
    if (allImgs.length > 5 && !hasSrcset) imgIssues.push(`No responsive srcset found (${allImgs.length} images)`);
    if (allImgs.length > 3 && noLazyImages.length > allImgs.length * 0.8) imgIssues.push('Most images lack lazy loading');
    if (imgIssues.length > 0) {
      findings.push({ module: 'seo_aiseo', area: 'AI SEO', severity: 'minor', finding: `Image optimization issues: ${imgIssues.join('; ')}. This hurts both page speed and image search rankings.`, evidence: { total_images: allImgs.length, issues: imgIssues, has_srcset: hasSrcset }, recommendation: 'Add loading="lazy" to below-fold images. Use srcset for responsive images. Use WebP/AVIF formats with descriptive file names.', score_impact: 2, business_impact: 'medium' });
    }

    // --- Hreflang (International SEO) ---
    const hreflangRegex = /<link[^>]*hreflang=["']([^"']*)["']/gi;
    const hreflangs = [];
    let hlm;
    while ((hlm = hreflangRegex.exec(html))) hreflangs.push(hlm[1]);
    if (hreflangs.length > 0) {
      findings.push({ module: 'seo_aiseo', area: 'SEO', severity: 'info', finding: `Hreflang tags found for ${hreflangs.length} language(s): ${hreflangs.join(', ')}. International targeting is configured.`, evidence: { languages: hreflangs, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Schema Completeness Check ---
    if (schemas.length > 0) {
      const schemaIssues = [];
      for (const schema of schemas) {
        const type = schema['@type'];
        if (type === 'Organization' && !schema.logo) schemaIssues.push('Organization schema missing "logo"');
        if (type === 'Article' && !schema.datePublished) schemaIssues.push('Article schema missing "datePublished"');
        if (type === 'Article' && !schema.author) schemaIssues.push('Article schema missing "author"');
        if (type === 'Product' && !schema.offers) schemaIssues.push('Product schema missing "offers"');
        if (type === 'LocalBusiness' && !schema.address) schemaIssues.push('LocalBusiness missing "address"');
      }
      if (schemaIssues.length > 0) {
        findings.push({ module: 'seo_aiseo', area: 'AI SEO', severity: 'minor', finding: `JSON-LD schema incomplete: ${schemaIssues.join('; ')}. Incomplete schemas may not qualify for rich snippets.`, evidence: { issues: schemaIssues, schema_count: schemas.length }, recommendation: 'Complete all required fields in your JSON-LD schemas. Use Google Rich Results Test to validate.', score_impact: 2, business_impact: 'medium' });
      }
    }

    // --- AI Content Readability ---
    if (wordCount >= 100) {
      const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const avgWordsPerSentence = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
      const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 30).length;
      if (avgWordsPerSentence > 25) {
        findings.push({ module: 'seo_aiseo', area: 'AI SEO', severity: 'minor', finding: `Average sentence length is ${avgWordsPerSentence} words. Long sentences reduce readability for both humans and AI parsers.`, evidence: { avg_words_per_sentence: avgWordsPerSentence, total_sentences: sentences.length, long_sentences: longSentences }, recommendation: 'Break long sentences into shorter ones (15-20 words average). Use bullet points and short paragraphs. This improves AI comprehension and featured snippet chances.', score_impact: 1, business_impact: 'medium' });
      }
    }

    // --- Content Freshness Signals ---
    const datePublished = extractMetaContent(html, 'article:published_time') || extractMetaContent(html, 'datePublished');
    const dateModified = extractMetaContent(html, 'article:modified_time') || extractMetaContent(html, 'dateModified');
    if (datePublished && !dateModified) {
      findings.push({ module: 'seo_aiseo', area: 'AI SEO', severity: 'info', finding: `Content has publication date (${truncate(datePublished, 25)}) but no last-modified date. AI systems favor recently updated content.`, evidence: { published: datePublished, modified: null }, recommendation: 'Add article:modified_time meta tag. Regularly update content and reflect the new date.', score_impact: 0, business_impact: 'low' });
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
  // WCAG Accessibility Module (Layer 6)
  // ==================================================================

  function checkWcagAccessibility(pageData) {
    const findings = [];
    const { html, finalUrl, error: fetchError } = pageData;

    if (fetchError) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'critical', finding: `Could not fetch page for accessibility audit: ${fetchError}`, evidence: { url: pageData.url, error: fetchError }, recommendation: 'Ensure the URL is accessible.', score_impact: 15, business_impact: 'high' });
      return findings;
    }

    // --- Lang Attribute (WCAG 3.1.1 Level A) ---
    const lang = getHtmlLang(html);
    if (!lang) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'major', finding: 'Missing lang attribute on <html> tag (WCAG 3.1.1 Level A). Screen readers cannot determine the page language for correct pronunciation.', evidence: { wcag: '3.1.1', level: 'A', element: '<html>', attribute: 'lang', status: 'missing' }, recommendation: 'Add lang="en" (or appropriate language code) to the <html> tag: <html lang="en">', score_impact: 4, business_impact: 'high' });
    } else {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'info', finding: `Page language declared: "${lang}" (WCAG 3.1.1)`, evidence: { wcag: '3.1.1', value: lang, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Skip Navigation Link (WCAG 2.4.1 Level A) ---
    const hasSkipLink = /<a[^>]*href=["']#(main|content|skip|maincontent)[^"']*["'][^>]*>/i.test(html) ||
      /<a[^>]*class=["'][^"']*skip[^"']*["'][^>]*>/i.test(html);
    if (!hasSkipLink) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'minor', finding: 'No skip navigation link detected (WCAG 2.4.1 Level A). Keyboard users must tab through all navigation on every page load.', evidence: { wcag: '2.4.1', level: 'A', element: 'skip link', status: 'not found' }, recommendation: 'Add a skip link as the first focusable element: <a href="#main" class="sr-only focus:not-sr-only">Skip to main content</a>', score_impact: 2, business_impact: 'medium' });
    }

    // --- ARIA Landmarks (WCAG 1.3.1 Level A) ---
    const hasMainRole = /role=["']main["']/i.test(html) || /<main[\s>]/i.test(html);
    const hasNavRole = /role=["']navigation["']/i.test(html) || /<nav[\s>]/i.test(html);
    const hasBannerRole = /role=["']banner["']/i.test(html) || /<header[\s>]/i.test(html);
    const hasContentInfo = /role=["']contentinfo["']/i.test(html) || /<footer[\s>]/i.test(html);
    const missingLandmarks = [];
    if (!hasMainRole) missingLandmarks.push('main');
    if (!hasNavRole) missingLandmarks.push('navigation');
    if (!hasBannerRole) missingLandmarks.push('banner/header');
    if (!hasContentInfo) missingLandmarks.push('contentinfo/footer');
    if (missingLandmarks.length > 0) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: missingLandmarks.includes('main') ? 'major' : 'minor', finding: `Missing ${missingLandmarks.length} ARIA landmark(s): ${missingLandmarks.join(', ')} (WCAG 1.3.1 Level A).`, evidence: { wcag: '1.3.1', level: 'A', missing: missingLandmarks, present: { main: hasMainRole, navigation: hasNavRole, banner: hasBannerRole, contentinfo: hasContentInfo } }, recommendation: 'Add semantic HTML5 elements (<main>, <nav>, <header>, <footer>) or ARIA role attributes to define page regions.', score_impact: missingLandmarks.includes('main') ? 3 : 1, business_impact: 'medium' });
    } else {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'info', finding: 'All major ARIA landmarks present (main, navigation, banner, contentinfo).', evidence: { wcag: '1.3.1', status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Form Labels (WCAG 1.3.1 / 4.1.2 Level A) ---
    const inputRegex = /<input\s([^>]*?)>/gi;
    let inputMatch;
    let unlabeledInputs = 0;
    let totalInputs = 0;
    while ((inputMatch = inputRegex.exec(html))) {
      const attrs = inputMatch[1];
      const type = (attrs.match(/type=["']([^"']*)["']/i) || [])[1] || 'text';
      if (['hidden', 'submit', 'button', 'image', 'reset'].includes(type)) continue;
      totalInputs++;
      const hasAriaLabel = /aria-label=["']/i.test(attrs) || /aria-labelledby=["']/i.test(attrs) || /title=["']/i.test(attrs);
      const id = (attrs.match(/id=["']([^"']*)["']/i) || [])[1];
      const hasForLabel = id ? new RegExp(`<label[^>]*for=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(html) : false;
      if (!hasAriaLabel && !hasForLabel) unlabeledInputs++;
    }
    if (unlabeledInputs > 0) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: unlabeledInputs >= 3 ? 'major' : 'minor', finding: `${unlabeledInputs} of ${totalInputs} form input(s) have no accessible label (WCAG 1.3.1, 4.1.2 Level A). Screen readers cannot identify these fields.`, evidence: { wcag: '1.3.1 / 4.1.2', level: 'A', unlabeled: unlabeledInputs, total: totalInputs }, recommendation: 'Add <label for="fieldId"> elements or aria-label attributes to all form inputs. Placeholder text is NOT a substitute for labels.', score_impact: unlabeledInputs >= 3 ? 4 : 2, business_impact: 'high' });
    } else if (totalInputs > 0) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'info', finding: `All ${totalInputs} form inputs have accessible labels.`, evidence: { total: totalInputs, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Image Alt Text (WCAG 1.1.1 Level A) ---
    const images = extractAllImages(html);
    const noAltImages = images.filter(img => !img.hasAlt);
    if (noAltImages.length > 0) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: noAltImages.length >= 5 ? 'major' : 'minor', finding: `${noAltImages.length} of ${images.length} image(s) missing alt attribute (WCAG 1.1.1 Level A). Visually impaired users cannot understand these images.`, evidence: { wcag: '1.1.1', level: 'A', missing: noAltImages.length, total: images.length, examples: noAltImages.slice(0, 3).map(i => truncate(i.src, 60)) }, recommendation: 'Add descriptive alt text to all <img> tags. For decorative images, use alt="" (empty string).', score_impact: noAltImages.length >= 5 ? 4 : 2, business_impact: 'high' });
    } else if (images.length > 0) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'info', finding: `All ${images.length} images have alt attributes (WCAG 1.1.1).`, evidence: { total: images.length, status: 'good' }, recommendation: null, score_impact: 0, business_impact: 'none' });
    }

    // --- Button Accessibility (WCAG 4.1.2 Level A) ---
    const buttonRegex = /<button\s*([^>]*)>([\s\S]*?)<\/button>/gi;
    let btnMatch;
    let emptyButtons = 0;
    let totalButtons = 0;
    while ((btnMatch = buttonRegex.exec(html))) {
      totalButtons++;
      const attrs = btnMatch[1];
      const content = btnMatch[2].replace(/<[^>]+>/g, '').trim();
      const hasAriaLabel = /aria-label=["']/i.test(attrs) || /title=["']/i.test(attrs);
      if (!content && !hasAriaLabel) emptyButtons++;
    }
    if (emptyButtons > 0) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'minor', finding: `${emptyButtons} button(s) have no accessible name (WCAG 4.1.2 Level A). Screen readers will announce these as "button" with no context.`, evidence: { wcag: '4.1.2', level: 'A', empty: emptyButtons, total: totalButtons }, recommendation: 'Add visible text content or aria-label to all buttons. Icon-only buttons need aria-label="description".', score_impact: 2, business_impact: 'medium' });
    }

    // --- Heading Structure (WCAG 1.3.1) ---
    const headings = extractAllHeadings(html);
    const h1Count = headings.filter(h => h.level === 1).length;
    if (headings.length > 0 && h1Count === 0) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'minor', finding: 'No H1 heading found (WCAG 1.3.1). Headings provide document structure for screen reader navigation.', evidence: { wcag: '1.3.1', headings: headings.length, h1_count: 0, first: headings[0] ? `H${headings[0].level}: ${truncate(headings[0].text, 40)}` : 'none' }, recommendation: 'Add a single H1 heading that describes the page content. Maintain proper hierarchy (H1 → H2 → H3).', score_impact: 2, business_impact: 'medium' });
    }

    // --- Focus Visible (WCAG 2.4.7 Level AA) ---
    const hasOutlineNone = /outline:\s*none/i.test(html) || /outline:\s*0[^0-9]/i.test(html);
    if (hasOutlineNone) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'minor', finding: 'Detected "outline: none" or "outline: 0" in styles (WCAG 2.4.7 Level AA). This may remove keyboard focus indicators.', evidence: { wcag: '2.4.7', level: 'AA', pattern: 'outline: none/0' }, recommendation: 'Never remove outline without providing an alternative focus indicator. Use :focus-visible to style focus rings.', score_impact: 2, business_impact: 'medium' });
    }

    // --- Positive TabIndex Misuse (WCAG 2.4.3 Level A) ---
    const tabIndexRegex = /tabindex=["']([^"']*)["']/gi;
    let tabMatch;
    let positiveTabIndex = 0;
    while ((tabMatch = tabIndexRegex.exec(html))) {
      if (parseInt(tabMatch[1]) > 0) positiveTabIndex++;
    }
    if (positiveTabIndex > 0) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'minor', finding: `${positiveTabIndex} element(s) use positive tabindex values (WCAG 2.4.3 Level A). This creates unpredictable tab order.`, evidence: { wcag: '2.4.3', level: 'A', count: positiveTabIndex }, recommendation: 'Remove positive tabindex values. Use tabindex="0" to add to natural tab order, or tabindex="-1" for programmatic focus only.', score_impact: 1, business_impact: 'low' });
    }

    // --- Tables Without Headers (WCAG 1.3.1 Level A) ---
    const tableRegex = /<table[\s\S]*?<\/table>/gi;
    let tableMatch;
    let tablesWithoutHeaders = 0;
    let totalTables = 0;
    while ((tableMatch = tableRegex.exec(html))) {
      totalTables++;
      if (!/<th[\s>]/i.test(tableMatch[0]) && !/<caption[\s>]/i.test(tableMatch[0])) tablesWithoutHeaders++;
    }
    if (tablesWithoutHeaders > 0) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'minor', finding: `${tablesWithoutHeaders} of ${totalTables} table(s) lack header cells or captions (WCAG 1.3.1 Level A).`, evidence: { wcag: '1.3.1', level: 'A', without_headers: tablesWithoutHeaders, total: totalTables }, recommendation: 'Add <th> header cells and <caption> to all data tables. Use scope="col" or scope="row" on headers.', score_impact: 1, business_impact: 'medium' });
    }

    // --- Video Without Captions (WCAG 1.2.2 Level A) ---
    const videoCount = (html.match(/<video[\s>]/gi) || []).length;
    if (videoCount > 0) {
      const trackCount = (html.match(/<track[\s>]/gi) || []).length;
      if (trackCount === 0) {
        findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'major', finding: `${videoCount} video element(s) found without captions/subtitles track (WCAG 1.2.2 Level A).`, evidence: { wcag: '1.2.2', level: 'A', videos: videoCount, tracks: 0 }, recommendation: 'Add <track kind="captions"> or <track kind="subtitles"> elements to all video elements.', score_impact: 4, business_impact: 'high' });
      }
    }

    // --- Autoplay Media (WCAG 1.4.2 Level A) ---
    const autoplayCount = (html.match(/<(?:video|audio)[^>]*\bautoplay\b/gi) || []).length;
    if (autoplayCount > 0) {
      findings.push({ module: 'wcag_accessibility', area: 'Accessibility', severity: 'minor', finding: `${autoplayCount} media element(s) with autoplay detected (WCAG 1.4.2 Level A). Unexpected audio can be disorienting.`, evidence: { wcag: '1.4.2', level: 'A', count: autoplayCount }, recommendation: 'Remove autoplay or ensure media is muted by default. Provide visible play/pause controls.', score_impact: 2, business_impact: 'medium' });
    }

    return findings;
  }

  // ==================================================================
  // Security & Privacy Module (Layer 2)
  // ==================================================================

  function checkSecurity(pageData) {
    const findings = [];
    const { html, headers, finalUrl, url, error: fetchError } = pageData;

    if (fetchError) {
      findings.push({ module: 'security_scan', area: 'Security', severity: 'critical', finding: `Could not fetch page for security scan: ${fetchError}`, evidence: { url, error: fetchError }, recommendation: 'Ensure the URL is accessible.', score_impact: 10, business_impact: 'high' });
      return findings;
    }

    // --- Server Information Disclosure ---
    const serverHeader = headers['server'] || '';
    const poweredBy = headers['x-powered-by'] || '';
    if (serverHeader && /\d/.test(serverHeader)) {
      findings.push({ module: 'security_scan', area: 'Security', severity: 'minor', finding: `Server header reveals version info: "${serverHeader}". Attackers can look up known vulnerabilities for this version.`, evidence: { header: 'Server', value: serverHeader }, recommendation: 'Configure your server to return a generic Server header without version numbers. In nginx: server_tokens off;', score_impact: 1, business_impact: 'medium' });
    }
    if (poweredBy) {
      findings.push({ module: 'security_scan', area: 'Security', severity: 'minor', finding: `X-Powered-By header reveals technology: "${poweredBy}". This helps attackers identify your tech stack.`, evidence: { header: 'X-Powered-By', value: poweredBy }, recommendation: 'Remove the X-Powered-By header. In Express: app.disable("x-powered-by"). In PHP: expose_php = Off.', score_impact: 1, business_impact: 'medium' });
    }

    // --- Exposed Email Addresses ---
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, '');
    const emails = [...new Set((cleanHtml.match(emailRegex) || []).filter(e => !e.includes('example.com') && !e.includes('sentry') && !e.includes('wixpress')))];
    if (emails.length > 0) {
      findings.push({ module: 'security_scan', area: 'Privacy', severity: emails.length >= 3 ? 'minor' : 'info', finding: `${emails.length} email address(es) found in page HTML. These can be harvested by spam bots.`, evidence: { count: emails.length, emails: emails.slice(0, 5).map(e => truncate(e, 40)) }, recommendation: 'Use contact forms instead of exposing email addresses. If emails must be shown, obfuscate with JavaScript or use anti-scraping techniques.', score_impact: emails.length >= 3 ? 1 : 0, business_impact: 'medium' });
    }

    // --- HTML Comments With Sensitive Info ---
    const sensitiveComments = [];
    const commentRegex = /<!--([\s\S]*?)-->/g;
    let cm;
    while ((cm = commentRegex.exec(html))) {
      const content = cm[1].toLowerCase();
      const sensitivePatterns = ['password', 'secret', 'api_key', 'apikey', 'api-key', 'token', 'credentials', 'private', 'todo', 'fixme', 'hack', 'debug'];
      for (const pattern of sensitivePatterns) {
        if (content.includes(pattern)) {
          sensitiveComments.push({ snippet: truncate(cm[1].trim(), 80), keyword: pattern });
          break;
        }
      }
    }
    if (sensitiveComments.length > 0) {
      findings.push({ module: 'security_scan', area: 'Security', severity: 'minor', finding: `${sensitiveComments.length} HTML comment(s) contain potentially sensitive keywords (${[...new Set(sensitiveComments.map(c => c.keyword))].join(', ')}).`, evidence: { count: sensitiveComments.length, samples: sensitiveComments.slice(0, 3) }, recommendation: 'Remove HTML comments from production builds. Use a build process that strips comments (html-minifier, terser).', score_impact: 2, business_impact: 'medium' });
    }

    // --- Inline Event Handlers (XSS Vectors) ---
    const eventHandlers = ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'];
    const foundHandlers = {};
    for (const handler of eventHandlers) {
      const regex = new RegExp(`\\s${handler}\\s*=\\s*["']`, 'gi');
      const matches = html.match(regex);
      if (matches) foundHandlers[handler] = matches.length;
    }
    const handlerTotal = Object.values(foundHandlers).reduce((sum, c) => sum + c, 0);
    if (handlerTotal > 0) {
      findings.push({ module: 'security_scan', area: 'Security', severity: handlerTotal >= 10 ? 'minor' : 'info', finding: `${handlerTotal} inline event handler(s) found (${Object.entries(foundHandlers).map(([k, v]) => `${k}:${v}`).join(', ')}). Inline handlers can be XSS vectors and are blocked by strict CSP.`, evidence: { total: handlerTotal, handlers: foundHandlers }, recommendation: 'Move inline event handlers to external JavaScript. Use addEventListener(). This enables strict Content-Security-Policy without unsafe-inline.', score_impact: handlerTotal >= 10 ? 2 : 0, business_impact: 'medium' });
    }

    // --- Forms With Insecure Action ---
    const formRegex = /<form[^>]*action=["'](http:\/\/[^"']*)["']/gi;
    const insecureForms = [];
    let fm;
    while ((fm = formRegex.exec(html))) insecureForms.push(fm[1]);
    if (insecureForms.length > 0) {
      findings.push({ module: 'security_scan', area: 'Security', severity: 'major', finding: `${insecureForms.length} form(s) submit data over insecure HTTP. Credentials and personal data are transmitted in plain text.`, evidence: { count: insecureForms.length, urls: insecureForms.slice(0, 3).map(u => truncate(u, 60)) }, recommendation: 'Change all form action URLs to HTTPS. If no action is specified, ensure the page itself is served over HTTPS.', score_impact: 5, business_impact: 'high' });
    }

    // --- External Scripts Without SRI ---
    const scriptRegex = /<script[^>]*src=["'](https?:\/\/[^"']*)["'][^>]*>/gi;
    let scriptMatch;
    let externalScripts = 0;
    let scriptsWithoutSRI = 0;
    while ((scriptMatch = scriptRegex.exec(html))) {
      try {
        const scriptHost = new URL(scriptMatch[1]).hostname;
        const pageHost = new URL(finalUrl).hostname;
        if (scriptHost !== pageHost) {
          externalScripts++;
          if (!/integrity=["']/i.test(scriptMatch[0])) scriptsWithoutSRI++;
        }
      } catch {}
    }
    if (scriptsWithoutSRI > 0) {
      findings.push({ module: 'security_scan', area: 'Security', severity: scriptsWithoutSRI >= 3 ? 'minor' : 'info', finding: `${scriptsWithoutSRI} of ${externalScripts} external script(s) lack Subresource Integrity (SRI) hashes. A compromised CDN could inject malicious code.`, evidence: { external: externalScripts, without_sri: scriptsWithoutSRI }, recommendation: 'Add integrity and crossorigin attributes: <script src="..." integrity="sha384-..." crossorigin="anonymous">', score_impact: scriptsWithoutSRI >= 3 ? 2 : 0, business_impact: 'medium' });
    }

    // --- Cookie Security ---
    const setCookieHeaders = headers['set-cookie'];
    if (setCookieHeaders) {
      const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
      const insecureCookies = cookies.filter(c => {
        const lower = c.toLowerCase();
        return !lower.includes('secure') || !lower.includes('httponly');
      });
      if (insecureCookies.length > 0) {
        findings.push({ module: 'security_scan', area: 'Security', severity: 'minor', finding: `${insecureCookies.length} cookie(s) missing Secure and/or HttpOnly flags. Cookies without these flags are vulnerable to theft.`, evidence: { total: cookies.length, insecure: insecureCookies.length }, recommendation: 'Add Secure, HttpOnly, and SameSite=Strict flags to all cookies.', score_impact: 2, business_impact: 'high' });
      }
    }

    // --- Referrer Policy ---
    const referrerPolicy = headers['referrer-policy'] || extractMetaContent(html, 'referrer');
    if (!referrerPolicy) {
      findings.push({ module: 'security_scan', area: 'Privacy', severity: 'info', finding: 'No Referrer-Policy header or meta tag. Browser uses default referrer behavior, potentially leaking full URLs to third parties.', evidence: { header: 'Referrer-Policy', status: 'not set' }, recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin (or no-referrer for max privacy).', score_impact: 0, business_impact: 'low' });
    }

    // --- Permissions Policy ---
    const permissionsPolicy = headers['permissions-policy'] || headers['feature-policy'];
    if (!permissionsPolicy) {
      findings.push({ module: 'security_scan', area: 'Security', severity: 'info', finding: 'No Permissions-Policy header. The page does not restrict access to browser features (camera, microphone, geolocation).', evidence: { header: 'Permissions-Policy', status: 'not set' }, recommendation: 'Add Permissions-Policy header: geolocation=(), camera=(), microphone=()', score_impact: 0, business_impact: 'low' });
    }

    // --- Source Map Exposure ---
    const sourceMapRegex = /\/\/[#@]\s*sourceMappingURL\s*=\s*(\S+)/g;
    const sourceMaps = [];
    let smMatch;
    while ((smMatch = sourceMapRegex.exec(html))) sourceMaps.push(smMatch[1]);
    if (sourceMaps.length > 0) {
      findings.push({ module: 'security_scan', area: 'Security', severity: 'info', finding: `${sourceMaps.length} source map reference(s) found. Source maps expose your original source code to anyone.`, evidence: { count: sourceMaps.length, files: sourceMaps.slice(0, 3) }, recommendation: 'Remove source map references from production builds. Generate source maps only for development.', score_impact: 0, business_impact: 'low' });
    }

    // --- API Key Patterns ---
    const apiKeyPatterns = [
      { name: 'Google API Key', regex: /AIza[0-9A-Za-z_-]{35}/g },
      { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g },
      { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24,}/g },
      { name: 'GitHub Token', regex: /ghp_[0-9a-zA-Z]{36}/g },
    ];
    const foundKeys = [];
    for (const { name, regex } of apiKeyPatterns) {
      const matches = html.match(regex);
      if (matches) foundKeys.push({ type: name, count: matches.length, sample: truncate(matches[0], 20) + '***' });
    }
    if (foundKeys.length > 0) {
      findings.push({ module: 'security_scan', area: 'Security', severity: 'critical', finding: `Potential API key(s) found in page HTML: ${foundKeys.map(k => k.type).join(', ')}. These should NEVER be in client-side code.`, evidence: { keys: foundKeys }, recommendation: 'Remove API keys from client-side code immediately. Use server-side environment variables. Rotate any exposed keys.', score_impact: 10, business_impact: 'high' });
    }

    // --- CORS Wildcard ---
    const corsOrigin = headers['access-control-allow-origin'];
    if (corsOrigin === '*') {
      findings.push({ module: 'security_scan', area: 'Security', severity: 'minor', finding: 'CORS allows all origins (Access-Control-Allow-Origin: *). Any website can make requests to this page.', evidence: { header: 'Access-Control-Allow-Origin', value: '*' }, recommendation: 'Restrict CORS to specific trusted origins instead of using wildcard (*).', score_impact: 1, business_impact: 'medium' });
    }

    return findings;
  }

  // ==================================================================
  // Other Module Runners
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
      case 'wcag_accessibility': return checkWcagAccessibility(pageData);
      case 'security_scan': return checkSecurity(pageData);
      case 'brand_guardian': return checkBrandGuardian(pageData.url, kbContext);
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
  // Orchestrating Agent — Cost-Efficiency Coordinator
  // ==================================================================
  // The orchestrating agent optimizes which modules to run and in what
  // order, tracking estimated cost and prioritizing high-impact modules.
  // For HTML-parsing-only modules, cost is near-zero (CPU only).
  // For modules that would call external APIs (future), cost is tracked.

  const ORCHESTRATOR_CONFIG = {
    // Module execution order (highest impact first)
    priority_order: ['website_health', 'security_scan', 'seo_aiseo', 'wcag_accessibility', 'web_qc'],
    // Estimated cost per module (relative units: 1 = base HTML parse, 10 = API call)
    cost_estimates: {
      website_health: 1,
      security_scan: 1,
      seo_aiseo: 1,
      wcag_accessibility: 1,
      web_qc: 1,
      brand_guardian: 5, // Would involve AI analysis
    },
    // Maximum budget (relative units) per session
    max_budget: 20,
  };

  function orchestrateModules(requestedModules) {
    // Sort by priority order
    const sorted = [...requestedModules].sort((a, b) => {
      const aIdx = ORCHESTRATOR_CONFIG.priority_order.indexOf(a);
      const bIdx = ORCHESTRATOR_CONFIG.priority_order.indexOf(b);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });

    // Calculate total cost and trim if over budget
    let totalCost = 0;
    const approved = [];
    const skipped = [];
    for (const moduleId of sorted) {
      const cost = ORCHESTRATOR_CONFIG.cost_estimates[moduleId] || 1;
      if (totalCost + cost <= ORCHESTRATOR_CONFIG.max_budget) {
        approved.push({ module: moduleId, estimated_cost: cost });
        totalCost += cost;
      } else {
        skipped.push({ module: moduleId, reason: 'budget_exceeded', estimated_cost: cost });
      }
    }

    return { approved, skipped, total_estimated_cost: totalCost, budget: ORCHESTRATOR_CONFIG.max_budget };
  }

  // ==================================================================
  // Shared: execute modules on a session (ASYNC — fetches URL)
  // ==================================================================
  async function executeSession(session) {
    // Orchestrating agent decides module order and budget
    const requestedModuleIds = (session.modules_invoked || []).map(m => m.module);
    const orchestration = orchestrateModules(requestedModuleIds);

    // Fetch the page once, share data across all modules
    const fetchStart = Date.now();
    const pageData = await fetchPage(session.subject_ref || '');
    const fetchTimeMs = Date.now() - fetchStart;

    const kbContext = { brand_profile: {}, rules: [], patterns: [] };
    const allIssues = [];
    const updatedModules = [];

    // Execute in orchestrated order
    for (const { module: moduleId, estimated_cost } of orchestration.approved) {
      const start = Date.now();
      try {
        const moduleIssues = runModule(moduleId, pageData, kbContext);
        const elapsed = Date.now() - start;
        updatedModules.push({ module: moduleId, status: 'success', execution_time_ms: elapsed, issues_found: moduleIssues.length, estimated_cost });
        allIssues.push(...moduleIssues);
      } catch (e) {
        const elapsed = Date.now() - start;
        updatedModules.push({ module: moduleId, status: 'failed', execution_time_ms: elapsed, error_message: e.message, estimated_cost });
      }
    }

    // Add skipped modules to the report
    for (const { module: moduleId, reason } of orchestration.skipped) {
      updatedModules.push({ module: moduleId, status: 'skipped', execution_time_ms: 0, reason });
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
    const layerScores = {};
    for (const i of allIssues) {
      sevCounts[i.severity] = (sevCounts[i.severity] || 0) + 1;
      // Track per-layer (area) scores
      if (!layerScores[i.area]) layerScores[i.area] = { total_impact: 0, count: 0 };
      layerScores[i.area].total_impact += (i.score_impact || 0);
      layerScores[i.area].count += 1;
    }
    const actionableCount = allIssues.filter(i => i.severity !== 'info').length;
    const parts = [`Score: ${score}/100 (${overallStatus.toUpperCase()}).`];
    parts.push(`${allIssues.length} findings — ${actionableCount} actionable.`);
    for (const sev of ['critical', 'major', 'minor', 'info']) {
      if (sevCounts[sev]) parts.push(`${sevCounts[sev]} ${sev}`);
    }

    // Update session with orchestration metadata
    session.modules_invoked = updatedModules;
    session.overall_score = score;
    session.overall_status = overallStatus;
    session.overall_summary = parts.join(' ');
    session.kb_entries_used = [];
    session.updated_at = new Date().toISOString();
    session.issue_count = allIssues.length;
    session.critical_count = sevCounts.critical || 0;
    session.major_count = sevCounts.major || 0;
    session.orchestration = {
      total_cost: orchestration.total_estimated_cost,
      budget: orchestration.max_budget,
      fetch_time_ms: fetchTimeMs,
      modules_run: orchestration.approved.length,
      modules_skipped: orchestration.skipped.length,
      layer_scores: layerScores,
    };

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
