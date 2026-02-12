"""
FastAPI router for ClientRule endpoints.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.rules.schemas import (
    DeprecateRequest,
    RuleCreate,
    RuleResponse,
    RuleUpdate,
    RuleUsageStats,
)
from app.rules.service import (
    create_rule,
    delete_rule,
    deprecate_rule,
    get_rule,
    get_usage_stats,
    list_rules,
    update_rule,
)

router = APIRouter(tags=["rules"])


@router.post(
    "/api/clients/{client_id}/rules",
    response_model=RuleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_rule_endpoint(
    client_id: UUID,
    body: RuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = await create_rule(
        db,
        client_id,
        body.model_dump(exclude_unset=True),
        created_by=current_user.id,
    )
    return RuleResponse.model_validate(rule)


@router.get(
    "/api/clients/{client_id}/rules",
    response_model=list[RuleResponse],
)
async def list_rules_endpoint(
    client_id: UUID,
    status_filter: Optional[str] = Query(
        default=None, alias="status", pattern="^(active|deprecated)$"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rules = await list_rules(db, client_id, rule_status=status_filter)
    return [RuleResponse.model_validate(r) for r in rules]


@router.get(
    "/api/rules/{rule_id}",
    response_model=RuleResponse,
)
async def get_rule_endpoint(
    rule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = await get_rule(db, rule_id)
    return RuleResponse.model_validate(rule)


@router.patch(
    "/api/rules/{rule_id}",
    response_model=RuleResponse,
)
async def update_rule_endpoint(
    rule_id: UUID,
    body: RuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = await update_rule(db, rule_id, body.model_dump(exclude_unset=True))
    return RuleResponse.model_validate(rule)


@router.delete(
    "/api/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_rule_endpoint(
    rule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_rule(db, rule_id)


@router.patch(
    "/api/rules/{rule_id}/deprecate",
    response_model=RuleResponse,
)
async def deprecate_rule_endpoint(
    rule_id: UUID,
    body: DeprecateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = await deprecate_rule(db, rule_id, body.reason)
    return RuleResponse.model_validate(rule)


@router.get(
    "/api/rules/{rule_id}/usage-stats",
    response_model=RuleUsageStats,
)
async def get_usage_stats_endpoint(
    rule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stats = await get_usage_stats(db, rule_id)
    return RuleUsageStats(**stats)
