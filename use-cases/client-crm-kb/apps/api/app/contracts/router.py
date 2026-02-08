"""FastAPI router for contracts endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Client, Contract, User

from .schemas import ContractCreate, ContractResponse, ContractUpdate

router = APIRouter(tags=["contracts"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _verify_client(db: AsyncSession, client_id: UUID) -> Client:
    result = await db.execute(
        select(Client).where(
            and_(Client.id == client_id, Client.deleted_at.is_(None))
        )
    )
    client = result.scalars().first()
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )
    return client


async def _get_contract_or_404(
    db: AsyncSession, contract_id: UUID
) -> Contract:
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id)
    )
    contract = result.scalars().first()
    if contract is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found.",
        )
    return contract


# ---------------------------------------------------------------------------
# Endpoints nested under /api/clients/{client_id}/contracts
# ---------------------------------------------------------------------------


@router.post(
    "/api/clients/{client_id}/contracts",
    response_model=ContractResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_contract(
    client_id: UUID,
    payload: ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContractResponse:
    await _verify_client(db, client_id)

    data = payload.model_dump(exclude_unset=True)
    contract = Contract(client_id=client_id, **data)
    db.add(contract)
    await db.flush()
    await db.refresh(contract)
    return ContractResponse.model_validate(contract)


@router.get(
    "/api/clients/{client_id}/contracts",
    response_model=list[ContractResponse],
)
async def list_contracts(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ContractResponse]:
    await _verify_client(db, client_id)

    result = await db.execute(
        select(Contract)
        .where(Contract.client_id == client_id)
        .order_by(Contract.created_at.desc())
    )
    contracts = result.scalars().all()
    return [ContractResponse.model_validate(c) for c in contracts]


# ---------------------------------------------------------------------------
# Endpoints at /api/contracts/{contract_id}
# ---------------------------------------------------------------------------


@router.get(
    "/api/contracts/{contract_id}", response_model=ContractResponse
)
async def get_contract(
    contract_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContractResponse:
    contract = await _get_contract_or_404(db, contract_id)
    return ContractResponse.model_validate(contract)


@router.patch(
    "/api/contracts/{contract_id}", response_model=ContractResponse
)
async def update_contract(
    contract_id: UUID,
    payload: ContractUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContractResponse:
    contract = await _get_contract_or_404(db, contract_id)

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields to update.",
        )

    for key, value in data.items():
        setattr(contract, key, value)

    await db.flush()
    await db.refresh(contract)
    return ContractResponse.model_validate(contract)


@router.delete(
    "/api/contracts/{contract_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_contract(
    contract_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    contract = await _get_contract_or_404(db, contract_id)
    await db.delete(contract)
    await db.flush()
