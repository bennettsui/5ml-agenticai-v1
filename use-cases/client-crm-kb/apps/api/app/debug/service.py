"""
Service layer for Debug Sessions, Issues, and Trace operations.

Handles CRUD, module orchestration, and KB integration.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    BrandProfile,
    Client,
    ClientRule,
    DebugIssue,
    DebugModuleDefinition,
    DebugSession,
    DebugTraceStep,
    Pattern,
)


# ---------------------------------------------------------------------------
# Debug Module Definitions
# ---------------------------------------------------------------------------


async def list_modules(db: AsyncSession) -> list[DebugModuleDefinition]:
    """Return all active debug module definitions."""
    result = await db.execute(
        select(DebugModuleDefinition).where(
            DebugModuleDefinition.status == "active"
        )
    )
    return list(result.scalars().all())


async def get_modules_for_subject(
    db: AsyncSession, subject_type: str
) -> list[DebugModuleDefinition]:
    """Return modules applicable to a given subject type."""
    all_modules = await list_modules(db)
    return [
        m
        for m in all_modules
        if m.applicable_subject_types
        and subject_type in m.applicable_subject_types
    ]


# ---------------------------------------------------------------------------
# Debug Sessions CRUD
# ---------------------------------------------------------------------------


async def create_session(
    db: AsyncSession, data: dict, user_id: Optional[UUID] = None
) -> DebugSession:
    """Create a new debug session."""
    module_ids = data.pop("module_ids", [])

    session = DebugSession(
        project_id=data.get("project_id"),
        client_id=data.get("client_id"),
        subject_type=data["subject_type"],
        subject_ref=data.get("subject_ref"),
        trace_enabled=data.get("trace_enabled", False),
        initiated_by=user_id,
        modules_invoked=[
            {"module": mid, "status": "pending", "execution_time_ms": 0}
            for mid in module_ids
        ],
        kb_entries_used=[],
        status="open",
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


async def get_session(db: AsyncSession, session_id: UUID) -> DebugSession:
    """Get a debug session by ID, with issues loaded."""
    result = await db.execute(
        select(DebugSession)
        .options(selectinload(DebugSession.issues))
        .where(DebugSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Debug session {session_id} not found",
        )
    return session


async def list_sessions(
    db: AsyncSession,
    *,
    client_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    session_status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[DebugSession], int]:
    """List debug sessions with optional filters and pagination."""
    query = select(DebugSession)
    count_query = select(func.count(DebugSession.id))

    if client_id:
        query = query.where(DebugSession.client_id == client_id)
        count_query = count_query.where(DebugSession.client_id == client_id)
    if project_id:
        query = query.where(DebugSession.project_id == project_id)
        count_query = count_query.where(DebugSession.project_id == project_id)
    if session_status:
        query = query.where(DebugSession.status == session_status)
        count_query = count_query.where(DebugSession.status == session_status)

    total = (await db.execute(count_query)).scalar() or 0

    query = (
        query.order_by(DebugSession.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(query)
    return list(result.scalars().all()), total


async def update_session_status(
    db: AsyncSession, session_id: UUID, data: dict
) -> DebugSession:
    """Update session status and notes."""
    session = await get_session(db, session_id)
    for key, value in data.items():
        if value is not None:
            setattr(session, key, value)
    await db.flush()
    await db.refresh(session)
    return session


# ---------------------------------------------------------------------------
# Debug Session Execution
# ---------------------------------------------------------------------------


async def load_client_kb(
    db: AsyncSession, client_id: UUID
) -> dict:
    """Load client knowledge base context for debug modules."""
    # Brand profile
    bp_result = await db.execute(
        select(BrandProfile).where(BrandProfile.client_id == client_id)
    )
    brand_profile = bp_result.scalar_one_or_none()

    # Active client rules
    rules_result = await db.execute(
        select(ClientRule).where(
            ClientRule.client_id == client_id,
            ClientRule.status == "active",
        )
    )
    rules = list(rules_result.scalars().all())

    # Patterns (client + segment + global)
    patterns_result = await db.execute(
        select(Pattern).where(
            (Pattern.client_id == client_id)
            | (Pattern.scope == "segment")
            | (Pattern.scope == "global")
        )
    )
    patterns = list(patterns_result.scalars().all())

    return {
        "brand_profile": {
            "brand_tone": brand_profile.brand_tone if brand_profile else None,
            "brand_values": brand_profile.brand_values if brand_profile else [],
            "key_messages": brand_profile.key_messages if brand_profile else [],
            "do_list": brand_profile.do_list if brand_profile else [],
            "dont_list": brand_profile.dont_list if brand_profile else [],
            "legal_sensitivities": brand_profile.legal_sensitivities if brand_profile else None,
            "visual_rules": brand_profile.visual_rules if brand_profile else {},
        },
        "rules": [
            {
                "id": str(r.id),
                "description": r.description,
                "rule_type": r.rule_type,
                "applies_to": r.applies_to or [],
                "priority": r.priority,
            }
            for r in rules
        ],
        "patterns": [
            {
                "id": str(p.id),
                "name": p.name,
                "description": p.description,
                "scope": p.scope,
                "category": p.category,
                "trigger_conditions": p.trigger_conditions,
                "recommended_actions": p.recommended_actions or [],
            }
            for p in patterns
        ],
    }


async def run_debug_session(
    db: AsyncSession, session_id: UUID
) -> DebugSession:
    """
    Execute debug modules for a session.

    Loads client KB, runs each selected module, collects issues,
    calculates overall score, and updates the session.
    """
    session = await get_session(db, session_id)

    if session.overall_score is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Debug session has already been executed",
        )

    # Load client KB (skip if no client — quick URL check mode)
    if session.client_id:
        kb_context = await load_client_kb(db, session.client_id)
    else:
        kb_context = {
            "brand_profile": {},
            "rules": [],
            "patterns": [],
        }

    # Track KB entries used
    kb_entries_used = []
    for rule in kb_context["rules"]:
        kb_entries_used.append({"type": "rule", "id": rule["id"]})
    for pattern in kb_context["patterns"]:
        kb_entries_used.append({"type": "pattern", "id": pattern["id"]})

    # Run each module
    all_issues: list[dict] = []
    modules_invoked = session.modules_invoked or []
    updated_modules = []

    for module_entry in modules_invoked:
        module_id = module_entry["module"]
        start_time = datetime.now(timezone.utc)

        try:
            issues = await _run_module(
                module_id=module_id,
                subject_type=session.subject_type,
                subject_ref=session.subject_ref,
                kb_context=kb_context,
            )
            elapsed_ms = int(
                (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            )
            updated_modules.append({
                "module": module_id,
                "status": "success",
                "execution_time_ms": elapsed_ms,
                "issues_found": len(issues),
            })
            all_issues.extend(issues)
        except Exception as e:
            elapsed_ms = int(
                (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            )
            updated_modules.append({
                "module": module_id,
                "status": "failed",
                "execution_time_ms": elapsed_ms,
                "error_message": str(e),
            })

    # Create issue records
    for issue_data in all_issues:
        issue = DebugIssue(
            debug_session_id=session.id,
            client_id=session.client_id,
            project_id=session.project_id,
            module=issue_data["module"],
            area=issue_data["area"],
            severity=issue_data["severity"],
            finding=issue_data["finding"],
            evidence=issue_data.get("evidence", {}),
            recommendation=issue_data.get("recommendation"),
            priority=issue_data.get("priority", "P2"),
            score_impact=issue_data.get("score_impact", 0),
            business_impact=issue_data.get("business_impact", "none"),
            related_rule_ids=issue_data.get("related_rule_ids"),
            related_pattern_ids=issue_data.get("related_pattern_ids"),
        )
        db.add(issue)

    # Calculate overall score
    score = 100
    for issue_data in all_issues:
        score -= issue_data.get("score_impact", 0)
    score = max(0, min(100, score))

    # Determine overall status
    has_critical = any(i["severity"] == "critical" for i in all_issues)
    if score >= 80 and not has_critical:
        overall_status = "pass"
    elif score >= 60 and not has_critical:
        overall_status = "warning"
    else:
        overall_status = "fail"

    # Build summary
    severity_counts = {}
    for i in all_issues:
        sev = i["severity"]
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    summary_parts = [f"Score: {score}/100 ({overall_status.upper()})."]
    summary_parts.append(f"Found {len(all_issues)} issue(s).")
    for sev in ["critical", "major", "minor", "info"]:
        if sev in severity_counts:
            summary_parts.append(f"{severity_counts[sev]} {sev}")

    # Update session
    session.modules_invoked = updated_modules
    session.overall_score = score
    session.overall_status = overall_status
    session.overall_summary = " ".join(summary_parts)
    session.kb_entries_used = kb_entries_used

    await db.flush()
    await db.refresh(session)
    return session


async def _run_module(
    *,
    module_id: str,
    subject_type: str,
    subject_ref: Optional[str],
    kb_context: dict,
) -> list[dict]:
    """
    Run a single debug module and return a list of issue dicts.

    In a production system, each module would invoke an AI model with
    the subject and KB context. For now, we return a simulated check
    that demonstrates the structure.
    """
    # Module-specific simulated checks
    if module_id == "brand_guardian":
        return _check_brand_guardian(subject_type, subject_ref, kb_context)
    elif module_id == "web_qc":
        return _check_web_qc(subject_type, subject_ref, kb_context)
    elif module_id == "social_best_practice":
        return _check_social_best_practice(subject_type, subject_ref, kb_context)
    elif module_id == "design_accuracy":
        return _check_design_accuracy(subject_type, subject_ref, kb_context)
    elif module_id == "content_review":
        return _check_content_review(subject_type, subject_ref, kb_context)
    elif module_id == "seo_aiseo":
        return _check_seo_aiseo(subject_type, subject_ref, kb_context)
    elif module_id == "website_health":
        return _check_website_health(subject_type, subject_ref, kb_context)
    else:
        return []


def _check_brand_guardian(
    subject_type: str, subject_ref: Optional[str], kb_context: dict
) -> list[dict]:
    """Brand Guardian module — checks against brand profile."""
    issues = []
    bp = kb_context.get("brand_profile", {})

    # Check if brand profile exists
    if not bp.get("brand_tone") and not bp.get("brand_values"):
        issues.append({
            "module": "brand_guardian",
            "area": "Brand",
            "severity": "info",
            "finding": "No brand profile configured for this client. Brand checks were skipped.",
            "recommendation": "Set up a brand profile with tone, values, and do/don't lists to enable brand compliance checking.",
            "priority": "P3",
            "score_impact": 0,
            "business_impact": "low",
        })
        return issues

    # Check dont_list violations (simulated)
    if bp.get("dont_list"):
        issues.append({
            "module": "brand_guardian",
            "area": "Brand",
            "severity": "minor",
            "finding": f"Brand don't list has {len(bp['dont_list'])} rule(s) to check against. Automated verification pending AI integration.",
            "recommendation": "Review deliverable manually against the brand don't list until AI module is fully connected.",
            "priority": "P2",
            "score_impact": 3,
            "business_impact": "medium",
        })

    # Check legal sensitivities
    if bp.get("legal_sensitivities"):
        issues.append({
            "module": "brand_guardian",
            "area": "Brand",
            "severity": "info",
            "finding": "Client has legal sensitivities documented. Manual review recommended.",
            "recommendation": "Verify deliverable does not contain content that conflicts with documented legal sensitivities.",
            "priority": "P1",
            "score_impact": 0,
            "business_impact": "high",
        })

    return issues


def _check_web_qc(
    subject_type: str, subject_ref: Optional[str], kb_context: dict
) -> list[dict]:
    """Web QC module — checks web page quality."""
    issues = []

    if not subject_ref:
        issues.append({
            "module": "web_qc",
            "area": "WebQC",
            "severity": "major",
            "finding": "No URL provided for web quality check.",
            "recommendation": "Provide a valid URL in the subject_ref field.",
            "priority": "P0",
            "score_impact": 15,
            "business_impact": "high",
        })
        return issues

    # Simulated checks — in production these would be real HTTP/lighthouse checks
    issues.append({
        "module": "web_qc",
        "area": "WebPerf",
        "severity": "info",
        "finding": f"Web quality check queued for {subject_ref}. Full Lighthouse/accessibility audit pending integration.",
        "recommendation": "Connect headless browser integration for automated web performance and accessibility testing.",
        "priority": "P2",
        "score_impact": 0,
        "business_impact": "none",
    })

    return issues


def _check_social_best_practice(
    subject_type: str, subject_ref: Optional[str], kb_context: dict
) -> list[dict]:
    """Social Best Practice module — checks social post guidelines."""
    issues = []

    issues.append({
        "module": "social_best_practice",
        "area": "Social",
        "severity": "info",
        "finding": "Social best practice check queued. Platform-specific guidelines verification pending AI integration.",
        "recommendation": "Verify post meets platform character limits, hashtag best practices, and engagement hooks.",
        "priority": "P2",
        "score_impact": 0,
        "business_impact": "none",
    })

    return issues


def _check_design_accuracy(
    subject_type: str, subject_ref: Optional[str], kb_context: dict
) -> list[dict]:
    """Design Accuracy module — checks design against visual rules."""
    issues = []
    bp = kb_context.get("brand_profile", {})
    visual_rules = bp.get("visual_rules", {})

    if not visual_rules:
        issues.append({
            "module": "design_accuracy",
            "area": "Design",
            "severity": "info",
            "finding": "No visual rules configured. Design accuracy checks were limited.",
            "recommendation": "Add visual rules (color palettes, typography, logo rules) to the brand profile.",
            "priority": "P3",
            "score_impact": 0,
            "business_impact": "low",
        })
    else:
        issues.append({
            "module": "design_accuracy",
            "area": "Design",
            "severity": "info",
            "finding": f"Design accuracy check queued with {len(visual_rules)} visual rule categories. AI vision analysis pending integration.",
            "recommendation": "Connect Claude Vision integration for automated design compliance checking.",
            "priority": "P2",
            "score_impact": 0,
            "business_impact": "none",
        })

    return issues


def _check_content_review(
    subject_type: str, subject_ref: Optional[str], kb_context: dict
) -> list[dict]:
    """Content Review module — checks tone and message alignment."""
    issues = []
    bp = kb_context.get("brand_profile", {})

    if bp.get("key_messages"):
        issues.append({
            "module": "content_review",
            "area": "Brand",
            "severity": "info",
            "finding": f"Content review queued. {len(bp['key_messages'])} key messages to verify alignment against.",
            "recommendation": "Ensure deliverable content aligns with documented key messages.",
            "priority": "P2",
            "score_impact": 0,
            "business_impact": "none",
        })

    return issues


def _check_seo_aiseo(
    subject_type: str, subject_ref: Optional[str], kb_context: dict
) -> list[dict]:
    """SEO / AI SEO Audit module — Ahrefs-inspired comprehensive SEO check."""
    issues = []

    if not subject_ref:
        issues.append({
            "module": "seo_aiseo",
            "area": "WebPerf",
            "severity": "major",
            "finding": "No URL provided for SEO audit.",
            "recommendation": "Provide a valid URL to run SEO analysis.",
            "priority": "P0",
            "score_impact": 15,
            "business_impact": "high",
        })
        return issues

    # Simulated Ahrefs-style checks (in production: crawl URL, parse HTML, check meta)
    seo_checks = [
        {
            "name": "Meta Tags",
            "finding": "Meta title and description analysis queued. Checking length, keyword presence, and uniqueness.",
            "recommendation": "Ensure meta title is 50-60 chars with primary keyword, meta description is 150-160 chars with call to action.",
            "severity": "info",
        },
        {
            "name": "Heading Structure",
            "finding": "H1-H6 heading hierarchy analysis queued. Checking for single H1, proper nesting, and keyword usage.",
            "recommendation": "Use exactly one H1 per page. Maintain logical heading hierarchy (H1 > H2 > H3). Include target keywords naturally.",
            "severity": "info",
        },
        {
            "name": "Structured Data",
            "finding": "Schema.org / JSON-LD structured data check queued. Verifying Organization, BreadcrumbList, and page-specific schemas.",
            "recommendation": "Add JSON-LD structured data for Organization, BreadcrumbList, and relevant content type (Article, Product, FAQ).",
            "severity": "minor",
            "score_impact": 3,
        },
        {
            "name": "Internal Linking",
            "finding": "Internal link analysis queued. Checking anchor text diversity, link depth, and orphan pages.",
            "recommendation": "Ensure all important pages are within 3 clicks from homepage. Use descriptive anchor text. Fix orphan pages.",
            "severity": "info",
        },
        {
            "name": "AI Content Optimization",
            "finding": "AI SEO signals check queued. Analyzing content for E-E-A-T signals, originality markers, and AI-generated content patterns.",
            "recommendation": "Add author attribution, cite sources, include first-person experience, and ensure content demonstrates expertise.",
            "severity": "info",
        },
        {
            "name": "Core Web Vitals SEO",
            "finding": "Core Web Vitals SEO impact analysis queued. CWV is a ranking signal per Google 2024 standards.",
            "recommendation": "Ensure LCP < 2.5s, FID < 100ms, CLS < 0.1 for best SEO performance. Optimize images and reduce render-blocking resources.",
            "severity": "minor",
            "score_impact": 2,
        },
    ]

    for check in seo_checks:
        issues.append({
            "module": "seo_aiseo",
            "area": "WebPerf",
            "severity": check["severity"],
            "finding": f"[{check['name']}] {check['finding']}",
            "recommendation": check["recommendation"],
            "priority": "P2",
            "score_impact": check.get("score_impact", 0),
            "business_impact": "medium" if check.get("score_impact", 0) > 0 else "low",
        })

    return issues


def _check_website_health(
    subject_type: str, subject_ref: Optional[str], kb_context: dict
) -> list[dict]:
    """Website Health Check — Google PageSpeed + broken links + latest standards."""
    issues = []

    if not subject_ref:
        issues.append({
            "module": "website_health",
            "area": "WebPerf",
            "severity": "major",
            "finding": "No URL provided for website health check.",
            "recommendation": "Provide a valid URL to run health checks.",
            "priority": "P0",
            "score_impact": 15,
            "business_impact": "high",
        })
        return issues

    # Simulated Google PageSpeed / health checks
    health_checks = [
        {
            "name": "Core Web Vitals (LCP)",
            "finding": f"Largest Contentful Paint analysis queued for {subject_ref}. Google standard: < 2.5s (good), 2.5-4s (needs improvement), > 4s (poor).",
            "recommendation": "Optimize largest content element: compress images to WebP/AVIF, use responsive images with srcset, preload critical resources, and implement CDN caching.",
            "severity": "minor",
            "score_impact": 5,
        },
        {
            "name": "Core Web Vitals (INP)",
            "finding": "Interaction to Next Paint analysis queued. INP replaced FID in March 2024 as Google's responsiveness metric. Standard: < 200ms (good).",
            "recommendation": "Reduce JavaScript execution time, break up long tasks, use web workers for heavy computation, and optimize event handlers.",
            "severity": "minor",
            "score_impact": 3,
        },
        {
            "name": "Core Web Vitals (CLS)",
            "finding": "Cumulative Layout Shift analysis queued. Google standard: < 0.1 (good). Measures visual stability.",
            "recommendation": "Set explicit width/height on images and embeds, avoid inserting content above existing content, and use CSS containment.",
            "severity": "minor",
            "score_impact": 3,
        },
        {
            "name": "Broken Links",
            "finding": "Broken link scan queued. Will check all internal and external links for 404s, redirects, and timeouts.",
            "recommendation": "Fix or remove broken links. Replace permanent redirects (301) where possible. Set up link monitoring.",
            "severity": "minor",
            "score_impact": 4,
        },
        {
            "name": "Mobile-Friendliness",
            "finding": "Mobile viewport and touch target analysis queued per Google mobile-first indexing standards.",
            "recommendation": "Ensure viewport meta tag is set, touch targets are >= 48x48px with 8px spacing, text is readable without zooming.",
            "severity": "info",
        },
        {
            "name": "HTTPS & Security Headers",
            "finding": "HTTPS compliance and security header check queued. Verifying SSL certificate, HSTS, CSP, and X-Frame-Options.",
            "recommendation": "Ensure valid SSL certificate, enable HSTS with includeSubDomains, set Content-Security-Policy and X-Frame-Options headers.",
            "severity": "info",
        },
        {
            "name": "Accessibility (WCAG 2.2)",
            "finding": "Accessibility audit queued per WCAG 2.2 Level AA. Checking color contrast, alt text, ARIA labels, keyboard navigation.",
            "recommendation": "Ensure 4.5:1 color contrast ratio, add alt text to all images, use semantic HTML, and test with screen reader.",
            "severity": "minor",
            "score_impact": 3,
        },
        {
            "name": "Performance Budget",
            "finding": "Page weight analysis queued. Checking total page size, number of requests, and resource breakdown.",
            "recommendation": "Keep total page weight under 1.5MB. Minimize HTTP requests. Use lazy loading for below-fold images and iframes.",
            "severity": "info",
        },
    ]

    for check in health_checks:
        issues.append({
            "module": "website_health",
            "area": "WebPerf",
            "severity": check["severity"],
            "finding": f"[{check['name']}] {check['finding']}",
            "recommendation": check["recommendation"],
            "priority": "P1" if check.get("score_impact", 0) >= 4 else "P2",
            "score_impact": check.get("score_impact", 0),
            "business_impact": "high" if check.get("score_impact", 0) >= 4 else "medium",
        })

    return issues


# ---------------------------------------------------------------------------
# Debug Issues CRUD
# ---------------------------------------------------------------------------


async def list_issues(
    db: AsyncSession,
    *,
    client_id: Optional[UUID] = None,
    session_id: Optional[UUID] = None,
    severity: Optional[str] = None,
    resolution: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[DebugIssue], int]:
    """List debug issues with optional filters."""
    query = select(DebugIssue)
    count_query = select(func.count(DebugIssue.id))

    if client_id:
        query = query.where(DebugIssue.client_id == client_id)
        count_query = count_query.where(DebugIssue.client_id == client_id)
    if session_id:
        query = query.where(DebugIssue.debug_session_id == session_id)
        count_query = count_query.where(
            DebugIssue.debug_session_id == session_id
        )
    if severity:
        query = query.where(DebugIssue.severity == severity)
        count_query = count_query.where(DebugIssue.severity == severity)
    if resolution:
        query = query.where(DebugIssue.resolution_status == resolution)
        count_query = count_query.where(
            DebugIssue.resolution_status == resolution
        )

    total = (await db.execute(count_query)).scalar() or 0

    query = (
        query.order_by(DebugIssue.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(query)
    return list(result.scalars().all()), total


async def update_issue(
    db: AsyncSession, issue_id: UUID, data: dict
) -> DebugIssue:
    """Update a single debug issue."""
    result = await db.execute(
        select(DebugIssue).where(DebugIssue.id == issue_id)
    )
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Debug issue {issue_id} not found",
        )

    for key, value in data.items():
        if value is not None:
            setattr(issue, key, value)

    # Auto-set resolved_at if resolving
    if data.get("resolution_status") == "resolved" and not issue.resolved_at:
        issue.resolved_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(issue)
    return issue


async def bulk_update_issues(
    db: AsyncSession, issue_ids: list[UUID], data: dict
) -> int:
    """Bulk update multiple issues."""
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        return 0

    if update_data.get("resolution_status") == "resolved":
        update_data["resolved_at"] = datetime.now(timezone.utc)

    stmt = (
        update(DebugIssue)
        .where(DebugIssue.id.in_(issue_ids))
        .values(**update_data)
    )
    result = await db.execute(stmt)
    return result.rowcount


# ---------------------------------------------------------------------------
# Debug Trace
# ---------------------------------------------------------------------------


async def get_trace(
    db: AsyncSession, session_id: UUID
) -> tuple[list[DebugTraceStep], int, float]:
    """Get all trace steps for a session."""
    result = await db.execute(
        select(DebugTraceStep)
        .where(DebugTraceStep.debug_session_id == session_id)
        .order_by(DebugTraceStep.started_at)
    )
    steps = list(result.scalars().all())

    total_latency = sum(s.latency_ms or 0 for s in steps)
    total_cost = sum(float(s.cost_estimate or 0) for s in steps)

    return steps, total_latency, total_cost


# ---------------------------------------------------------------------------
# Debug Stats
# ---------------------------------------------------------------------------


async def get_stats(
    db: AsyncSession,
    *,
    client_id: Optional[UUID] = None,
) -> dict:
    """Compute aggregate debug statistics."""
    base_filter = []
    if client_id:
        base_filter.append(DebugSession.client_id == client_id)

    # Session counts
    total_q = select(func.count(DebugSession.id)).where(*base_filter)
    total = (await db.execute(total_q)).scalar() or 0

    pass_q = select(func.count(DebugSession.id)).where(
        DebugSession.overall_status == "pass", *base_filter
    )
    pass_count = (await db.execute(pass_q)).scalar() or 0

    warn_q = select(func.count(DebugSession.id)).where(
        DebugSession.overall_status == "warning", *base_filter
    )
    warning_count = (await db.execute(warn_q)).scalar() or 0

    fail_q = select(func.count(DebugSession.id)).where(
        DebugSession.overall_status == "fail", *base_filter
    )
    fail_count = (await db.execute(fail_q)).scalar() or 0

    avg_q = select(func.avg(DebugSession.overall_score)).where(
        DebugSession.overall_score.is_not(None), *base_filter
    )
    avg_score = (await db.execute(avg_q)).scalar()

    # Issue counts
    issue_base = []
    if client_id:
        issue_base.append(DebugIssue.client_id == client_id)

    total_issues_q = select(func.count(DebugIssue.id)).where(*issue_base)
    total_issues = (await db.execute(total_issues_q)).scalar() or 0

    open_issues_q = select(func.count(DebugIssue.id)).where(
        DebugIssue.resolution_status == "open", *issue_base
    )
    open_issues = (await db.execute(open_issues_q)).scalar() or 0

    critical_open_q = select(func.count(DebugIssue.id)).where(
        DebugIssue.resolution_status == "open",
        DebugIssue.severity == "critical",
        *issue_base,
    )
    critical_open = (await db.execute(critical_open_q)).scalar() or 0

    return {
        "total_sessions": total,
        "pass_count": pass_count,
        "warning_count": warning_count,
        "fail_count": fail_count,
        "total_issues": total_issues,
        "open_issues": open_issues,
        "critical_open": critical_open,
        "avg_score": round(float(avg_score), 1) if avg_score else None,
        "sessions_by_module": {},
        "issues_by_severity": {},
    }
