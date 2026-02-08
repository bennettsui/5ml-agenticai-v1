"""Pydantic v2 schemas for the contacts module."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    role: Optional[str] = Field(None, max_length=150)
    email: Optional[str] = Field(None, max_length=320)
    phone: Optional[str] = Field(None, max_length=50)
    preferred_channel: Optional[str] = Field(
        None, pattern="^(email|phone|chat|in_person)$"
    )
    decision_power: Optional[int] = Field(None, ge=0, le=3)
    is_primary: Optional[bool] = False
    notes: Optional[str] = None


class ContactUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    role: Optional[str] = Field(None, max_length=150)
    email: Optional[str] = Field(None, max_length=320)
    phone: Optional[str] = Field(None, max_length=50)
    preferred_channel: Optional[str] = Field(
        None, pattern="^(email|phone|chat|in_person)$"
    )
    decision_power: Optional[int] = Field(None, ge=0, le=3)
    is_primary: Optional[bool] = None
    notes: Optional[str] = None


class ContactResponse(BaseModel):
    id: UUID
    client_id: UUID
    name: str
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    preferred_channel: Optional[str] = None
    decision_power: Optional[int] = None
    is_primary: bool
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
