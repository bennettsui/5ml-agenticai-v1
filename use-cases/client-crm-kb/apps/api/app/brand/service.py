"""
Business logic for BrandProfile and TasteExample management,
including AI-powered extraction from brand documents.
"""

from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BrandProfile, Client, TasteExample
from app.utils.ai import extract_json

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _get_client_or_404(db: AsyncSession, client_id: UUID) -> Client:
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalars().first()
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client {client_id} not found.",
        )
    return client


# ---------------------------------------------------------------------------
# BrandProfile CRUD
# ---------------------------------------------------------------------------


async def create_brand_profile(
    db: AsyncSession,
    client_id: UUID,
    data: dict,
) -> BrandProfile:
    await _get_client_or_404(db, client_id)
    # Check uniqueness
    existing = await db.execute(
        select(BrandProfile).where(BrandProfile.client_id == client_id)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Brand profile already exists for this client.",
        )
    profile = BrandProfile(client_id=client_id, **data)
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return profile


async def get_brand_profile(
    db: AsyncSession, client_id: UUID
) -> BrandProfile:
    await _get_client_or_404(db, client_id)
    result = await db.execute(
        select(BrandProfile).where(BrandProfile.client_id == client_id)
    )
    profile = result.scalars().first()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand profile not found for this client.",
        )
    return profile


async def update_brand_profile(
    db: AsyncSession,
    client_id: UUID,
    data: dict,
) -> BrandProfile:
    profile = await get_brand_profile(db, client_id)
    for field, value in data.items():
        if value is not None:
            setattr(profile, field, value)
    profile.version = profile.version + 1
    await db.flush()
    await db.refresh(profile)
    return profile


# ---------------------------------------------------------------------------
# AI Extraction
# ---------------------------------------------------------------------------


_EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "brand_tone": {
            "type": "string",
            "description": "Overall brand tone description",
        },
        "brand_values": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Core brand values",
        },
        "key_messages": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Key brand messages",
        },
        "do_list": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Things the brand should do",
        },
        "dont_list": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Things the brand should avoid",
        },
        "legal_sensitivities": {
            "type": "string",
            "description": "Legal or regulatory sensitivities",
        },
    },
    "required": [
        "brand_tone",
        "brand_values",
        "key_messages",
        "do_list",
        "dont_list",
    ],
}


async def extract_brand_from_documents(
    db: AsyncSession,
    client_id: UUID,
    document_refs: list[str],
) -> dict:
    """Use Claude to extract brand guidelines from uploaded documents.

    In a production system, the document_refs would be fetched from R2 and
    their text content passed to the AI.  Here we pass the refs as context
    placeholders and let Claude generate structured output.
    """
    await _get_client_or_404(db, client_id)

    docs_list = "\n".join(f"- {ref}" for ref in document_refs)
    user_msg = (
        "Extract brand guidelines from the following documents:\n\n"
        f"{docs_list}\n\n"
        "Analyze these documents and extract the brand tone, values, "
        "key messages, do/don't lists, and any legal sensitivities."
    )

    result = await extract_json(
        system=(
            "You are a brand analyst. Extract structured brand guidelines "
            "from the provided documents. Return the data using the "
            "structured_output tool."
        ),
        user_message=user_msg,
        json_schema=_EXTRACTION_SCHEMA,
    )
    return result


# ---------------------------------------------------------------------------
# TasteExample CRUD
# ---------------------------------------------------------------------------


async def create_taste_example(
    db: AsyncSession,
    client_id: UUID,
    data: dict,
    added_by: Optional[UUID] = None,
) -> TasteExample:
    await _get_client_or_404(db, client_id)
    example = TasteExample(client_id=client_id, added_by=added_by, **data)
    db.add(example)
    await db.flush()
    await db.refresh(example)
    return example


async def list_taste_examples(
    db: AsyncSession,
    client_id: UUID,
    category: Optional[str] = None,
    type_filter: Optional[str] = None,
) -> list[TasteExample]:
    await _get_client_or_404(db, client_id)
    stmt = select(TasteExample).where(TasteExample.client_id == client_id)
    if category:
        stmt = stmt.where(TasteExample.category == category)
    if type_filter:
        stmt = stmt.where(TasteExample.type == type_filter)
    stmt = stmt.order_by(TasteExample.added_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_taste_example(
    db: AsyncSession, example_id: UUID
) -> TasteExample:
    result = await db.execute(
        select(TasteExample).where(TasteExample.id == example_id)
    )
    example = result.scalars().first()
    if example is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Taste example {example_id} not found.",
        )
    return example


async def update_taste_example(
    db: AsyncSession,
    example_id: UUID,
    data: dict,
) -> TasteExample:
    example = await get_taste_example(db, example_id)
    for field, value in data.items():
        if value is not None:
            setattr(example, field, value)
    await db.flush()
    await db.refresh(example)
    return example


async def delete_taste_example(
    db: AsyncSession, example_id: UUID
) -> None:
    example = await get_taste_example(db, example_id)
    await db.delete(example)
    await db.flush()
