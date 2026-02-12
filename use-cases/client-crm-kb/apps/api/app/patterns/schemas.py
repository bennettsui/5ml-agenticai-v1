"""
Pydantic v2 schemas for Pattern CRUD operations.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PatternCreate(BaseModel):
    scope: str = Field(..., pattern="^(global|segment|client)$")
    client_id: Optional[UUID] = None
    segment_tags: Optional[list[str]] = None
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    category: str = Field(
        ..., pattern="^(error_pattern|best_practice|playbook|standard)$"
    )
    trigger_conditions: Optional[str] = None
    recommended_actions: Optional[list[str]] = None
    example_cases: Optional[dict] = None
    applicable_channels: Optional[list[str]] = None


class PatternUpdate(BaseModel):
    scope: Optional[str] = Field(
        default=None, pattern="^(global|segment|client)$"
    )
    client_id: Optional[UUID] = None
    segment_tags: Optional[list[str]] = None
    name: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = Field(
        default=None,
        pattern="^(error_pattern|best_practice|playbook|standard)$",
    )
    trigger_conditions: Optional[str] = None
    recommended_actions: Optional[list[str]] = None
    example_cases: Optional[dict] = None
    applicable_channels: Optional[list[str]] = None


class PatternResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    scope: str
    client_id: Optional[UUID] = None
    segment_tags: Optional[list[str]] = None
    name: str
    description: str
    category: str
    trigger_conditions: Optional[str] = None
    recommended_actions: Optional[list[str]] = None
    example_cases: Optional[dict] = None
    applicable_channels: Optional[list[str]] = None
    usage_count: int
    effectiveness_score: Optional[Decimal] = None
    last_used_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class PromoteRequest(BaseModel):
    target_scope: str = Field(..., pattern="^(global|segment)$")
    segment_tags: Optional[list[str]] = None


class PatternSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    scope: str
    name: str
    description: str
    category: str
    applicable_channels: Optional[list[str]] = None
    usage_count: int
    effectiveness_score: Optional[Decimal] = None
