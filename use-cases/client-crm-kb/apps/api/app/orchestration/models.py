"""
SQLAlchemy model for AI usage logging.

Tracks every Claude API call with token counts, cost estimates, and
circuit breaker state for the orchestration engine.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class AIUsageLog(Base):
    """Persisted log of every AI (Claude) API call made by the platform."""

    __tablename__ = "ai_usage_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    caller: Mapped[str] = mapped_column(
        String(200), nullable=False, index=True,
        comment="Service or endpoint that initiated the API call",
    )
    model: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True,
        comment="Claude model identifier (e.g. claude-sonnet-4-20250514)",
    )
    input_tokens: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    output_tokens: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    total_tokens: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    estimated_cost_usd: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )
    session_id: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True, index=True,
        comment="Session or conversation ID for grouping related calls",
    )
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="MEDIUM",
        comment="Operation priority: CRITICAL, HIGH, MEDIUM, LOW",
    )
    circuit_breaker_state: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True,
        comment="Circuit breaker state at time of call: CLOSED, OPEN, HALF_OPEN",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return (
            f"<AIUsageLog caller={self.caller} model={self.model} "
            f"tokens={self.total_tokens}>"
        )
