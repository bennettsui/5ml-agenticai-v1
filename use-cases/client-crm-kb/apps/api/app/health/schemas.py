"""
Pydantic v2 schemas for Health Score responses.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HealthScoreResponse(BaseModel):
    client_id: UUID
    health_score: int = Field(ge=0, le=100)
    factors: Optional[dict] = None
    recorded_at: datetime


class HealthHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    score: int
    factors: Optional[dict] = None
    recorded_at: datetime


class HealthHistoryResponse(BaseModel):
    client_id: UUID
    current_score: int
    history: list[HealthHistoryItem]
