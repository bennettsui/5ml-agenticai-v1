"""
Pydantic v2 schemas for ClientRule CRUD operations.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RuleCreate(BaseModel):
    description: str = Field(..., min_length=1)
    rule_type: str = Field(..., pattern="^(hard|soft)$")
    applies_to: Optional[list[str]] = None
    validation_type: Optional[str] = None
    validation_pattern: Optional[str] = None
    priority: int = Field(default=3, ge=1, le=5)
    origin_feedback_ids: Optional[list[UUID]] = None


class RuleUpdate(BaseModel):
    description: Optional[str] = None
    rule_type: Optional[str] = Field(default=None, pattern="^(hard|soft)$")
    applies_to: Optional[list[str]] = None
    validation_type: Optional[str] = None
    validation_pattern: Optional[str] = None
    priority: Optional[int] = Field(default=None, ge=1, le=5)


class RuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    origin_feedback_ids: Optional[list[UUID]] = None
    description: str
    rule_type: str
    applies_to: Optional[list[str]] = None
    validation_type: Optional[str] = None
    validation_pattern: Optional[str] = None
    priority: int
    status: str
    deprecated_reason: Optional[str] = None
    deprecated_at: Optional[datetime] = None
    usage_count: int
    last_used_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class DeprecateRequest(BaseModel):
    reason: str = Field(..., min_length=1)


class RuleUsageStats(BaseModel):
    rule_id: UUID
    usage_count: int
    last_used_at: Optional[datetime] = None
    status: str
    created_at: datetime
    days_since_creation: int
    days_since_last_use: Optional[int] = None
