"""FastAPI router for clients endpoints."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User

from . import service
from .schemas import (
    ClientCreate,
    ClientListResponse,
    ClientOverview,
    ClientResponse,
    ClientRiskCreate,
    ClientRiskResponse,
    ClientRiskUpdate,
    ClientUpdate,
    HealthHistoryResponse,
    HealthScoreResponse,
)

router = APIRouter(prefix="/api/clients", tags=["clients"])


# ---------------------------------------------------------------------------
# Client CRUD
# ---------------------------------------------------------------------------


@router.post(
    "",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_client(
    payload: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientResponse:
    data = payload.model_dump(exclude_unset=True)
    client = await service.create_client(db, data=data)
    return ClientResponse.model_validate(client)


@router.get("", response_model=ClientListResponse)
async def list_clients(
    status_filter: Optional[str] = Query(None, alias="status"),
    industry: Optional[str] = Query(None),
    health_score_min: Optional[int] = Query(None, ge=0, le=100),
    sort: str = Query("created_at"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientListResponse:
    clients, total = await service.get_clients(
        db,
        status=status_filter,
        industry=industry,
        health_score_min=health_score_min,
        sort=sort,
        page=page,
        limit=limit,
    )
    return ClientListResponse(
        items=[ClientResponse.model_validate(c) for c in clients],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientResponse:
    client = await service.get_client(db, client_id)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )
    return ClientResponse.model_validate(client)


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: UUID,
    payload: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientResponse:
    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields to update.",
        )
    client = await service.update_client(db, client_id, data=data)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )
    return ClientResponse.model_validate(client)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    # Only admin or account_director may soft-delete
    if current_user.role not in ("admin", "account_director"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or account_director roles can delete clients.",
        )
    client = await service.soft_delete_client(db, client_id)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )


# ---------------------------------------------------------------------------
# Client Overview
# ---------------------------------------------------------------------------


@router.get("/{client_id}/overview", response_model=ClientOverview)
async def get_client_overview(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientOverview:
    overview = await service.get_client_overview(db, client_id)
    if overview is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )
    return ClientOverview(
        client=ClientResponse.model_validate(overview["client"]),
        recent_feedback_count=overview["recent_feedback_count"],
        active_projects_count=overview["active_projects_count"],
        active_rules_count=overview["active_rules_count"],
        contacts_count=overview["contacts_count"],
    )


# ---------------------------------------------------------------------------
# Health Score
# ---------------------------------------------------------------------------


@router.get("/{client_id}/health-score", response_model=HealthScoreResponse)
async def get_health_score(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HealthScoreResponse:
    client = await service.get_client(db, client_id)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )
    return HealthScoreResponse(
        client_id=client.id,
        health_score=client.health_score,
    )


@router.get(
    "/{client_id}/health-history", response_model=HealthHistoryResponse
)
async def get_health_history(
    client_id: UUID,
    days: int = Query(90, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HealthHistoryResponse:
    # Verify client exists
    client = await service.get_client(db, client_id)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )
    history = await service.get_health_history(db, client_id, days=days)
    return HealthHistoryResponse(
        client_id=client_id,
        history=history,
    )


# ---------------------------------------------------------------------------
# Client Risks
# ---------------------------------------------------------------------------


@router.post(
    "/{client_id}/risks",
    response_model=ClientRiskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_risk(
    client_id: UUID,
    payload: ClientRiskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientRiskResponse:
    # Verify client exists
    client = await service.get_client(db, client_id)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )
    data = payload.model_dump(exclude_unset=True)
    risk = await service.create_risk(
        db, client_id, data=data, marked_by=current_user.id
    )
    return ClientRiskResponse.model_validate(risk)


@router.get("/{client_id}/risks", response_model=list[ClientRiskResponse])
async def list_risks(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ClientRiskResponse]:
    # Verify client exists
    client = await service.get_client(db, client_id)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )
    risks = await service.get_risks(db, client_id)
    return [ClientRiskResponse.model_validate(r) for r in risks]


@router.patch(
    "/{client_id}/risks/{risk_id}", response_model=ClientRiskResponse
)
async def update_risk(
    client_id: UUID,
    risk_id: UUID,
    payload: ClientRiskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientRiskResponse:
    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields to update.",
        )
    risk = await service.update_risk(db, risk_id, data=data)
    if risk is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk not found.",
        )
    return ClientRiskResponse.model_validate(risk)


@router.delete(
    "/{client_id}/risks/{risk_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_risk(
    client_id: UUID,
    risk_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    deleted = await service.delete_risk(db, risk_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk not found.",
        )
