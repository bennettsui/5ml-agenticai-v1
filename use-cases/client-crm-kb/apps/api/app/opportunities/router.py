"""FastAPI router for opportunities endpoints."""

from __future__ import annotations

from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Client, Opportunity, User

from .schemas import (
    OpportunityCreate,
    OpportunityResponse,
    OpportunityUpdate,
    PipelineStageSummary,
    PipelineSummaryResponse,
)

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _get_opportunity_or_404(
    db: AsyncSession, opportunity_id: UUID
) -> Opportunity:
    result = await db.execute(
        select(Opportunity).where(Opportunity.id == opportunity_id)
    )
    opportunity = result.scalars().first()
    if opportunity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found.",
        )
    return opportunity


# ---------------------------------------------------------------------------
# Pipeline summary (defined before /{opportunity_id} to avoid path conflict)
# ---------------------------------------------------------------------------


@router.get("/pipeline-summary", response_model=PipelineSummaryResponse)
async def pipeline_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PipelineSummaryResponse:
    result = await db.execute(
        select(
            Opportunity.stage,
            func.count(Opportunity.id).label("count"),
            func.coalesce(func.sum(Opportunity.estimated_value), 0).label(
                "total_value"
            ),
        ).group_by(Opportunity.stage)
    )
    rows = result.all()

    stages = [
        PipelineStageSummary(
            stage=row.stage,
            count=row.count,
            total_value=Decimal(str(row.total_value)),
        )
        for row in rows
    ]

    total_opportunities = sum(s.count for s in stages)
    total_pipeline_value = sum(s.total_value for s in stages)

    return PipelineSummaryResponse(
        stages=stages,
        total_opportunities=total_opportunities,
        total_pipeline_value=total_pipeline_value,
    )


# ---------------------------------------------------------------------------
# CRUD endpoints
# ---------------------------------------------------------------------------


@router.post(
    "",
    response_model=OpportunityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_opportunity(
    payload: OpportunityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OpportunityResponse:
    # Verify client exists
    client_result = await db.execute(
        select(Client).where(
            and_(Client.id == payload.client_id, Client.deleted_at.is_(None))
        )
    )
    if client_result.scalars().first() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )

    data = payload.model_dump(exclude_unset=True)
    opportunity = Opportunity(**data)
    db.add(opportunity)
    await db.flush()
    await db.refresh(opportunity)
    return OpportunityResponse.model_validate(opportunity)


@router.get("", response_model=list[OpportunityResponse])
async def list_opportunities(
    client_id: Optional[UUID] = Query(None),
    stage: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OpportunityResponse]:
    stmt = select(Opportunity)

    if client_id is not None:
        stmt = stmt.where(Opportunity.client_id == client_id)
    if stage is not None:
        stmt = stmt.where(Opportunity.stage == stage)

    stmt = stmt.order_by(Opportunity.created_at.desc())
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    opportunities = result.scalars().all()
    return [OpportunityResponse.model_validate(o) for o in opportunities]


@router.get("/{opportunity_id}", response_model=OpportunityResponse)
async def get_opportunity(
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OpportunityResponse:
    opportunity = await _get_opportunity_or_404(db, opportunity_id)
    return OpportunityResponse.model_validate(opportunity)


@router.patch("/{opportunity_id}", response_model=OpportunityResponse)
async def update_opportunity(
    opportunity_id: UUID,
    payload: OpportunityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OpportunityResponse:
    opportunity = await _get_opportunity_or_404(db, opportunity_id)

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields to update.",
        )

    for key, value in data.items():
        setattr(opportunity, key, value)

    await db.flush()
    await db.refresh(opportunity)
    return OpportunityResponse.model_validate(opportunity)


@router.delete(
    "/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_opportunity(
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    opportunity = await _get_opportunity_or_404(db, opportunity_id)
    await db.delete(opportunity)
    await db.flush()
