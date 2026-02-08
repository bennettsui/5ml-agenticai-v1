"""Pydantic v2 schemas for the clients module."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


# ---------------------------------------------------------------------------
# Client schemas
# ---------------------------------------------------------------------------


class ClientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=300)
    legal_name: Optional[str] = Field(None, max_length=300)
    industry: list[str] = Field(default_factory=list)
    region: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    status: Optional[str] = Field(None, pattern="^(active|dormant|prospect|lost)$")
    timezone: Optional[str] = Field(None, max_length=50)
    website_url: Optional[str] = Field(None, max_length=500)
    company_size: Optional[str] = Field(None, max_length=50)
    parent_company: Optional[str] = Field(None, max_length=300)
    internal_notes: Optional[str] = None
    client_value_tier: Optional[str] = Field(None, pattern="^(A|B|C|D)$")


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=300)
    legal_name: Optional[str] = Field(None, max_length=300)
    industry: Optional[list[str]] = None
    region: Optional[list[str]] = None
    languages: Optional[list[str]] = None
    status: Optional[str] = Field(None, pattern="^(active|dormant|prospect|lost)$")
    timezone: Optional[str] = Field(None, max_length=50)
    website_url: Optional[str] = Field(None, max_length=500)
    company_size: Optional[str] = Field(None, max_length=50)
    parent_company: Optional[str] = Field(None, max_length=300)
    internal_notes: Optional[str] = None
    client_value_tier: Optional[str] = Field(None, pattern="^(A|B|C|D)$")


class ClientResponse(BaseModel):
    id: UUID
    name: str
    legal_name: Optional[str] = None
    industry: Optional[list[str]] = None
    region: Optional[list[str]] = None
    languages: Optional[list[str]] = None
    status: str
    timezone: Optional[str] = None
    website_url: Optional[str] = None
    company_size: Optional[str] = None
    parent_company: Optional[str] = None
    internal_notes: Optional[str] = None
    client_value_tier: Optional[str] = None
    health_score: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ClientListResponse(BaseModel):
    items: list[ClientResponse]
    total: int
    page: int
    limit: int


class ClientOverview(BaseModel):
    client: ClientResponse
    recent_feedback_count: int = 0
    active_projects_count: int = 0
    active_rules_count: int = 0
    contacts_count: int = 0


# ---------------------------------------------------------------------------
# Client Risk schemas
# ---------------------------------------------------------------------------


class ClientRiskCreate(BaseModel):
    risk_type: str = Field(
        ...,
        pattern="^(churn|payment|satisfaction|competitive|operational|legal|other)$",
    )
    severity: str = Field(..., pattern="^(low|medium|high)$")
    description: Optional[str] = None


class ClientRiskUpdate(BaseModel):
    risk_type: Optional[str] = Field(
        None,
        pattern="^(churn|payment|satisfaction|competitive|operational|legal|other)$",
    )
    severity: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    description: Optional[str] = None


class ClientRiskResponse(BaseModel):
    id: UUID
    client_id: UUID
    risk_type: str
    severity: str
    description: Optional[str] = None
    marked_by: Optional[UUID] = None
    marked_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Health Score schemas
# ---------------------------------------------------------------------------


class HealthScoreResponse(BaseModel):
    client_id: UUID
    health_score: int


class HealthHistoryEntry(BaseModel):
    id: UUID
    score: int
    factors: Optional[dict[str, Any]] = None
    recorded_at: datetime

    model_config = {"from_attributes": True}


class HealthHistoryResponse(BaseModel):
    client_id: UUID
    history: list[HealthHistoryEntry]
