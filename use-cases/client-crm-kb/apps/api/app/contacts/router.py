"""FastAPI router for contacts endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Client, Contact, User

from .schemas import ContactCreate, ContactResponse, ContactUpdate

router = APIRouter(tags=["contacts"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _verify_client(db: AsyncSession, client_id: UUID) -> Client:
    """Raise 404 if the client does not exist or is soft-deleted."""
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


async def _get_contact_or_404(
    db: AsyncSession, contact_id: UUID
) -> Contact:
    """Raise 404 if the contact does not exist or is soft-deleted."""
    result = await db.execute(
        select(Contact).where(
            and_(Contact.id == contact_id, Contact.deleted_at.is_(None))
        )
    )
    contact = result.scalars().first()
    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found.",
        )
    return contact


# ---------------------------------------------------------------------------
# Endpoints nested under /api/clients/{client_id}/contacts
# ---------------------------------------------------------------------------


@router.post(
    "/api/clients/{client_id}/contacts",
    response_model=ContactResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_contact(
    client_id: UUID,
    payload: ContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContactResponse:
    await _verify_client(db, client_id)

    data = payload.model_dump(exclude_unset=True)
    contact = Contact(client_id=client_id, **data)
    db.add(contact)
    await db.flush()
    await db.refresh(contact)
    return ContactResponse.model_validate(contact)


@router.get(
    "/api/clients/{client_id}/contacts",
    response_model=list[ContactResponse],
)
async def list_contacts(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ContactResponse]:
    await _verify_client(db, client_id)

    result = await db.execute(
        select(Contact)
        .where(
            and_(
                Contact.client_id == client_id,
                Contact.deleted_at.is_(None),
            )
        )
        .order_by(Contact.is_primary.desc(), Contact.created_at.asc())
    )
    contacts = result.scalars().all()
    return [ContactResponse.model_validate(c) for c in contacts]


# ---------------------------------------------------------------------------
# Endpoints at /api/contacts/{contact_id}
# ---------------------------------------------------------------------------


@router.get("/api/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContactResponse:
    contact = await _get_contact_or_404(db, contact_id)
    return ContactResponse.model_validate(contact)


@router.patch("/api/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: UUID,
    payload: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContactResponse:
    contact = await _get_contact_or_404(db, contact_id)

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields to update.",
        )

    for key, value in data.items():
        setattr(contact, key, value)

    await db.flush()
    await db.refresh(contact)
    return ContactResponse.model_validate(contact)


@router.delete(
    "/api/contacts/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    contact = await _get_contact_or_404(db, contact_id)
    contact.deleted_at = datetime.now(timezone.utc)
    await db.flush()


@router.patch(
    "/api/contacts/{contact_id}/set-primary",
    response_model=ContactResponse,
)
async def set_primary_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContactResponse:
    contact = await _get_contact_or_404(db, contact_id)

    # Un-set any existing primary contact for the same client
    await db.execute(
        update(Contact)
        .where(
            and_(
                Contact.client_id == contact.client_id,
                Contact.id != contact.id,
                Contact.is_primary.is_(True),
            )
        )
        .values(is_primary=False)
    )

    contact.is_primary = True
    await db.flush()
    await db.refresh(contact)
    return ContactResponse.model_validate(contact)
