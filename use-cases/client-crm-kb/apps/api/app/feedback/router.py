"""
FastAPI router for FeedbackEvent endpoints.
"""

from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.feedback.schemas import (
    AnalysisResponse,
    AnalysisResult,
    FeedbackCreate,
    FeedbackListResponse,
    FeedbackResponse,
    FeedbackUpdate,
    MarkProcessedRequest,
    RuleSuggestion,
    RuleSuggestionsResponse,
)
from app.feedback.service import (
    analyze_feedback,
    create_feedback,
    delete_feedback,
    get_analysis,
    get_feedback,
    get_suggested_rules,
    list_feedback,
    mark_processed,
    suggest_rules,
    update_feedback,
)
from app.models import User

router = APIRouter(tags=["feedback"])


@router.post(
    "/api/feedback",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_feedback_endpoint(
    body: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    feedback = await create_feedback(db, body.model_dump())
    return FeedbackResponse.model_validate(feedback)


@router.get(
    "/api/feedback",
    response_model=FeedbackListResponse,
)
async def list_feedback_endpoint(
    client_id: Optional[UUID] = Query(default=None),
    project_id: Optional[UUID] = Query(default=None),
    sentiment: Optional[str] = Query(
        default=None, pattern="^(positive|neutral|negative)$"
    ),
    status_filter: Optional[str] = Query(
        default=None,
        alias="status",
        pattern="^(new|reviewed|converted_to_rule|converted_to_pattern|ignored)$",
    ),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = await list_feedback(
        db,
        client_id=client_id,
        project_id=project_id,
        sentiment=sentiment,
        feedback_status=status_filter,
        date_from=date_from,
        date_to=date_to,
        page=page,
        limit=limit,
    )
    return FeedbackListResponse(
        items=[FeedbackResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        limit=limit,
    )


@router.get(
    "/api/feedback/{feedback_id}",
    response_model=FeedbackResponse,
)
async def get_feedback_endpoint(
    feedback_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    feedback = await get_feedback(db, feedback_id)
    return FeedbackResponse.model_validate(feedback)


@router.patch(
    "/api/feedback/{feedback_id}",
    response_model=FeedbackResponse,
)
async def update_feedback_endpoint(
    feedback_id: UUID,
    body: FeedbackUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    feedback = await update_feedback(
        db, feedback_id, body.model_dump(exclude_unset=True)
    )
    return FeedbackResponse.model_validate(feedback)


@router.delete(
    "/api/feedback/{feedback_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_feedback_endpoint(
    feedback_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_feedback(db, feedback_id)


@router.post(
    "/api/feedback/{feedback_id}/analyze",
    response_model=AnalysisResponse,
)
async def analyze_feedback_endpoint(
    feedback_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = await analyze_feedback(db, feedback_id)
    return AnalysisResponse(
        feedback_id=feedback_id,
        analysis=AnalysisResult(**analysis),
    )


@router.get(
    "/api/feedback/{feedback_id}/analysis",
    response_model=AnalysisResponse,
)
async def get_analysis_endpoint(
    feedback_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = await get_analysis(db, feedback_id)
    return AnalysisResponse(
        feedback_id=feedback_id,
        analysis=AnalysisResult(**analysis),
    )


@router.post(
    "/api/feedback/{feedback_id}/suggest-rules",
    response_model=RuleSuggestionsResponse,
)
async def suggest_rules_endpoint(
    feedback_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    suggestions = await suggest_rules(db, feedback_id)
    return RuleSuggestionsResponse(
        feedback_id=feedback_id,
        suggestions=[RuleSuggestion(**s) for s in suggestions],
    )


@router.get(
    "/api/feedback/{feedback_id}/suggested-rules",
    response_model=RuleSuggestionsResponse,
)
async def get_suggested_rules_endpoint(
    feedback_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    suggestions = await get_suggested_rules(db, feedback_id)
    return RuleSuggestionsResponse(
        feedback_id=feedback_id,
        suggestions=[RuleSuggestion(**s) for s in suggestions],
    )


@router.patch(
    "/api/feedback/{feedback_id}/mark-processed",
    response_model=FeedbackResponse,
)
async def mark_processed_endpoint(
    feedback_id: UUID,
    body: MarkProcessedRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    feedback = await mark_processed(
        db,
        feedback_id,
        user_id=current_user.id,
        processing_notes=body.processing_notes,
    )
    return FeedbackResponse.model_validate(feedback)
