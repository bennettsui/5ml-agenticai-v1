"""
Business logic for FeedbackEvent CRUD and AI analysis orchestration.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.feedback.analyzer import FeedbackAnalyzer
from app.models import Client, FeedbackEvent

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


async def _get_feedback_or_404(
    db: AsyncSession, feedback_id: UUID
) -> FeedbackEvent:
    result = await db.execute(
        select(FeedbackEvent).where(FeedbackEvent.id == feedback_id)
    )
    feedback = result.scalars().first()
    if feedback is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback event {feedback_id} not found.",
        )
    return feedback


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


async def create_feedback(db: AsyncSession, data: dict) -> FeedbackEvent:
    await _get_client_or_404(db, data["client_id"])
    feedback = FeedbackEvent(**data)
    db.add(feedback)
    await db.flush()
    await db.refresh(feedback)
    return feedback


async def list_feedback(
    db: AsyncSession,
    *,
    client_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    sentiment: Optional[str] = None,
    feedback_status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[FeedbackEvent], int]:
    stmt = select(FeedbackEvent)
    count_stmt = select(func.count(FeedbackEvent.id))

    if client_id:
        stmt = stmt.where(FeedbackEvent.client_id == client_id)
        count_stmt = count_stmt.where(FeedbackEvent.client_id == client_id)
    if project_id:
        stmt = stmt.where(FeedbackEvent.project_id == project_id)
        count_stmt = count_stmt.where(FeedbackEvent.project_id == project_id)
    if sentiment:
        stmt = stmt.where(FeedbackEvent.sentiment == sentiment)
        count_stmt = count_stmt.where(FeedbackEvent.sentiment == sentiment)
    if feedback_status:
        stmt = stmt.where(FeedbackEvent.status == feedback_status)
        count_stmt = count_stmt.where(FeedbackEvent.status == feedback_status)
    if date_from:
        stmt = stmt.where(FeedbackEvent.date >= date_from)
        count_stmt = count_stmt.where(FeedbackEvent.date >= date_from)
    if date_to:
        stmt = stmt.where(FeedbackEvent.date <= date_to)
        count_stmt = count_stmt.where(FeedbackEvent.date <= date_to)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    offset = (page - 1) * limit
    stmt = stmt.order_by(FeedbackEvent.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    items = list(result.scalars().all())

    return items, total


async def get_feedback(db: AsyncSession, feedback_id: UUID) -> FeedbackEvent:
    return await _get_feedback_or_404(db, feedback_id)


async def update_feedback(
    db: AsyncSession, feedback_id: UUID, data: dict
) -> FeedbackEvent:
    feedback = await _get_feedback_or_404(db, feedback_id)
    for field, value in data.items():
        if value is not None:
            setattr(feedback, field, value)
    await db.flush()
    await db.refresh(feedback)
    return feedback


async def delete_feedback(db: AsyncSession, feedback_id: UUID) -> None:
    feedback = await _get_feedback_or_404(db, feedback_id)
    await db.delete(feedback)
    await db.flush()


# ---------------------------------------------------------------------------
# AI Analysis
# ---------------------------------------------------------------------------


async def analyze_feedback(
    db: AsyncSession, feedback_id: UUID
) -> dict:
    """Run AI analysis on a feedback event and persist results."""
    feedback = await _get_feedback_or_404(db, feedback_id)

    analysis = await FeedbackAnalyzer.analyze(feedback.raw_text)

    feedback.sentiment = analysis.get("sentiment")
    feedback.sentiment_score = analysis.get("sentiment_score")
    feedback.topics = analysis.get("topics")
    feedback.severity = analysis.get("severity")
    feedback.extracted_requirements = analysis.get("extracted_requirements")

    await db.flush()
    await db.refresh(feedback)
    return analysis


async def get_analysis(db: AsyncSession, feedback_id: UUID) -> dict:
    """Return persisted analysis for a feedback event."""
    feedback = await _get_feedback_or_404(db, feedback_id)
    if feedback.sentiment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis available. Trigger analysis first via POST.",
        )
    return {
        "sentiment": feedback.sentiment,
        "sentiment_score": feedback.sentiment_score,
        "topics": feedback.topics,
        "severity": feedback.severity,
        "extracted_requirements": feedback.extracted_requirements,
    }


async def suggest_rules(db: AsyncSession, feedback_id: UUID) -> list[dict]:
    """Use AI to suggest rules from feedback. Analysis must exist."""
    feedback = await _get_feedback_or_404(db, feedback_id)
    suggestions = await FeedbackAnalyzer.suggest_rules(
        raw_text=feedback.raw_text,
        extracted_requirements=feedback.extracted_requirements,
    )
    return suggestions


async def get_suggested_rules(db: AsyncSession, feedback_id: UUID) -> list[dict]:
    """Generate rule suggestions on the fly (no persistence)."""
    feedback = await _get_feedback_or_404(db, feedback_id)
    if feedback.extracted_requirements is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis available. Trigger analysis first.",
        )
    suggestions = await FeedbackAnalyzer.suggest_rules(
        raw_text=feedback.raw_text,
        extracted_requirements=feedback.extracted_requirements,
    )
    return suggestions


async def mark_processed(
    db: AsyncSession,
    feedback_id: UUID,
    user_id: UUID,
    processing_notes: Optional[str] = None,
) -> FeedbackEvent:
    """Mark a feedback event as reviewed/processed."""
    feedback = await _get_feedback_or_404(db, feedback_id)
    feedback.status = "reviewed"
    feedback.processed_by = user_id
    feedback.processed_at = datetime.now(timezone.utc)
    if processing_notes is not None:
        feedback.processing_notes = processing_notes
    await db.flush()
    await db.refresh(feedback)
    return feedback
