"""Pydantic v2 schemas for the projects module."""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Project schemas
# ---------------------------------------------------------------------------


class ProjectCreate(BaseModel):
    client_id: UUID
    name: str = Field(..., min_length=1, max_length=300)
    type: str = Field(
        ...,
        pattern="^(website|social_campaign|rebrand|video_series|content_production|other)$",
    )
    brief: Optional[str] = None
    brief_documents: Optional[list[str]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = Field(
        None,
        pattern="^(planning|in_progress|on_hold|completed|cancelled)$",
    )
    success_flag: Optional[str] = Field(
        None, pattern="^(success|failure|neutral)$"
    )
    success_notes: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=300)
    type: Optional[str] = Field(
        None,
        pattern="^(website|social_campaign|rebrand|video_series|content_production|other)$",
    )
    brief: Optional[str] = None
    brief_documents: Optional[list[str]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = Field(
        None,
        pattern="^(planning|in_progress|on_hold|completed|cancelled)$",
    )
    success_flag: Optional[str] = Field(
        None, pattern="^(success|failure|neutral)$"
    )
    success_notes: Optional[str] = None


class ProjectResponse(BaseModel):
    id: UUID
    client_id: UUID
    name: str
    type: str
    brief: Optional[str] = None
    brief_documents: Optional[list[str]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str
    success_flag: Optional[str] = None
    success_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Project Deliverable schemas
# ---------------------------------------------------------------------------


class DeliverableCreate(BaseModel):
    type: str = Field(
        ...,
        pattern="^(web_page|KV|video|social_post|report|other)$",
    )
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = Field(
        None,
        pattern="^(not_started|in_progress|review|completed)$",
    )
    file_refs: Optional[list[str]] = None


class DeliverableUpdate(BaseModel):
    type: Optional[str] = Field(
        None,
        pattern="^(web_page|KV|video|social_post|report|other)$",
    )
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = Field(
        None,
        pattern="^(not_started|in_progress|review|completed)$",
    )
    file_refs: Optional[list[str]] = None


class DeliverableResponse(BaseModel):
    id: UUID
    project_id: UUID
    type: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: str
    file_refs: Optional[list[str]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Project Milestone schemas
# ---------------------------------------------------------------------------


class MilestoneCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=300)
    due_date: Optional[date] = None
    status: Optional[str] = Field(
        None, pattern="^(upcoming|completed|delayed)$"
    )
    notes: Optional[str] = None


class MilestoneUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=300)
    due_date: Optional[date] = None
    status: Optional[str] = Field(
        None, pattern="^(upcoming|completed|delayed)$"
    )
    notes: Optional[str] = None


class MilestoneResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    due_date: Optional[date] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Project Team schemas
# ---------------------------------------------------------------------------


class ProjectTeamCreate(BaseModel):
    user_id: UUID
    role: str = Field(
        ...,
        pattern="^(AE|PM|designer|developer|copywriter|strategist|other)$",
    )
    allocation: Optional[int] = Field(None, ge=0, le=100)


class ProjectTeamResponse(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    role: str
    allocation: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
