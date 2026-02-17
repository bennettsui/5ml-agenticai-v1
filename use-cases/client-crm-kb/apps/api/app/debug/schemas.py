"""
Pydantic v2 schemas for Debug Session, Issue, and Trace CRUD operations.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Debug Session
# ---------------------------------------------------------------------------


class DebugSessionCreate(BaseModel):
    project_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    subject_type: str = Field(
        ...,
        pattern="^(web_page|design|video|social_post|agent_workflow|document|other)$",
    )
    subject_ref: Optional[str] = None
    module_ids: list[str] = Field(
        ..., min_length=1, description="IDs of debug modules to run"
    )
    trace_enabled: bool = False


class DebugSessionUpdate(BaseModel):
    status: Optional[str] = Field(
        default=None,
        pattern="^(open|in_review|addressed|ignored|archived)$",
    )
    status_notes: Optional[str] = None


class DebugSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    client_id: UUID
    subject_type: str
    subject_ref: Optional[str] = None
    modules_invoked: Optional[list] = None
    overall_score: Optional[int] = None
    overall_status: Optional[str] = None
    overall_summary: Optional[str] = None
    kb_entries_used: Optional[list] = None
    status: str
    status_notes: Optional[str] = None
    initiated_by: Optional[UUID] = None
    report_ref: Optional[str] = None
    trace_enabled: bool = False
    created_at: datetime
    updated_at: datetime
    issue_count: Optional[int] = None
    critical_count: Optional[int] = None
    major_count: Optional[int] = None


class DebugSessionListResponse(BaseModel):
    items: list[DebugSessionResponse]
    total: int
    page: int
    limit: int


class DebugSessionDetailResponse(DebugSessionResponse):
    issues: list["DebugIssueResponse"] = []


# ---------------------------------------------------------------------------
# Debug Issue
# ---------------------------------------------------------------------------


class DebugIssueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    debug_session_id: UUID
    client_id: UUID
    project_id: UUID
    module: str
    area: str
    severity: str
    finding: str
    evidence: Optional[dict] = None
    recommendation: Optional[str] = None
    priority: str
    related_rule_ids: Optional[list[UUID]] = None
    related_pattern_ids: Optional[list[UUID]] = None
    score_impact: int = 0
    business_impact: Optional[str] = None
    user_impact: Optional[str] = None
    resolution_status: str
    assigned_to: Optional[UUID] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class DebugIssueUpdate(BaseModel):
    resolution_status: Optional[str] = Field(
        default=None,
        pattern="^(open|in_progress|resolved|accepted_risk|wont_fix|duplicate)$",
    )
    assigned_to: Optional[UUID] = None
    resolution_notes: Optional[str] = None
    priority: Optional[str] = Field(
        default=None, pattern="^(P0|P1|P2|P3)$"
    )


class DebugIssueBulkUpdate(BaseModel):
    issue_ids: list[UUID] = Field(..., min_length=1)
    resolution_status: Optional[str] = Field(
        default=None,
        pattern="^(open|in_progress|resolved|accepted_risk|wont_fix|duplicate)$",
    )
    assigned_to: Optional[UUID] = None
    priority: Optional[str] = Field(
        default=None, pattern="^(P0|P1|P2|P3)$"
    )


class DebugIssueListResponse(BaseModel):
    items: list[DebugIssueResponse]
    total: int
    page: int
    limit: int


# ---------------------------------------------------------------------------
# Debug Trace
# ---------------------------------------------------------------------------


class DebugTraceStepResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    debug_session_id: UUID
    parent_step_id: Optional[UUID] = None
    type: str
    name: str
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    model: Optional[str] = None
    token_usage: Optional[dict] = None
    cost_estimate: Optional[float] = None
    tool_name: Optional[str] = None
    error_flag: bool = False
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    latency_ms: Optional[int] = None
    started_at: datetime


class DebugTraceResponse(BaseModel):
    session_id: UUID
    steps: list[DebugTraceStepResponse]
    total_steps: int
    total_latency_ms: int
    total_cost: float


# ---------------------------------------------------------------------------
# Debug Module
# ---------------------------------------------------------------------------


class DebugModuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    applicable_subject_types: Optional[list[str]] = None
    version: str
    status: str


# ---------------------------------------------------------------------------
# Debug Stats
# ---------------------------------------------------------------------------


class DebugStatsResponse(BaseModel):
    total_sessions: int
    pass_count: int
    warning_count: int
    fail_count: int
    total_issues: int
    open_issues: int
    critical_open: int
    avg_score: Optional[float] = None
    sessions_by_module: dict[str, int] = {}
    issues_by_severity: dict[str, int] = {}
