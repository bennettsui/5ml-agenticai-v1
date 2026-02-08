"""
FastAPI router for Pattern endpoints.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.patterns.schemas import (
    PatternCreate,
    PatternResponse,
    PatternSearchResult,
    PatternUpdate,
    PromoteRequest,
)
from app.patterns.service import (
    create_pattern,
    delete_pattern,
    get_pattern,
    list_patterns,
    promote_pattern,
    search_patterns,
    update_pattern,
)

router = APIRouter(tags=["patterns"])


@router.post(
    "/api/patterns",
    response_model=PatternResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_pattern_endpoint(
    body: PatternCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pattern = await create_pattern(
        db,
        body.model_dump(exclude_unset=True),
        created_by=current_user.id,
    )
    return PatternResponse.model_validate(pattern)


@router.get(
    "/api/patterns",
    response_model=list[PatternResponse],
)
async def list_patterns_endpoint(
    scope: Optional[str] = Query(
        default=None, pattern="^(global|segment|client)$"
    ),
    client_id: Optional[UUID] = Query(default=None),
    segment_tags: Optional[str] = Query(
        default=None,
        description="Comma-separated segment tags",
    ),
    category: Optional[str] = Query(
        default=None,
        pattern="^(error_pattern|best_practice|playbook|standard)$",
    ),
    channels: Optional[str] = Query(
        default=None,
        description="Comma-separated channel names",
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tags_list = segment_tags.split(",") if segment_tags else None
    channels_list = channels.split(",") if channels else None

    patterns = await list_patterns(
        db,
        scope=scope,
        client_id=client_id,
        segment_tags=tags_list,
        category=category,
        channels=channels_list,
    )
    return [PatternResponse.model_validate(p) for p in patterns]


@router.get(
    "/api/patterns/search",
    response_model=list[PatternSearchResult],
)
async def search_patterns_endpoint(
    q: str = Query(..., min_length=1),
    channels: Optional[str] = Query(default=None),
    scope: Optional[str] = Query(
        default=None, pattern="^(global|segment|client)$"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    channels_list = channels.split(",") if channels else None
    results = await search_patterns(
        db, q=q, channels=channels_list, scope=scope
    )
    return [PatternSearchResult.model_validate(p) for p in results]


@router.get(
    "/api/patterns/{pattern_id}",
    response_model=PatternResponse,
)
async def get_pattern_endpoint(
    pattern_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pattern = await get_pattern(db, pattern_id)
    return PatternResponse.model_validate(pattern)


@router.patch(
    "/api/patterns/{pattern_id}",
    response_model=PatternResponse,
)
async def update_pattern_endpoint(
    pattern_id: UUID,
    body: PatternUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pattern = await update_pattern(
        db, pattern_id, body.model_dump(exclude_unset=True)
    )
    return PatternResponse.model_validate(pattern)


@router.delete(
    "/api/patterns/{pattern_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_pattern_endpoint(
    pattern_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_pattern(db, pattern_id)


@router.post(
    "/api/patterns/{pattern_id}/promote",
    response_model=PatternResponse,
    status_code=status.HTTP_201_CREATED,
)
async def promote_pattern_endpoint(
    pattern_id: UUID,
    body: PromoteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    promoted = await promote_pattern(
        db,
        pattern_id,
        target_scope=body.target_scope,
        segment_tags=body.segment_tags,
    )
    return PatternResponse.model_validate(promoted)
