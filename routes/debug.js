/**
 * Debug / Health-Check API Routes
 *
 * Provides endpoints for the Website Health Check and Debug QA use cases.
 * Sessions live in-memory (no extra DB tables required).
 */
const express = require('express');
const crypto = require('crypto');
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

  // --------------------------------------------------
  // Module check runners
  // --------------------------------------------------
  function checkSeoAiseo(subjectRef) {
    if (!subjectRef) {
      return [{ module: 'seo_aiseo', area: 'WebPerf', severity: 'major', finding: 'No URL provided for SEO audit.', recommendation: 'Provide a valid URL to run SEO analysis.', priority: 'P0', score_impact: 15, business_impact: 'high' }];
    }
    const checks = [
      { name: 'Meta Tags', finding: 'Meta title and description analysis queued. Checking length, keyword presence, and uniqueness.', recommendation: 'Ensure meta title is 50-60 chars with primary keyword, meta description is 150-160 chars with call to action.', severity: 'info', score_impact: 0 },
      { name: 'Heading Structure', finding: 'H1-H6 heading hierarchy analysis queued. Checking for single H1, proper nesting, and keyword usage.', recommendation: 'Use exactly one H1 per page. Maintain logical heading hierarchy (H1 > H2 > H3). Include target keywords naturally.', severity: 'info', score_impact: 0 },
      { name: 'Structured Data', finding: 'Schema.org / JSON-LD structured data check queued. Verifying Organization, BreadcrumbList, and page-specific schemas.', recommendation: 'Add JSON-LD structured data for Organization, BreadcrumbList, and relevant content type (Article, Product, FAQ).', severity: 'minor', score_impact: 3 },
      { name: 'Internal Linking', finding: 'Internal link analysis queued. Checking anchor text diversity, link depth, and orphan pages.', recommendation: 'Ensure all important pages are within 3 clicks from homepage. Use descriptive anchor text. Fix orphan pages.', severity: 'info', score_impact: 0 },
      { name: 'AI Content Optimization', finding: 'AI SEO signals check queued. Analyzing content for E-E-A-T signals, originality markers, and AI-generated content patterns.', recommendation: 'Add author attribution, cite sources, include first-person experience, and ensure content demonstrates expertise.', severity: 'info', score_impact: 0 },
      { name: 'Core Web Vitals SEO', finding: 'Core Web Vitals SEO impact analysis queued. CWV is a ranking signal per Google 2024 standards.', recommendation: 'Ensure LCP < 2.5s, INP < 200ms, CLS < 0.1 for best SEO performance. Optimize images and reduce render-blocking resources.', severity: 'minor', score_impact: 2 },
    ];
    return checks.map(c => ({
      module: 'seo_aiseo', area: 'WebPerf', severity: c.severity,
      finding: `[${c.name}] ${c.finding}`, recommendation: c.recommendation,
      priority: 'P2', score_impact: c.score_impact,
      business_impact: c.score_impact > 0 ? 'medium' : 'low',
    }));
  }

  function checkWebsiteHealth(subjectRef) {
    if (!subjectRef) {
      return [{ module: 'website_health', area: 'WebPerf', severity: 'major', finding: 'No URL provided for website health check.', recommendation: 'Provide a valid URL to run health checks.', priority: 'P0', score_impact: 15, business_impact: 'high' }];
    }
    const checks = [
      { name: 'Core Web Vitals (LCP)', finding: `Largest Contentful Paint analysis queued for ${subjectRef}. Google standard: < 2.5s (good), 2.5-4s (needs improvement), > 4s (poor).`, recommendation: 'Optimize largest content element: compress images to WebP/AVIF, use responsive images with srcset, preload critical resources, and implement CDN caching.', severity: 'minor', score_impact: 5 },
      { name: 'Core Web Vitals (INP)', finding: 'Interaction to Next Paint analysis queued. INP replaced FID in March 2024 as Google\'s responsiveness metric. Standard: < 200ms (good).', recommendation: 'Reduce JavaScript execution time, break up long tasks, use web workers for heavy computation, and optimize event handlers.', severity: 'minor', score_impact: 3 },
      { name: 'Core Web Vitals (CLS)', finding: 'Cumulative Layout Shift analysis queued. Google standard: < 0.1 (good). Measures visual stability.', recommendation: 'Set explicit width/height on images and embeds, avoid inserting content above existing content, and use CSS containment.', severity: 'minor', score_impact: 3 },
      { name: 'Broken Links', finding: 'Broken link scan queued. Will check all internal and external links for 404s, redirects, and timeouts.', recommendation: 'Fix or remove broken links. Replace permanent redirects (301) where possible. Set up link monitoring.', severity: 'minor', score_impact: 4 },
      { name: 'Mobile-Friendliness', finding: 'Mobile viewport and touch target analysis queued per Google mobile-first indexing standards.', recommendation: 'Ensure viewport meta tag is set, touch targets are >= 48x48px with 8px spacing, text is readable without zooming.', severity: 'info', score_impact: 0 },
      { name: 'HTTPS & Security Headers', finding: 'HTTPS compliance and security header check queued. Verifying SSL certificate, HSTS, CSP, and X-Frame-Options.', recommendation: 'Ensure valid SSL certificate, enable HSTS with includeSubDomains, set Content-Security-Policy and X-Frame-Options headers.', severity: 'info', score_impact: 0 },
      { name: 'Accessibility (WCAG 2.2)', finding: 'Accessibility audit queued per WCAG 2.2 Level AA. Checking color contrast, alt text, ARIA labels, keyboard navigation.', recommendation: 'Ensure 4.5:1 color contrast ratio, add alt text to all images, use semantic HTML, and test with screen reader.', severity: 'minor', score_impact: 3 },
      { name: 'Performance Budget', finding: 'Page weight analysis queued. Checking total page size, number of requests, and resource breakdown.', recommendation: 'Keep total page weight under 1.5MB. Minimize HTTP requests. Use lazy loading for below-fold images and iframes.', severity: 'info', score_impact: 0 },
    ];
    return checks.map(c => ({
      module: 'website_health', area: 'WebPerf', severity: c.severity,
      finding: `[${c.name}] ${c.finding}`, recommendation: c.recommendation,
      priority: c.score_impact >= 4 ? 'P1' : 'P2', score_impact: c.score_impact,
      business_impact: c.score_impact >= 4 ? 'high' : 'medium',
    }));
  }

  function checkWebQc(subjectRef) {
    if (!subjectRef) {
      return [{ module: 'web_qc', area: 'WebQC', severity: 'major', finding: 'No URL provided for web quality check.', recommendation: 'Provide a valid URL in the subject_ref field.', priority: 'P0', score_impact: 15, business_impact: 'high' }];
    }
    return [{
      module: 'web_qc', area: 'WebPerf', severity: 'info',
      finding: `Web quality check queued for ${subjectRef}. Full Lighthouse/accessibility audit pending integration.`,
      recommendation: 'Connect headless browser integration for automated web performance and accessibility testing.',
      priority: 'P2', score_impact: 0, business_impact: 'none',
    }];
  }

  function checkBrandGuardian(subjectRef, kbContext) {
    const bp = kbContext.brand_profile || {};
    if (!bp.brand_tone && !bp.brand_values) {
      return [{ module: 'brand_guardian', area: 'Brand', severity: 'info', finding: 'No brand profile configured for this client. Brand checks were skipped.', recommendation: 'Set up a brand profile with tone, values, and do/don\'t lists to enable brand compliance checking.', priority: 'P3', score_impact: 0, business_impact: 'low' }];
    }
    return [];
  }

  function runModule(moduleId, subjectRef, kbContext) {
    switch (moduleId) {
      case 'seo_aiseo': return checkSeoAiseo(subjectRef);
      case 'website_health': return checkWebsiteHealth(subjectRef);
      case 'web_qc': return checkWebQc(subjectRef);
      case 'brand_guardian': return checkBrandGuardian(subjectRef, kbContext);
      case 'social_best_practice':
        return [{ module: 'social_best_practice', area: 'Social', severity: 'info', finding: 'Social best practice check queued. Platform-specific guidelines verification pending AI integration.', recommendation: 'Verify post meets platform character limits, hashtag best practices, and engagement hooks.', priority: 'P2', score_impact: 0, business_impact: 'none' }];
      case 'design_accuracy':
        return [{ module: 'design_accuracy', area: 'Design', severity: 'info', finding: 'Design accuracy check queued. AI vision analysis pending integration.', recommendation: 'Connect Claude Vision integration for automated design compliance checking.', priority: 'P2', score_impact: 0, business_impact: 'none' }];
      case 'content_review':
        return [{ module: 'content_review', area: 'Brand', severity: 'info', finding: 'Content review queued. Tone and message alignment check pending AI integration.', recommendation: 'Ensure deliverable content aligns with documented key messages.', priority: 'P2', score_impact: 0, business_impact: 'none' }];
      default: return [];
    }
  }

  // --------------------------------------------------
  // GET /debug/modules
  // --------------------------------------------------
  router.get('/debug/modules', (req, res) => {
    res.json(MODULE_DEFS);
  });

  // --------------------------------------------------
  // GET /debug/sessions
  // --------------------------------------------------
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

  // --------------------------------------------------
  // GET /debug/sessions/:id
  // --------------------------------------------------
  router.get('/debug/sessions/:id', (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) return res.status(404).json({ detail: 'Session not found' });
    // Attach issues
    const sessionIssues = Array.from(issues.values())
      .filter(i => i.debug_session_id === session.id);
    res.json({ ...session, issues: sessionIssues });
  });

  // --------------------------------------------------
  // Shared: execute modules on a session
  // --------------------------------------------------
  function executeSession(session) {
    const kbContext = { brand_profile: {}, rules: [], patterns: [] };
    const allIssues = [];
    const updatedModules = [];

    for (const moduleEntry of (session.modules_invoked || [])) {
      const moduleId = moduleEntry.module;
      const start = Date.now();
      try {
        const moduleIssues = runModule(moduleId, session.subject_ref, kbContext);
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
      priority: issueData.priority || 'P2',
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
    const parts = [`Score: ${score}/100 (${overallStatus.toUpperCase()}).`, `Found ${allIssues.length} issue(s).`];
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

  // --------------------------------------------------
  // POST /debug/sessions  (create, optionally auto-run)
  // --------------------------------------------------
  router.post('/debug/sessions', (req, res) => {
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
      const sessionIssues = executeSession(session);
      return res.status(201).json({ ...session, issues: sessionIssues });
    }

    res.status(201).json(session);
  });

  // --------------------------------------------------
  // POST /debug/sessions/:id/run  (execute modules)
  // --------------------------------------------------
  router.post('/debug/sessions/:id/run', (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) return res.status(404).json({ detail: 'Session not found' });
    if (session.overall_score !== null) {
      return res.status(409).json({ detail: 'Debug session has already been executed' });
    }

    const sessionIssues = executeSession(session);
    res.json({ ...session, issues: sessionIssues });
  });

  // --------------------------------------------------
  // PATCH /debug/sessions/:id
  // --------------------------------------------------
  router.patch('/debug/sessions/:id', (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) return res.status(404).json({ detail: 'Session not found' });

    if (req.body.status) session.status = req.body.status;
    if (req.body.status_notes !== undefined) session.status_notes = req.body.status_notes;
    session.updated_at = new Date().toISOString();

    res.json(session);
  });

  // --------------------------------------------------
  // GET /debug/issues
  // --------------------------------------------------
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

  // --------------------------------------------------
  // PATCH /debug/issues/:id
  // --------------------------------------------------
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

  // --------------------------------------------------
  // GET /debug/stats
  // --------------------------------------------------
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
