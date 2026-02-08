"""Pydantic v2 schemas for the opportunities module."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class OpportunityCreate(BaseModel):
    client_id: UUID
    description: Optional[str] = None
    stage: Optional[str] = Field(
        None,
        pattern="^(prospecting|qualification|proposal|negotiation|closed_won|closed_lost)$",
    )
    estimated_value: Optional[Decimal] = Field(None, ge=0)
    currency: str = Field("HKD", max_length=3)
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[date] = None
    owner_id: Optional[UUID] = None


class OpportunityUpdate(BaseModel):
    description: Optional[str] = None
    stage: Optional[str] = Field(
        None,
        pattern="^(prospecting|qualification|proposal|negotiation|closed_won|closed_lost)$",
    )
    estimated_value: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[date] = None
    owner_id: Optional[UUID] = None


class OpportunityResponse(BaseModel):
    id: UUID
    client_id: UUID
    description: Optional[str] = None
    stage: str
    estimated_value: Optional[Decimal] = None
    currency: str
    probability: Optional[int] = None
    expected_close_date: Optional[date] = None
    owner_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PipelineStageSummary(BaseModel):
    stage: str
    count: int
    total_value: Decimal


class PipelineSummaryResponse(BaseModel):
    stages: list[PipelineStageSummary]
    total_opportunities: int
    total_pipeline_value: Decimal
