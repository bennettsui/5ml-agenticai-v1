"""
Health score calculation service.

Calculates a client's health score (0-100) based on:
- Recent feedback sentiment (positive boosts, negative drops, capped at +/-30)
- Unresolved critical/major feedback penalties
- Project delays penalty
- Inactivity penalty (no feedback or project activity in 60+ days)

Saves the computed score to health_score_history and updates client.health_score.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Client,
    FeedbackEvent,
    HealthScoreHistory,
    Project,
    ProjectMilestone,
)

logger = logging.getLogger(__name__)

# Scoring constants
BASE_SCORE = 70
SENTIMENT_CAP = 30
CRITICAL_PENALTY = 15
MAJOR_PENALTY = 8
DELAY_PENALTY_PER_MILESTONE = 5
DELAY_PENALTY_CAP = 20
INACTIVITY_THRESHOLD_DAYS = 60
INACTIVITY_PENALTY = 15
FEEDBACK_LOOKBACK_DAYS = 90


async def calculate_health_score(
    db: AsyncSession,
    client_id: UUID,
) -> dict:
    """Calculate and persist a health score for the given client.

    Returns a dict with score, factors breakdown, and recorded_at timestamp.
    """
    # Verify client
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalars().first()
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client {client_id} not found.",
        )

    now = datetime.now(timezone.utc)
    lookback = now - timedelta(days=FEEDBACK_LOOKBACK_DAYS)

    # --- Factor 1: Recent feedback sentiment ---
    fb_result = await db.execute(
        select(FeedbackEvent).where(
            FeedbackEvent.client_id == client_id,
            FeedbackEvent.date >= lookback.date(),
            FeedbackEvent.sentiment.isnot(None),
        )
    )
    recent_feedback = list(fb_result.scalars().all())

    sentiment_adjustment = 0
    positive_count = 0
    negative_count = 0
    neutral_count = 0

    for fb in recent_feedback:
        if fb.sentiment == "positive":
            positive_count += 1
            sentiment_adjustment += 5
        elif fb.sentiment == "negative":
            negative_count += 1
            sentiment_adjustment -= 8
        else:
            neutral_count += 1

    # Cap the sentiment impact
    sentiment_adjustment = max(-SENTIMENT_CAP, min(SENTIMENT_CAP, sentiment_adjustment))

    # --- Factor 2: Unresolved critical/major feedback ---
    unresolved_result = await db.execute(
        select(func.count(FeedbackEvent.id)).where(
            FeedbackEvent.client_id == client_id,
            FeedbackEvent.status.in_(["new"]),
            FeedbackEvent.severity.in_(["critical", "major"]),
        )
    )
    unresolved_critical_major = unresolved_result.scalar() or 0

    unresolved_penalty = 0
    # Count critical vs major separately for more granular penalty
    critical_result = await db.execute(
        select(func.count(FeedbackEvent.id)).where(
            FeedbackEvent.client_id == client_id,
            FeedbackEvent.status == "new",
            FeedbackEvent.severity == "critical",
        )
    )
    critical_count = critical_result.scalar() or 0

    major_result = await db.execute(
        select(func.count(FeedbackEvent.id)).where(
            FeedbackEvent.client_id == client_id,
            FeedbackEvent.status == "new",
            FeedbackEvent.severity == "major",
        )
    )
    major_count = major_result.scalar() or 0

    unresolved_penalty = (critical_count * CRITICAL_PENALTY) + (
        major_count * MAJOR_PENALTY
    )

    # --- Factor 3: Project delays ---
    delayed_result = await db.execute(
        select(func.count(ProjectMilestone.id))
        .join(Project, ProjectMilestone.project_id == Project.id)
        .where(
            Project.client_id == client_id,
            Project.status == "in_progress",
            ProjectMilestone.status == "delayed",
        )
    )
    delayed_milestones = delayed_result.scalar() or 0
    delay_penalty = min(
        delayed_milestones * DELAY_PENALTY_PER_MILESTONE, DELAY_PENALTY_CAP
    )

    # --- Factor 4: Inactivity ---
    inactivity_cutoff = now - timedelta(days=INACTIVITY_THRESHOLD_DAYS)

    latest_fb_result = await db.execute(
        select(func.max(FeedbackEvent.created_at)).where(
            FeedbackEvent.client_id == client_id
        )
    )
    latest_fb_date = latest_fb_result.scalar()

    latest_project_result = await db.execute(
        select(func.max(Project.updated_at)).where(
            Project.client_id == client_id
        )
    )
    latest_project_date = latest_project_result.scalar()

    latest_activity = None
    if latest_fb_date and latest_project_date:
        latest_activity = max(latest_fb_date, latest_project_date)
    elif latest_fb_date:
        latest_activity = latest_fb_date
    elif latest_project_date:
        latest_activity = latest_project_date

    inactivity_penalty_value = 0
    if latest_activity is None:
        inactivity_penalty_value = INACTIVITY_PENALTY
    else:
        if latest_activity.tzinfo is None:
            latest_activity = latest_activity.replace(tzinfo=timezone.utc)
        if latest_activity < inactivity_cutoff:
            inactivity_penalty_value = INACTIVITY_PENALTY

    # --- Calculate final score ---
    score = BASE_SCORE + sentiment_adjustment - unresolved_penalty - delay_penalty - inactivity_penalty_value
    score = max(0, min(100, score))

    factors = {
        "base_score": BASE_SCORE,
        "sentiment_adjustment": sentiment_adjustment,
        "sentiment_detail": {
            "positive": positive_count,
            "neutral": neutral_count,
            "negative": negative_count,
            "total_recent": len(recent_feedback),
        },
        "unresolved_penalty": unresolved_penalty,
        "unresolved_detail": {
            "critical": critical_count,
            "major": major_count,
        },
        "delay_penalty": delay_penalty,
        "delayed_milestones": delayed_milestones,
        "inactivity_penalty": inactivity_penalty_value,
        "latest_activity": str(latest_activity) if latest_activity else None,
    }

    # Save to history
    history_entry = HealthScoreHistory(
        client_id=client_id,
        score=score,
        factors=factors,
    )
    db.add(history_entry)

    # Update client
    client.health_score = score
    await db.flush()
    await db.refresh(history_entry)

    return {
        "client_id": client_id,
        "health_score": score,
        "factors": factors,
        "recorded_at": history_entry.recorded_at,
    }


async def get_health_history(
    db: AsyncSession,
    client_id: UUID,
    limit: int = 30,
) -> dict:
    """Return the current health score plus recent history."""
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalars().first()
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client {client_id} not found.",
        )

    history_result = await db.execute(
        select(HealthScoreHistory)
        .where(HealthScoreHistory.client_id == client_id)
        .order_by(HealthScoreHistory.recorded_at.desc())
        .limit(limit)
    )
    history = list(history_result.scalars().all())

    return {
        "client_id": client_id,
        "current_score": client.health_score,
        "history": history,
    }
