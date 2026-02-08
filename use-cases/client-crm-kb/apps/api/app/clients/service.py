"""Business logic for the clients module."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import Select, and_, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Client,
    ClientRisk,
    ClientRule,
    Contact,
    FeedbackEvent,
    HealthScoreHistory,
    Project,
    ProjectStatus,
    RuleStatus,
)


# ---------------------------------------------------------------------------
# Client CRUD
# ---------------------------------------------------------------------------


async def create_client(
    db: AsyncSession,
    *,
    data: dict[str, Any],
) -> Client:
    """Create a new client record."""
    client = Client(**data)
    db.add(client)
    await db.flush()
    await db.refresh(client)
    return client


def _apply_client_filters(
    stmt: Select,
    *,
    status: Optional[str] = None,
    industry: Optional[str] = None,
    health_score_min: Optional[int] = None,
) -> Select:
    """Apply optional filters to a client query."""
    if status is not None:
        stmt = stmt.where(Client.status == status)
    if industry is not None:
        stmt = stmt.where(Client.industry.any(industry))
    if health_score_min is not None:
        stmt = stmt.where(Client.health_score >= health_score_min)
    # Exclude soft-deleted
    stmt = stmt.where(Client.deleted_at.is_(None))
    return stmt


async def get_clients(
    db: AsyncSession,
    *,
    status: Optional[str] = None,
    industry: Optional[str] = None,
    health_score_min: Optional[int] = None,
    sort: str = "created_at",
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Client], int]:
    """Return paginated, filtered list of clients with total count."""
    # Count query
    count_stmt = select(func.count(Client.id))
    count_stmt = _apply_client_filters(
        count_stmt,
        status=status,
        industry=industry,
        health_score_min=health_score_min,
    )
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Data query
    stmt = select(Client)
    stmt = _apply_client_filters(
        stmt,
        status=status,
        industry=industry,
        health_score_min=health_score_min,
    )

    # Sorting
    sort_column = getattr(Client, sort, Client.created_at)
    if sort.startswith("-"):
        sort_column = getattr(Client, sort.lstrip("-"), Client.created_at).desc()
    stmt = stmt.order_by(sort_column)

    # Pagination
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    clients = list(result.scalars().all())
    return clients, total


async def get_client(db: AsyncSession, client_id: UUID) -> Optional[Client]:
    """Get a single client by ID (excluding soft-deleted)."""
    stmt = select(Client).where(
        and_(Client.id == client_id, Client.deleted_at.is_(None))
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def update_client(
    db: AsyncSession,
    client_id: UUID,
    *,
    data: dict[str, Any],
) -> Optional[Client]:
    """Update a client's fields. Returns the updated client or None."""
    client = await get_client(db, client_id)
    if client is None:
        return None

    for key, value in data.items():
        setattr(client, key, value)

    await db.flush()
    await db.refresh(client)
    return client


async def soft_delete_client(
    db: AsyncSession, client_id: UUID
) -> Optional[Client]:
    """Soft-delete a client by setting deleted_at."""
    client = await get_client(db, client_id)
    if client is None:
        return None

    client.deleted_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(client)
    return client


# ---------------------------------------------------------------------------
# Client Overview (aggregated data)
# ---------------------------------------------------------------------------


async def get_client_overview(
    db: AsyncSession, client_id: UUID
) -> Optional[dict[str, Any]]:
    """Return aggregated overview data for a client."""
    client = await get_client(db, client_id)
    if client is None:
        return None

    # Recent feedback count (last 90 days)
    ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)
    feedback_count_result = await db.execute(
        select(func.count(FeedbackEvent.id)).where(
            and_(
                FeedbackEvent.client_id == client_id,
                FeedbackEvent.created_at >= ninety_days_ago,
            )
        )
    )
    recent_feedback_count = feedback_count_result.scalar_one()

    # Active projects count
    active_projects_result = await db.execute(
        select(func.count(Project.id)).where(
            and_(
                Project.client_id == client_id,
                Project.status.in_(
                    [ProjectStatus.planning, ProjectStatus.in_progress]
                ),
            )
        )
    )
    active_projects_count = active_projects_result.scalar_one()

    # Active rules count
    active_rules_result = await db.execute(
        select(func.count(ClientRule.id)).where(
            and_(
                ClientRule.client_id == client_id,
                ClientRule.status == RuleStatus.active,
            )
        )
    )
    active_rules_count = active_rules_result.scalar_one()

    # Contacts count (non-deleted)
    contacts_result = await db.execute(
        select(func.count(Contact.id)).where(
            and_(
                Contact.client_id == client_id,
                Contact.deleted_at.is_(None),
            )
        )
    )
    contacts_count = contacts_result.scalar_one()

    return {
        "client": client,
        "recent_feedback_count": recent_feedback_count,
        "active_projects_count": active_projects_count,
        "active_rules_count": active_rules_count,
        "contacts_count": contacts_count,
    }


# ---------------------------------------------------------------------------
# Client Risks
# ---------------------------------------------------------------------------


async def create_risk(
    db: AsyncSession,
    client_id: UUID,
    *,
    data: dict[str, Any],
    marked_by: Optional[UUID] = None,
) -> ClientRisk:
    """Create a risk entry for a client."""
    risk = ClientRisk(client_id=client_id, marked_by=marked_by, **data)
    db.add(risk)
    await db.flush()
    await db.refresh(risk)
    return risk


async def get_risks(
    db: AsyncSession, client_id: UUID
) -> list[ClientRisk]:
    """List all risks for a client."""
    result = await db.execute(
        select(ClientRisk)
        .where(ClientRisk.client_id == client_id)
        .order_by(ClientRisk.marked_at.desc())
    )
    return list(result.scalars().all())


async def update_risk(
    db: AsyncSession,
    risk_id: UUID,
    *,
    data: dict[str, Any],
) -> Optional[ClientRisk]:
    """Update a risk entry."""
    result = await db.execute(
        select(ClientRisk).where(ClientRisk.id == risk_id)
    )
    risk = result.scalars().first()
    if risk is None:
        return None

    for key, value in data.items():
        setattr(risk, key, value)

    await db.flush()
    await db.refresh(risk)
    return risk


async def delete_risk(db: AsyncSession, risk_id: UUID) -> bool:
    """Hard-delete a risk entry. Returns True if deleted."""
    result = await db.execute(
        select(ClientRisk).where(ClientRisk.id == risk_id)
    )
    risk = result.scalars().first()
    if risk is None:
        return False

    await db.delete(risk)
    await db.flush()
    return True


# ---------------------------------------------------------------------------
# Health Score
# ---------------------------------------------------------------------------


async def get_health_history(
    db: AsyncSession,
    client_id: UUID,
    *,
    days: int = 90,
) -> list[HealthScoreHistory]:
    """Return health-score history for the last N days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(HealthScoreHistory)
        .where(
            and_(
                HealthScoreHistory.client_id == client_id,
                HealthScoreHistory.recorded_at >= cutoff,
            )
        )
        .order_by(HealthScoreHistory.recorded_at.desc())
    )
    return list(result.scalars().all())
