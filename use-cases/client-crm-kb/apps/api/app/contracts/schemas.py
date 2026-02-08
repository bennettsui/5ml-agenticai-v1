"""Pydantic v2 schemas for the contracts module."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ContractCreate(BaseModel):
    type: str = Field(
        ..., pattern="^(retainer|project|license|other)$"
    )
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    value: Optional[Decimal] = Field(None, ge=0)
    currency: str = Field("HKD", max_length=3)
    status: Optional[str] = Field(
        None, pattern="^(draft|active|expired|terminated)$"
    )
    document_ref: Optional[str] = Field(None, max_length=500)


class ContractUpdate(BaseModel):
    type: Optional[str] = Field(
        None, pattern="^(retainer|project|license|other)$"
    )
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    value: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    status: Optional[str] = Field(
        None, pattern="^(draft|active|expired|terminated)$"
    )
    document_ref: Optional[str] = Field(None, max_length=500)


class ContractResponse(BaseModel):
    id: UUID
    client_id: UUID
    type: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    value: Optional[Decimal] = None
    currency: str
    status: str
    document_ref: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
