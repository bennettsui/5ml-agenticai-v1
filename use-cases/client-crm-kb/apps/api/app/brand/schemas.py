"""
Pydantic v2 schemas for BrandProfile and TasteExample CRUD operations.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# BrandProfile
# ---------------------------------------------------------------------------


class BrandProfileCreate(BaseModel):
    brand_tone: Optional[str] = None
    brand_values: Optional[list[str]] = None
    key_messages: Optional[list[str]] = None
    do_list: Optional[list[str]] = None
    dont_list: Optional[list[str]] = None
    legal_sensitivities: Optional[str] = None
    visual_rules: Optional[dict] = None
    documents: Optional[list[str]] = None
    status: str = Field(default="draft", pattern="^(draft|active|archived)$")


class BrandProfileUpdate(BaseModel):
    brand_tone: Optional[str] = None
    brand_values: Optional[list[str]] = None
    key_messages: Optional[list[str]] = None
    do_list: Optional[list[str]] = None
    dont_list: Optional[list[str]] = None
    legal_sensitivities: Optional[str] = None
    visual_rules: Optional[dict] = None
    documents: Optional[list[str]] = None
    status: Optional[str] = Field(
        default=None, pattern="^(draft|active|archived)$"
    )


class BrandProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    brand_tone: Optional[str] = None
    brand_values: Optional[list[str]] = None
    key_messages: Optional[list[str]] = None
    do_list: Optional[list[str]] = None
    dont_list: Optional[list[str]] = None
    legal_sensitivities: Optional[str] = None
    visual_rules: Optional[dict] = None
    documents: Optional[list[str]] = None
    version: int
    status: str
    created_at: datetime
    updated_at: datetime


class BrandExtractionRequest(BaseModel):
    """Body for the AI extraction endpoint."""
    document_refs: list[str] = Field(
        ..., min_length=1, description="List of document keys/URLs to extract from."
    )


class BrandExtractionResponse(BaseModel):
    brand_tone: Optional[str] = None
    brand_values: Optional[list[str]] = None
    key_messages: Optional[list[str]] = None
    do_list: Optional[list[str]] = None
    dont_list: Optional[list[str]] = None
    legal_sensitivities: Optional[str] = None


# ---------------------------------------------------------------------------
# TasteExample
# ---------------------------------------------------------------------------


class TasteExampleCreate(BaseModel):
    type: str = Field(
        ..., pattern="^(campaign|KV|video|social_post|website|copy)$"
    )
    category: str = Field(..., pattern="^(likes|dislikes)$")
    media_ref: Optional[str] = None
    description: Optional[str] = None
    why_client_likes_or_dislikes: Optional[str] = None
    tags: Optional[list[str]] = None


class TasteExampleUpdate(BaseModel):
    type: Optional[str] = Field(
        default=None, pattern="^(campaign|KV|video|social_post|website|copy)$"
    )
    category: Optional[str] = Field(default=None, pattern="^(likes|dislikes)$")
    media_ref: Optional[str] = None
    description: Optional[str] = None
    why_client_likes_or_dislikes: Optional[str] = None
    tags: Optional[list[str]] = None


class TasteExampleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    type: str
    category: str
    media_ref: Optional[str] = None
    description: Optional[str] = None
    why_client_likes_or_dislikes: Optional[str] = None
    tags: Optional[list[str]] = None
    added_by: Optional[UUID] = None
    added_at: datetime
