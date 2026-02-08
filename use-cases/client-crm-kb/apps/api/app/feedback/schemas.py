"""
Pydantic v2 schemas for FeedbackEvent CRUD, analysis results, and rule suggestions.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# FeedbackEvent CRUD
# ---------------------------------------------------------------------------


class FeedbackCreate(BaseModel):
    client_id: UUID
    project_id: Optional[UUID] = None
    source: str = Field(
        ...,
        pattern="^(email|meeting_notes|form|chat|phone|other)$",
    )
    date: date
    raw_text: str = Field(..., min_length=1)
    attachments: Optional[list[str]] = None


class FeedbackUpdate(BaseModel):
    source: Optional[str] = Field(
        default=None,
        pattern="^(email|meeting_notes|form|chat|phone|other)$",
    )
    date: Optional[date] = None
    raw_text: Optional[str] = None
    attachments: Optional[list[str]] = None
    processing_notes: Optional[str] = None


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    project_id: Optional[UUID] = None
    source: str
    date: date
    raw_text: str
    attachments: Optional[list[str]] = None
    sentiment: Optional[str] = None
    sentiment_score: Optional[int] = None
    topics: Optional[list[str]] = None
    severity: Optional[str] = None
    extracted_requirements: Optional[dict] = None
    status: str
    processed_by: Optional[UUID] = None
    processed_at: Optional[datetime] = None
    processing_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class FeedbackListResponse(BaseModel):
    items: list[FeedbackResponse]
    total: int
    page: int
    limit: int


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------


class AnalysisResult(BaseModel):
    sentiment: str
    sentiment_score: int = Field(ge=-100, le=100)
    topics: list[str]
    severity: str
    extracted_requirements: dict


class AnalysisResponse(BaseModel):
    feedback_id: UUID
    analysis: AnalysisResult


# ---------------------------------------------------------------------------
# Rule Suggestions
# ---------------------------------------------------------------------------


class RuleSuggestion(BaseModel):
    description: str
    rule_type: str = Field(pattern="^(hard|soft)$")
    applies_to: Optional[list[str]] = None
    priority: int = Field(ge=1, le=5, default=3)
    reasoning: str


class RuleSuggestionsResponse(BaseModel):
    feedback_id: UUID
    suggestions: list[RuleSuggestion]


# ---------------------------------------------------------------------------
# Mark Processed
# ---------------------------------------------------------------------------


class MarkProcessedRequest(BaseModel):
    processing_notes: Optional[str] = None
