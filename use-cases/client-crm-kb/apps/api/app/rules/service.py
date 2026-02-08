"""
Business logic for ClientRule CRUD operations.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Client, ClientRule

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


async def _get_rule_or_404(db: AsyncSession, rule_id: UUID) -> ClientRule:
    result = await db.execute(
        select(ClientRule).where(ClientRule.id == rule_id)
    )
    rule = result.scalars().first()
    if rule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule {rule_id} not found.",
        )
    return rule


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


async def create_rule(
    db: AsyncSession,
    client_id: UUID,
    data: dict,
    created_by: Optional[UUID] = None,
) -> ClientRule:
    await _get_client_or_404(db, client_id)
    rule = ClientRule(client_id=client_id, created_by=created_by, **data)
    db.add(rule)
    await db.flush()
    await db.refresh(rule)
    return rule


async def list_rules(
    db: AsyncSession,
    client_id: UUID,
    rule_status: Optional[str] = None,
) -> list[ClientRule]:
    await _get_client_or_404(db, client_id)
    stmt = select(ClientRule).where(ClientRule.client_id == client_id)
    if rule_status:
        stmt = stmt.where(ClientRule.status == rule_status)
    stmt = stmt.order_by(ClientRule.priority.asc(), ClientRule.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_rule(db: AsyncSession, rule_id: UUID) -> ClientRule:
    return await _get_rule_or_404(db, rule_id)


async def update_rule(
    db: AsyncSession, rule_id: UUID, data: dict
) -> ClientRule:
    rule = await _get_rule_or_404(db, rule_id)
    if rule.status == "deprecated":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a deprecated rule.",
        )
    for field, value in data.items():
        if value is not None:
            setattr(rule, field, value)
    await db.flush()
    await db.refresh(rule)
    return rule


async def delete_rule(db: AsyncSession, rule_id: UUID) -> None:
    rule = await _get_rule_or_404(db, rule_id)
    await db.delete(rule)
    await db.flush()


async def deprecate_rule(
    db: AsyncSession, rule_id: UUID, reason: str
) -> ClientRule:
    rule = await _get_rule_or_404(db, rule_id)
    if rule.status == "deprecated":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rule is already deprecated.",
        )
    rule.status = "deprecated"
    rule.deprecated_reason = reason
    rule.deprecated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(rule)
    return rule


async def get_usage_stats(db: AsyncSession, rule_id: UUID) -> dict:
    rule = await _get_rule_or_404(db, rule_id)
    now = datetime.now(timezone.utc)
    created_at_aware = rule.created_at
    if created_at_aware.tzinfo is None:
        created_at_aware = created_at_aware.replace(tzinfo=timezone.utc)
    days_since_creation = (now - created_at_aware).days

    days_since_last_use = None
    if rule.last_used_at is not None:
        last_used_aware = rule.last_used_at
        if last_used_aware.tzinfo is None:
            last_used_aware = last_used_aware.replace(tzinfo=timezone.utc)
        days_since_last_use = (now - last_used_aware).days

    return {
        "rule_id": rule.id,
        "usage_count": rule.usage_count,
        "last_used_at": rule.last_used_at,
        "status": rule.status,
        "created_at": rule.created_at,
        "days_since_creation": days_since_creation,
        "days_since_last_use": days_since_last_use,
    }
