"""
FastAPI router for Debug Session, Issue, Trace, and Module endpoints.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.debug.schemas import (
    DebugIssueBulkUpdate,
    DebugIssueListResponse,
    DebugIssueResponse,
    DebugIssueUpdate,
    DebugModuleResponse,
    DebugSessionCreate,
    DebugSessionDetailResponse,
    DebugSessionListResponse,
    DebugSessionResponse,
    DebugSessionUpdate,
    DebugStatsResponse,
    DebugTraceResponse,
    DebugTraceStepResponse,
)
from app.debug.service import (
    bulk_update_issues,
    create_session,
    get_session,
    get_stats,
    get_trace,
    list_issues,
    list_modules,
    list_sessions,
    run_debug_session,
    update_issue,
    update_session_status,
)
from app.dependencies import get_current_user
from app.models import User

router = APIRouter(tags=["debug"])


# ---------------------------------------------------------------------------
# Debug Modules
# ---------------------------------------------------------------------------


@router.get(
    "/api/debug/modules",
    response_model=list[DebugModuleResponse],
)
async def list_debug_modules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    modules = await list_modules(db)
    return [DebugModuleResponse.model_validate(m) for m in modules]


# ---------------------------------------------------------------------------
# Debug Sessions
# ---------------------------------------------------------------------------


@router.post(
    "/api/debug/sessions",
    response_model=DebugSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_debug_session(
    body: DebugSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await create_session(db, body.model_dump(), user_id=current_user.id)
    return DebugSessionResponse.model_validate(session)


@router.get(
    "/api/debug/sessions",
    response_model=DebugSessionListResponse,
)
async def list_debug_sessions(
    client_id: Optional[UUID] = Query(default=None),
    project_id: Optional[UUID] = Query(default=None),
    status_filter: Optional[str] = Query(
        default=None,
        alias="status",
        pattern="^(open|in_review|addressed|ignored|archived)$",
    ),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = await list_sessions(
        db,
        client_id=client_id,
        project_id=project_id,
        session_status=status_filter,
        page=page,
        limit=limit,
    )
    return DebugSessionListResponse(
        items=[DebugSessionResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        limit=limit,
    )


@router.get(
    "/api/debug/sessions/{session_id}",
    response_model=DebugSessionDetailResponse,
)
async def get_debug_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await get_session(db, session_id)
    resp = DebugSessionDetailResponse.model_validate(session)
    resp.issues = [DebugIssueResponse.model_validate(i) for i in session.issues]
    resp.issue_count = len(session.issues)
    resp.critical_count = sum(
        1 for i in session.issues if i.severity == "critical"
    )
    resp.major_count = sum(
        1 for i in session.issues if i.severity == "major"
    )
    return resp


@router.patch(
    "/api/debug/sessions/{session_id}",
    response_model=DebugSessionResponse,
)
async def update_debug_session(
    session_id: UUID,
    body: DebugSessionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await update_session_status(
        db, session_id, body.model_dump(exclude_unset=True)
    )
    return DebugSessionResponse.model_validate(session)


@router.post(
    "/api/debug/sessions/{session_id}/run",
    response_model=DebugSessionDetailResponse,
)
async def run_debug_session_endpoint(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await run_debug_session(db, session_id)
    resp = DebugSessionDetailResponse.model_validate(session)
    resp.issues = [DebugIssueResponse.model_validate(i) for i in session.issues]
    resp.issue_count = len(session.issues)
    resp.critical_count = sum(
        1 for i in session.issues if i.severity == "critical"
    )
    resp.major_count = sum(
        1 for i in session.issues if i.severity == "major"
    )
    return resp


# ---------------------------------------------------------------------------
# Debug Issues
# ---------------------------------------------------------------------------


@router.get(
    "/api/debug/issues",
    response_model=DebugIssueListResponse,
)
async def list_debug_issues(
    client_id: Optional[UUID] = Query(default=None),
    session_id: Optional[UUID] = Query(default=None),
    severity: Optional[str] = Query(
        default=None, pattern="^(critical|major|minor|info)$"
    ),
    resolution: Optional[str] = Query(
        default=None,
        pattern="^(open|in_progress|resolved|accepted_risk|wont_fix|duplicate)$",
    ),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = await list_issues(
        db,
        client_id=client_id,
        session_id=session_id,
        severity=severity,
        resolution=resolution,
        page=page,
        limit=limit,
    )
    return DebugIssueListResponse(
        items=[DebugIssueResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        limit=limit,
    )


@router.patch(
    "/api/debug/issues/{issue_id}",
    response_model=DebugIssueResponse,
)
async def update_debug_issue(
    issue_id: UUID,
    body: DebugIssueUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = await update_issue(db, issue_id, body.model_dump(exclude_unset=True))
    return DebugIssueResponse.model_validate(issue)


@router.patch(
    "/api/debug/issues/bulk",
    status_code=status.HTTP_200_OK,
)
async def bulk_update_debug_issues(
    body: DebugIssueBulkUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = body.model_dump(exclude={"issue_ids"}, exclude_unset=True)
    count = await bulk_update_issues(db, body.issue_ids, data)
    return {"updated": count}


# ---------------------------------------------------------------------------
# Debug Trace
# ---------------------------------------------------------------------------


@router.get(
    "/api/debug/sessions/{session_id}/trace",
    response_model=DebugTraceResponse,
)
async def get_debug_trace(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    steps, total_latency, total_cost = await get_trace(db, session_id)
    return DebugTraceResponse(
        session_id=session_id,
        steps=[DebugTraceStepResponse.model_validate(s) for s in steps],
        total_steps=len(steps),
        total_latency_ms=total_latency,
        total_cost=total_cost,
    )


# ---------------------------------------------------------------------------
# Debug Stats
# ---------------------------------------------------------------------------


@router.get(
    "/api/debug/stats",
    response_model=DebugStatsResponse,
)
async def get_debug_stats(
    client_id: Optional[UUID] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stats = await get_stats(db, client_id=client_id)
    return DebugStatsResponse(**stats)
