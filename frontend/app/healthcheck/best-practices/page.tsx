'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Server,
  Shield,
  Zap,
  Search,
  Brain,
  Eye,
  Code2,
  ExternalLink,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Globe,
  AlertTriangle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Best Practices Data per Layer
// ---------------------------------------------------------------------------

interface Practice {
  title: string;
  description: string;
  standard: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  resources: { label: string; url: string }[];
}

interface LayerPractices {
  id: string;
  name: string;
  icon: typeof Globe;
  color: string;
  bg: string;
  practices: Practice[];
  lastUpdated: string;
}

const BEST_PRACTICES: LayerPractices[] = [
  {
    id: 'L1',
    name: 'Infrastructure & Server',
    icon: Server,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    lastUpdated: '2026-02-15',
    practices: [
      { title: 'Use HTTPS everywhere', description: 'All pages must be served over HTTPS with a valid SSL/TLS certificate. HTTP should 301 redirect to HTTPS. HSTS header should be set with max-age of at least 1 year.', standard: 'OWASP, Google Security', priority: 'critical', resources: [{ label: "Let's Encrypt", url: 'https://letsencrypt.org' }, { label: 'SSL Labs Test', url: 'https://www.ssllabs.com/ssltest/' }] },
      { title: 'Server Response Time < 200ms', description: 'Time to First Byte (TTFB) should be under 200ms. Use CDN, server caching, and optimized database queries. Google uses TTFB as a ranking signal.', standard: 'Google Core Web Vitals', priority: 'high', resources: [{ label: 'web.dev TTFB Guide', url: 'https://web.dev/articles/ttfb' }] },
      { title: 'Enable compression (gzip/brotli)', description: 'Enable server-side compression for text-based resources. Brotli provides 15-20% better compression than gzip. Configure Content-Encoding headers.', standard: 'HTTP/2 Best Practices', priority: 'high', resources: [{ label: 'Brotli Compression', url: 'https://web.dev/articles/codelab-text-compression-brotli' }] },
      { title: 'Set proper cache headers', description: 'Use Cache-Control headers with appropriate max-age for static assets (1 year for versioned files). Use ETag for dynamic content. Implement cache busting for deployments.', standard: 'RFC 7234', priority: 'medium', resources: [{ label: 'Caching Best Practices', url: 'https://web.dev/articles/http-cache' }] },
      { title: 'Declare character encoding', description: 'Add <meta charset="UTF-8"> as the first element in <head>. This prevents rendering delays and character display issues.', standard: 'W3C HTML Standard', priority: 'medium', resources: [{ label: 'W3C Encoding', url: 'https://www.w3.org/International/questions/qa-html-encoding-declarations' }] },
    ],
  },
  {
    id: 'L2',
    name: 'Security & Privacy',
    icon: Shield,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    lastUpdated: '2026-02-15',
    practices: [
      { title: 'Content Security Policy (CSP)', description: 'Implement a strict CSP header to prevent XSS attacks. Start with report-only mode to identify violations before enforcing. Block inline scripts and eval().', standard: 'OWASP Top 10', priority: 'critical', resources: [{ label: 'CSP Reference', url: 'https://content-security-policy.com' }, { label: 'CSP Evaluator', url: 'https://csp-evaluator.withgoogle.com' }] },
      { title: 'Security headers (HSTS, X-Frame, etc.)', description: 'Set Strict-Transport-Security, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, and Permissions-Policy headers.', standard: 'OWASP Secure Headers', priority: 'critical', resources: [{ label: 'Security Headers Scanner', url: 'https://securityheaders.com' }] },
      { title: 'No API keys in client-side code', description: 'Never expose API keys, tokens, or secrets in HTML, JavaScript, or source maps. Use server-side proxies for API calls. Rotate any exposed keys immediately.', standard: 'OWASP API Security', priority: 'critical', resources: [{ label: 'OWASP Secrets Management', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html' }] },
      { title: 'Subresource Integrity (SRI)', description: 'Add integrity attributes to all external scripts and stylesheets. This prevents CDN compromise attacks.', standard: 'W3C SRI', priority: 'high', resources: [{ label: 'SRI Hash Generator', url: 'https://www.srihash.org' }] },
      { title: 'Cookie security flags', description: 'Set Secure, HttpOnly, and SameSite flags on all cookies. Use SameSite=Strict for session cookies to prevent CSRF.', standard: 'RFC 6265bis', priority: 'high', resources: [{ label: 'Cookie Security', url: 'https://web.dev/articles/samesite-cookies-explained' }] },
      { title: 'Remove server version info', description: 'Remove or obfuscate Server, X-Powered-By, and similar headers that reveal your tech stack. This reduces attack surface.', standard: 'OWASP Information Disclosure', priority: 'medium', resources: [{ label: 'OWASP Info Leakage', url: 'https://owasp.org/www-project-web-security-testing-guide/' }] },
    ],
  },
  {
    id: 'L3',
    name: 'Performance & Speed',
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    lastUpdated: '2026-02-15',
    practices: [
      { title: 'Core Web Vitals targets', description: 'LCP < 2.5s (Largest Contentful Paint), INP < 200ms (Interaction to Next Paint), CLS < 0.1 (Cumulative Layout Shift). These are Google ranking factors.', standard: 'Google Core Web Vitals', priority: 'critical', resources: [{ label: 'web.dev CWV', url: 'https://web.dev/articles/vitals' }, { label: 'PageSpeed Insights', url: 'https://pagespeed.web.dev' }] },
      { title: 'Total page weight < 1.5MB', description: 'Keep total transfer size under 1.5MB for initial page load. Optimize images (WebP/AVIF), minify CSS/JS, tree-shake unused code.', standard: 'HTTP Archive Recommendations', priority: 'high', resources: [{ label: 'HTTP Archive', url: 'https://httparchive.org/reports/page-weight' }] },
      { title: 'Responsive images with srcset', description: 'Use srcset and sizes attributes to serve appropriately sized images for each device. Use modern formats (WebP, AVIF) with fallbacks.', standard: 'W3C Responsive Images', priority: 'high', resources: [{ label: 'Responsive Images Guide', url: 'https://web.dev/articles/responsive-images' }] },
      { title: 'Lazy load below-fold content', description: 'Add loading="lazy" to images and iframes below the fold. Use Intersection Observer for custom lazy loading. Never lazy-load LCP images.', standard: 'Web Performance Best Practices', priority: 'medium', resources: [{ label: 'Lazy Loading Guide', url: 'https://web.dev/articles/lazy-loading-images' }] },
      { title: 'Viewport meta tag for mobile', description: 'Include <meta name="viewport" content="width=device-width, initial-scale=1"> for proper mobile rendering. Google uses mobile-first indexing.', standard: 'Google Mobile-First Indexing', priority: 'critical', resources: [{ label: 'Mobile-Friendly Test', url: 'https://search.google.com/test/mobile-friendly' }] },
    ],
  },
  {
    id: 'L4',
    name: 'SEO Foundation',
    icon: Search,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    lastUpdated: '2026-02-15',
    practices: [
      { title: 'Title tag: 50-60 characters', description: 'Include primary keyword near the start. Make it compelling for clicks. Unique per page. Google truncates at ~60 characters.', standard: 'Google SEO Starter Guide', priority: 'critical', resources: [{ label: 'Google SEO Guide', url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide' }] },
      { title: 'Meta description: 150-160 characters', description: 'Write compelling descriptions with keyword and call-to-action. Unique per page. Google may override with page content.', standard: 'Google SEO Guidelines', priority: 'high', resources: [{ label: 'Snippet Guide', url: 'https://developers.google.com/search/docs/appearance/snippet' }] },
      { title: 'Single H1 with proper hierarchy', description: 'One H1 per page with primary keyword. Use H2-H6 for subsections. Never skip heading levels. Headings should create a logical outline.', standard: 'SEO & Accessibility Standards', priority: 'high', resources: [{ label: 'Heading Structure', url: 'https://www.w3.org/WAI/tutorials/page-structure/headings/' }] },
      { title: 'Canonical URL on every page', description: 'Add <link rel="canonical"> to prevent duplicate content issues. Self-referencing canonicals are recommended.', standard: 'Google Duplicate Content', priority: 'high', resources: [{ label: 'Canonical Guide', url: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls' }] },
      { title: 'JSON-LD structured data', description: 'Add Organization, WebPage, BreadcrumbList schemas at minimum. Use Article, Product, FAQ, HowTo schemas where applicable. Validate with Google Rich Results Test.', standard: 'Schema.org, Google SD Guidelines', priority: 'high', resources: [{ label: 'Schema.org', url: 'https://schema.org' }, { label: 'Rich Results Test', url: 'https://search.google.com/test/rich-results' }] },
      { title: 'Open Graph + Twitter Card meta', description: 'Add og:title, og:description, og:image for social sharing previews. Add twitter:card, twitter:title for X/Twitter.', standard: 'Open Graph Protocol', priority: 'medium', resources: [{ label: 'Open Graph Protocol', url: 'https://ogp.me' }] },
    ],
  },
  {
    id: 'L5',
    name: 'AI & Content Intelligence',
    icon: Brain,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    lastUpdated: '2026-02-15',
    practices: [
      { title: 'E-E-A-T signals (Experience, Expertise, Authority, Trust)', description: 'Show author credentials, publication dates, expert citations. Link to About and Contact pages. Display trust badges, reviews, and credentials.', standard: 'Google Quality Rater Guidelines', priority: 'critical', resources: [{ label: 'Google E-E-A-T', url: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content' }] },
      { title: 'Content depth: 1000+ words for informational', description: 'Comprehensive content performs better in AI summaries and search. Cover topics thoroughly with examples, data, and expert insights.', standard: 'Content Quality Research', priority: 'high', resources: [{ label: 'Helpful Content Guide', url: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content' }] },
      { title: 'Sentence readability (15-20 words avg)', description: 'Short sentences improve comprehension for both humans and AI. Use Flesch-Kincaid or similar readability scoring. Target 8th grade reading level.', standard: 'Plain Language Guidelines', priority: 'medium', resources: [{ label: 'Readability Guide', url: 'https://www.plainlanguage.gov/guidelines/' }] },
      { title: 'FAQ and How-To schema for AI snippets', description: 'Implement FAQPage and HowTo structured data to appear in AI-generated answers and featured snippets.', standard: 'Google AI Overview Guidelines', priority: 'high', resources: [{ label: 'FAQ Schema', url: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage' }] },
      { title: 'Content freshness signals', description: 'Include publication and last-modified dates (article:published_time, article:modified_time). Update content regularly and reflect dates.', standard: 'Google Freshness Signals', priority: 'medium', resources: [{ label: 'Content Freshness', url: 'https://developers.google.com/search/docs/appearance/publication-dates' }] },
    ],
  },
  {
    id: 'L6',
    name: 'Accessibility (WCAG 2.2)',
    icon: Eye,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    lastUpdated: '2026-02-15',
    practices: [
      { title: 'WCAG 2.2 Level AA compliance', description: 'Meet all Level A and AA success criteria. This covers perceivable, operable, understandable, and robust principles.', standard: 'W3C WCAG 2.2', priority: 'critical', resources: [{ label: 'WCAG 2.2 Quick Ref', url: 'https://www.w3.org/WAI/WCAG22/quickref/' }, { label: 'WAVE Tool', url: 'https://wave.webaim.org' }] },
      { title: 'Alt text on all images', description: 'Add descriptive alt text to all informative images. Use alt="" (empty) for decorative images. Never use "image of..." or "picture of..." prefixes.', standard: 'WCAG 1.1.1', priority: 'critical', resources: [{ label: 'Alt Text Guide', url: 'https://www.w3.org/WAI/tutorials/images/' }] },
      { title: 'ARIA landmarks and semantic HTML', description: 'Use <main>, <nav>, <header>, <footer> elements. Add aria-label to distinguish multiple instances. Use role attributes when semantic HTML is insufficient.', standard: 'WCAG 1.3.1, WAI-ARIA', priority: 'high', resources: [{ label: 'ARIA Landmarks', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/' }] },
      { title: 'Form labels and error messages', description: 'Every form input needs a visible <label>. Provide clear error messages linked to inputs. Use aria-describedby for help text.', standard: 'WCAG 1.3.1, 3.3.1, 4.1.2', priority: 'high', resources: [{ label: 'Form Accessibility', url: 'https://www.w3.org/WAI/tutorials/forms/' }] },
      { title: 'Keyboard navigation support', description: 'All interactive elements must be keyboard accessible. Visible focus indicators required. No keyboard traps. Skip navigation link as first element.', standard: 'WCAG 2.1.1, 2.4.1, 2.4.7', priority: 'high', resources: [{ label: 'Keyboard Guide', url: 'https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html' }] },
      { title: 'Color contrast ratio >= 4.5:1', description: 'Normal text needs 4.5:1 contrast ratio. Large text (18px+ or 14px+ bold) needs 3:1. Use tools to verify. Never rely on color alone.', standard: 'WCAG 1.4.3', priority: 'high', resources: [{ label: 'Contrast Checker', url: 'https://webaim.org/resources/contrastchecker/' }] },
    ],
  },
  {
    id: 'L7',
    name: 'Quality & Standards',
    icon: Code2,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    lastUpdated: '2026-02-15',
    practices: [
      { title: 'Valid HTML5 with DOCTYPE', description: 'Start every page with <!DOCTYPE html>. Validate HTML with W3C validator. Fix all errors and warnings.', standard: 'W3C HTML Standard', priority: 'high', resources: [{ label: 'W3C Validator', url: 'https://validator.w3.org' }] },
      { title: 'No deprecated HTML tags', description: 'Replace <font>, <center>, <marquee>, <strike> with CSS equivalents. Use semantic HTML5 elements.', standard: 'HTML Living Standard', priority: 'medium', resources: [{ label: 'HTML Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element' }] },
      { title: 'No mixed content (HTTP on HTTPS)', description: 'All resources (scripts, images, fonts) must be loaded over HTTPS when the page is HTTPS. Mixed content causes security warnings.', standard: 'W3C Mixed Content', priority: 'high', resources: [{ label: 'Mixed Content Fix', url: 'https://web.dev/articles/fixing-mixed-content' }] },
      { title: 'Favicon and touch icons', description: 'Include favicon.ico, apple-touch-icon, and manifest.json for a professional appearance in browser tabs, bookmarks, and mobile home screens.', standard: 'Web App Manifest', priority: 'low', resources: [{ label: 'Favicon Guide', url: 'https://web.dev/articles/add-manifest' }] },
      { title: 'Minimize inline styles', description: 'Move styles to external CSS files. Inline styles hurt caching, increase HTML size, and make maintenance difficult. Exception: critical above-fold styles.', standard: 'CSS Best Practices', priority: 'medium', resources: [{ label: 'CSS Organization', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Organizing' }] },
    ],
  },
];

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Critical' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'High' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Medium' },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Low' },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BestPracticesPage() {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set(['L1']));
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  const toggleLayer = (id: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedLayers(new Set(BEST_PRACTICES.map((l) => l.id)));
  const collapseAll = () => setExpandedLayers(new Set());

  const totalPractices = BEST_PRACTICES.reduce((sum, l) => sum + l.practices.length, 0);
  const criticalPractices = BEST_PRACTICES.reduce((sum, l) => sum + l.practices.filter(p => p.priority === 'critical').length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Platform
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <Activity className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Best Practices</h1>
                <p className="text-slate-400 text-sm">Standards & guidelines across all 7 layers</p>
              </div>
            </div>
            {/* Submenu */}
            <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg border border-slate-700/50 p-1">
              <Link
                href="/healthcheck"
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors"
              >
                Health Check
              </Link>
              <span className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600/20 border border-emerald-500/30 rounded-md">
                <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> Best Practices</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Overview */}
        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 rounded-2xl border border-indigo-500/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Web Health Best Practices Library</h2>
              <p className="text-slate-400 text-sm">{totalPractices} practices across 7 layers, {criticalPractices} critical</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Curated from OWASP, W3C WCAG 2.2, Google SEO guidelines, and industry standards. The orchestrating agent uses these criteria to score your website.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>Criteria sourced from OWASP, W3C, Google, Schema.org</span>
            <span className="mx-1">|</span>
            <RefreshCw className="w-3 h-3" />
            <span>Daily scan updates planned</span>
          </div>
        </div>

        {/* Filters + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filter by priority:</span>
            {(['critical', 'high', 'medium', 'low'] as const).map((p) => {
              const pc = priorityConfig[p];
              const isActive = priorityFilter === p;
              return (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(isActive ? null : p)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    isActive ? `${pc.bg} ${pc.color} border-current` : 'text-slate-500 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {pc.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={expandAll} className="text-xs text-slate-400 hover:text-white transition-colors">Expand All</button>
            <span className="text-slate-700">|</span>
            <button onClick={collapseAll} className="text-xs text-slate-400 hover:text-white transition-colors">Collapse All</button>
          </div>
        </div>

        {/* Layer Sections */}
        <div className="space-y-4">
          {BEST_PRACTICES.map((layer) => {
            const Icon = layer.icon;
            const isExpanded = expandedLayers.has(layer.id);
            const filteredPractices = priorityFilter
              ? layer.practices.filter((p) => p.priority === priorityFilter)
              : layer.practices;

            return (
              <div key={layer.id} className={`rounded-xl border overflow-hidden ${layer.bg}`}>
                {/* Layer Header */}
                <button
                  onClick={() => toggleLayer(layer.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-[10px] text-slate-500 font-mono w-5">{layer.id}</span>
                  <Icon className={`w-5 h-5 ${layer.color}`} />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-white">{layer.name}</span>
                    <span className="text-xs text-slate-500 ml-3">{filteredPractices.length} practices</span>
                  </div>
                  <span className="text-[10px] text-slate-600">Updated {layer.lastUpdated}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {/* Practices */}
                {isExpanded && filteredPractices.length > 0 && (
                  <div className="border-t border-white/[0.05]">
                    {filteredPractices.map((practice, idx) => {
                      const pc = priorityConfig[practice.priority];
                      return (
                        <div key={idx} className="px-5 py-4 border-b border-white/[0.03] last:border-b-0">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${pc.color}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <h4 className="text-sm font-medium text-white">{practice.title}</h4>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${pc.bg} ${pc.color}`}>{pc.label}</span>
                                <span className="text-[10px] text-slate-600">{practice.standard}</span>
                              </div>
                              <p className="text-xs text-slate-400 mb-2 leading-relaxed">{practice.description}</p>
                              {practice.resources.length > 0 && (
                                <div className="flex items-center gap-3">
                                  {practice.resources.map((r, rIdx) => (
                                    <a
                                      key={rIdx}
                                      href={r.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                      {r.label}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {isExpanded && filteredPractices.length === 0 && (
                  <div className="px-5 py-6 text-center text-xs text-slate-500 border-t border-white/[0.05]">
                    No practices match the current filter
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Future: Daily Scanning */}
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-medium text-white">Daily Scanning (Coming Soon)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The orchestrating agent will automatically scan updated standards from OWASP, W3C, Google Search Central, and Schema.org on a daily basis.
            New criteria will be added to the library and reflected in health check scoring automatically.
            This ensures your scans always reflect the latest best practices without manual updates.
          </p>
        </div>
      </main>
    </div>
  );
}
