"""
Unified Knowledge Base search and export router.

Provides cross-entity search across rules and patterns, plus a full
client KB export endpoint.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    BrandProfile,
    Client,
    ClientRule,
    FeedbackEvent,
    Pattern,
    TasteExample,
    User,
)

router = APIRouter(prefix="/api/kb", tags=["knowledge-base"])


# ---------------------------------------------------------------------------
# Response schemas (local to this router)
# ---------------------------------------------------------------------------


class KBSearchItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: str  # "rule" | "pattern"
    title: str
    description: str
    scope: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[int] = None
    usage_count: int = 0
    created_at: datetime


class KBSearchResponse(BaseModel):
    items: list[KBSearchItem]
    total: int


class KBExportResponse(BaseModel):
    client_id: UUID
    client_name: str
    exported_at: datetime
    brand_profile: Optional[dict] = None
    taste_examples: list[dict]
    rules: list[dict]
    patterns: list[dict]
    recent_feedback: list[dict]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/search", response_model=KBSearchResponse)
async def kb_search(
    q: str = Query(..., min_length=1),
    client_id: Optional[UUID] = Query(default=None),
    types: str = Query(
        default="rules,patterns",
        description="Comma-separated types to search: rules, patterns",
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search across rules and patterns with a single query."""
    search_term = f"%{q}%"
    type_list = [t.strip() for t in types.split(",")]
    items: list[KBSearchItem] = []

    # Search rules
    if "rules" in type_list:
        stmt = select(ClientRule).where(
            ClientRule.description.ilike(search_term)
        )
        if client_id:
            stmt = stmt.where(ClientRule.client_id == client_id)
        stmt = stmt.order_by(ClientRule.priority.asc()).limit(25)
        result = await db.execute(stmt)
        for rule in result.scalars().all():
            items.append(
                KBSearchItem(
                    id=rule.id,
                    type="rule",
                    title=f"Rule: {rule.description[:80]}",
                    description=rule.description,
                    status=rule.status,
                    priority=rule.priority,
                    usage_count=rule.usage_count,
                    created_at=rule.created_at,
                )
            )

    # Search patterns
    if "patterns" in type_list:
        stmt = select(Pattern).where(
            or_(
                Pattern.name.ilike(search_term),
                Pattern.description.ilike(search_term),
            )
        )
        if client_id:
            # Include global/segment patterns plus client-specific
            stmt = stmt.where(
                or_(
                    Pattern.client_id == client_id,
                    Pattern.scope.in_(["global", "segment"]),
                )
            )
        stmt = stmt.order_by(Pattern.usage_count.desc()).limit(25)
        result = await db.execute(stmt)
        for pattern in result.scalars().all():
            items.append(
                KBSearchItem(
                    id=pattern.id,
                    type="pattern",
                    title=pattern.name,
                    description=pattern.description,
                    scope=pattern.scope,
                    category=pattern.category,
                    usage_count=pattern.usage_count,
                    created_at=pattern.created_at,
                )
            )

    # Sort combined results by usage_count descending
    items.sort(key=lambda x: x.usage_count, reverse=True)

    return KBSearchResponse(items=items, total=len(items))


@router.get("/client/{client_id}/export", response_model=KBExportResponse)
async def kb_export(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export the full knowledge base for a client as JSON."""
    from fastapi import HTTPException, status as http_status

    # Verify client exists
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalars().first()
    if client is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Client {client_id} not found.",
        )

    # Brand profile
    bp_result = await db.execute(
        select(BrandProfile).where(BrandProfile.client_id == client_id)
    )
    brand = bp_result.scalars().first()
    brand_data = None
    if brand:
        brand_data = {
            "id": str(brand.id),
            "brand_tone": brand.brand_tone,
            "brand_values": brand.brand_values,
            "key_messages": brand.key_messages,
            "do_list": brand.do_list,
            "dont_list": brand.dont_list,
            "legal_sensitivities": brand.legal_sensitivities,
            "visual_rules": brand.visual_rules,
            "version": brand.version,
            "status": brand.status,
        }

    # Taste examples
    te_result = await db.execute(
        select(TasteExample)
        .where(TasteExample.client_id == client_id)
        .order_by(TasteExample.added_at.desc())
    )
    taste_data = [
        {
            "id": str(t.id),
            "type": t.type,
            "category": t.category,
            "description": t.description,
            "why_client_likes_or_dislikes": t.why_client_likes_or_dislikes,
            "tags": t.tags,
            "media_ref": t.media_ref,
        }
        for t in te_result.scalars().all()
    ]

    # Rules
    rules_result = await db.execute(
        select(ClientRule)
        .where(ClientRule.client_id == client_id)
        .order_by(ClientRule.priority.asc())
    )
    rules_data = [
        {
            "id": str(r.id),
            "description": r.description,
            "rule_type": r.rule_type,
            "applies_to": r.applies_to,
            "priority": r.priority,
            "status": r.status,
            "usage_count": r.usage_count,
        }
        for r in rules_result.scalars().all()
    ]

    # Patterns (client-scoped + global + segment)
    patterns_result = await db.execute(
        select(Pattern)
        .where(
            or_(
                Pattern.client_id == client_id,
                Pattern.scope.in_(["global", "segment"]),
            )
        )
        .order_by(Pattern.usage_count.desc())
    )
    patterns_data = [
        {
            "id": str(p.id),
            "scope": p.scope,
            "name": p.name,
            "description": p.description,
            "category": p.category,
            "applicable_channels": p.applicable_channels,
            "usage_count": p.usage_count,
        }
        for p in patterns_result.scalars().all()
    ]

    # Recent feedback (last 20)
    fb_result = await db.execute(
        select(FeedbackEvent)
        .where(FeedbackEvent.client_id == client_id)
        .order_by(FeedbackEvent.created_at.desc())
        .limit(20)
    )
    feedback_data = [
        {
            "id": str(f.id),
            "source": f.source,
            "date": str(f.date),
            "sentiment": f.sentiment,
            "severity": f.severity,
            "topics": f.topics,
            "status": f.status,
            "raw_text": f.raw_text[:500] if f.raw_text else None,
        }
        for f in fb_result.scalars().all()
    ]

    return KBExportResponse(
        client_id=client_id,
        client_name=client.name,
        exported_at=datetime.utcnow(),
        brand_profile=brand_data,
        taste_examples=taste_data,
        rules=rules_data,
        patterns=patterns_data,
        recent_feedback=feedback_data,
    )
