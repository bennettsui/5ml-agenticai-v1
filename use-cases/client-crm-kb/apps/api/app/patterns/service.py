"""
Business logic for Pattern CRUD operations and pattern promotion.
"""

from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Client, Pattern

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _get_pattern_or_404(db: AsyncSession, pattern_id: UUID) -> Pattern:
    result = await db.execute(
        select(Pattern).where(Pattern.id == pattern_id)
    )
    pattern = result.scalars().first()
    if pattern is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pattern {pattern_id} not found.",
        )
    return pattern


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


async def create_pattern(
    db: AsyncSession,
    data: dict,
    created_by: Optional[UUID] = None,
) -> Pattern:
    # Validate client_id if scope is client
    client_id = data.get("client_id")
    if data.get("scope") == "client" and client_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="client_id is required when scope is 'client'.",
        )
    if client_id is not None:
        result = await db.execute(
            select(Client).where(Client.id == client_id)
        )
        if result.scalars().first() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Client {client_id} not found.",
            )

    pattern = Pattern(created_by=created_by, **data)
    db.add(pattern)
    await db.flush()
    await db.refresh(pattern)
    return pattern


async def list_patterns(
    db: AsyncSession,
    *,
    scope: Optional[str] = None,
    client_id: Optional[UUID] = None,
    segment_tags: Optional[list[str]] = None,
    category: Optional[str] = None,
    channels: Optional[list[str]] = None,
) -> list[Pattern]:
    stmt = select(Pattern)

    if scope:
        stmt = stmt.where(Pattern.scope == scope)
    if client_id:
        stmt = stmt.where(Pattern.client_id == client_id)
    if category:
        stmt = stmt.where(Pattern.category == category)
    if segment_tags:
        # Match patterns that have any of the given segment tags
        stmt = stmt.where(Pattern.segment_tags.overlap(segment_tags))
    if channels:
        stmt = stmt.where(Pattern.applicable_channels.overlap(channels))

    stmt = stmt.order_by(Pattern.usage_count.desc(), Pattern.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_pattern(db: AsyncSession, pattern_id: UUID) -> Pattern:
    return await _get_pattern_or_404(db, pattern_id)


async def update_pattern(
    db: AsyncSession, pattern_id: UUID, data: dict
) -> Pattern:
    pattern = await _get_pattern_or_404(db, pattern_id)
    for field, value in data.items():
        if value is not None:
            setattr(pattern, field, value)
    await db.flush()
    await db.refresh(pattern)
    return pattern


async def delete_pattern(db: AsyncSession, pattern_id: UUID) -> None:
    pattern = await _get_pattern_or_404(db, pattern_id)
    await db.delete(pattern)
    await db.flush()


# ---------------------------------------------------------------------------
# Promotion
# ---------------------------------------------------------------------------


async def promote_pattern(
    db: AsyncSession,
    pattern_id: UUID,
    target_scope: str,
    segment_tags: Optional[list[str]] = None,
) -> Pattern:
    """Promote a pattern to a broader scope (client -> segment -> global).

    Creates a new pattern at the target scope based on the original.
    """
    original = await _get_pattern_or_404(db, pattern_id)

    scope_order = {"client": 0, "segment": 1, "global": 2}
    original_scope_value = original.scope
    # Handle the global_ enum value
    if original_scope_value == "global":
        original_scope_value = "global"

    if scope_order.get(target_scope, -1) <= scope_order.get(original_scope_value, -1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot promote: target scope '{target_scope}' must be "
                f"broader than current scope '{original.scope}'."
            ),
        )

    if target_scope == "segment" and not segment_tags:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="segment_tags are required when promoting to segment scope.",
        )

    promoted = Pattern(
        scope=target_scope,
        client_id=None,
        segment_tags=segment_tags if target_scope == "segment" else None,
        name=original.name,
        description=original.description,
        category=original.category,
        trigger_conditions=original.trigger_conditions,
        recommended_actions=original.recommended_actions,
        example_cases=original.example_cases,
        applicable_channels=original.applicable_channels,
        created_by=original.created_by,
    )
    db.add(promoted)
    await db.flush()
    await db.refresh(promoted)
    return promoted


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


async def search_patterns(
    db: AsyncSession,
    *,
    q: str,
    channels: Optional[list[str]] = None,
    scope: Optional[str] = None,
) -> list[Pattern]:
    """Full-text-like search across pattern name and description."""
    search_term = f"%{q}%"
    stmt = select(Pattern).where(
        or_(
            Pattern.name.ilike(search_term),
            Pattern.description.ilike(search_term),
        )
    )
    if scope:
        stmt = stmt.where(Pattern.scope == scope)
    if channels:
        stmt = stmt.where(Pattern.applicable_channels.overlap(channels))

    stmt = stmt.order_by(Pattern.usage_count.desc()).limit(50)
    result = await db.execute(stmt)
    return list(result.scalars().all())
