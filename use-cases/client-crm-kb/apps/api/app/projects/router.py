"""FastAPI router for projects endpoints."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    Client,
    Project,
    ProjectDeliverable,
    ProjectMilestone,
    ProjectTeam,
    User,
)

from .schemas import (
    DeliverableCreate,
    DeliverableResponse,
    DeliverableUpdate,
    MilestoneCreate,
    MilestoneResponse,
    MilestoneUpdate,
    ProjectCreate,
    ProjectResponse,
    ProjectTeamCreate,
    ProjectTeamResponse,
    ProjectUpdate,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _get_project_or_404(
    db: AsyncSession, project_id: UUID
) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalars().first()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    return project


# ---------------------------------------------------------------------------
# Project CRUD
# ---------------------------------------------------------------------------


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
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
    project = Project(**data)
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    client_id: Optional[UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectResponse]:
    stmt = select(Project)

    if client_id is not None:
        stmt = stmt.where(Project.client_id == client_id)
    if status_filter is not None:
        stmt = stmt.where(Project.status == status_filter)

    stmt = stmt.order_by(Project.created_at.desc())
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    projects = result.scalars().all()
    return [ProjectResponse.model_validate(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    project = await _get_project_or_404(db, project_id)
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    project = await _get_project_or_404(db, project_id)

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields to update.",
        )

    for key, value in data.items():
        setattr(project, key, value)

    await db.flush()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.delete(
    "/{project_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    project = await _get_project_or_404(db, project_id)
    await db.delete(project)
    await db.flush()


# ---------------------------------------------------------------------------
# Project Deliverables
# ---------------------------------------------------------------------------


@router.post(
    "/{project_id}/deliverables",
    response_model=DeliverableResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_deliverable(
    project_id: UUID,
    payload: DeliverableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeliverableResponse:
    await _get_project_or_404(db, project_id)

    data = payload.model_dump(exclude_unset=True)
    deliverable = ProjectDeliverable(project_id=project_id, **data)
    db.add(deliverable)
    await db.flush()
    await db.refresh(deliverable)
    return DeliverableResponse.model_validate(deliverable)


@router.get(
    "/{project_id}/deliverables",
    response_model=list[DeliverableResponse],
)
async def list_deliverables(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DeliverableResponse]:
    await _get_project_or_404(db, project_id)

    result = await db.execute(
        select(ProjectDeliverable)
        .where(ProjectDeliverable.project_id == project_id)
        .order_by(ProjectDeliverable.created_at.asc())
    )
    deliverables = result.scalars().all()
    return [DeliverableResponse.model_validate(d) for d in deliverables]


@router.patch(
    "/{project_id}/deliverables/{deliverable_id}",
    response_model=DeliverableResponse,
)
async def update_deliverable(
    project_id: UUID,
    deliverable_id: UUID,
    payload: DeliverableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeliverableResponse:
    result = await db.execute(
        select(ProjectDeliverable).where(
            and_(
                ProjectDeliverable.id == deliverable_id,
                ProjectDeliverable.project_id == project_id,
            )
        )
    )
    deliverable = result.scalars().first()
    if deliverable is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deliverable not found.",
        )

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields to update.",
        )

    for key, value in data.items():
        setattr(deliverable, key, value)

    await db.flush()
    await db.refresh(deliverable)
    return DeliverableResponse.model_validate(deliverable)


# ---------------------------------------------------------------------------
# Project Milestones
# ---------------------------------------------------------------------------


@router.post(
    "/{project_id}/milestones",
    response_model=MilestoneResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_milestone(
    project_id: UUID,
    payload: MilestoneCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MilestoneResponse:
    await _get_project_or_404(db, project_id)

    data = payload.model_dump(exclude_unset=True)
    milestone = ProjectMilestone(project_id=project_id, **data)
    db.add(milestone)
    await db.flush()
    await db.refresh(milestone)
    return MilestoneResponse.model_validate(milestone)


@router.get(
    "/{project_id}/milestones",
    response_model=list[MilestoneResponse],
)
async def list_milestones(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MilestoneResponse]:
    await _get_project_or_404(db, project_id)

    result = await db.execute(
        select(ProjectMilestone)
        .where(ProjectMilestone.project_id == project_id)
        .order_by(ProjectMilestone.due_date.asc().nulls_last())
    )
    milestones = result.scalars().all()
    return [MilestoneResponse.model_validate(m) for m in milestones]


@router.patch(
    "/{project_id}/milestones/{milestone_id}",
    response_model=MilestoneResponse,
)
async def update_milestone(
    project_id: UUID,
    milestone_id: UUID,
    payload: MilestoneUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MilestoneResponse:
    result = await db.execute(
        select(ProjectMilestone).where(
            and_(
                ProjectMilestone.id == milestone_id,
                ProjectMilestone.project_id == project_id,
            )
        )
    )
    milestone = result.scalars().first()
    if milestone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found.",
        )

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields to update.",
        )

    for key, value in data.items():
        setattr(milestone, key, value)

    await db.flush()
    await db.refresh(milestone)
    return MilestoneResponse.model_validate(milestone)


# ---------------------------------------------------------------------------
# Project Team
# ---------------------------------------------------------------------------


@router.post(
    "/{project_id}/team",
    response_model=ProjectTeamResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_team_member(
    project_id: UUID,
    payload: ProjectTeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectTeamResponse:
    await _get_project_or_404(db, project_id)

    # Verify user exists
    user_result = await db.execute(
        select(User).where(User.id == payload.user_id)
    )
    if user_result.scalars().first() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Check for duplicate assignment
    existing = await db.execute(
        select(ProjectTeam).where(
            and_(
                ProjectTeam.project_id == project_id,
                ProjectTeam.user_id == payload.user_id,
            )
        )
    )
    if existing.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already assigned to this project.",
        )

    data = payload.model_dump(exclude_unset=True)
    team_member = ProjectTeam(project_id=project_id, **data)
    db.add(team_member)
    await db.flush()
    await db.refresh(team_member)
    return ProjectTeamResponse.model_validate(team_member)


@router.get(
    "/{project_id}/team",
    response_model=list[ProjectTeamResponse],
)
async def list_team_members(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectTeamResponse]:
    await _get_project_or_404(db, project_id)

    result = await db.execute(
        select(ProjectTeam)
        .where(ProjectTeam.project_id == project_id)
        .order_by(ProjectTeam.created_at.asc())
    )
    members = result.scalars().all()
    return [ProjectTeamResponse.model_validate(m) for m in members]


@router.delete(
    "/{project_id}/team/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_team_member(
    project_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await db.execute(
        select(ProjectTeam).where(
            and_(
                ProjectTeam.project_id == project_id,
                ProjectTeam.user_id == user_id,
            )
        )
    )
    team_member = result.scalars().first()
    if team_member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found for this project.",
        )

    await db.delete(team_member)
    await db.flush()
