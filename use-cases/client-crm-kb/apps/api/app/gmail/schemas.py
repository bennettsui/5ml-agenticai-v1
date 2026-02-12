"""
Pydantic v2 schemas for Gmail integration endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


class GmailAuthResponse(BaseModel):
    """Response containing the Google OAuth consent URL."""

    auth_url: str


# ---------------------------------------------------------------------------
# Sync
# ---------------------------------------------------------------------------


class GmailSyncRequest(BaseModel):
    """Request body for triggering an email sync."""

    client_id: Optional[UUID] = Field(
        default=None,
        description="Optionally limit sync to emails matching a specific client.",
    )
    max_results: int = Field(
        default=20,
        ge=1,
        le=200,
        description="Maximum number of emails to fetch from Gmail.",
    )


class GmailSyncResponse(BaseModel):
    """Summary returned after a sync operation completes."""

    synced_count: int = Field(description="Total emails fetched from Gmail.")
    new_feedback_count: int = Field(
        description="Number of new FeedbackEvent records created."
    )
    matched_clients: list[str] = Field(
        default_factory=list,
        description="Client names that were matched from sender emails.",
    )
    errors: list[str] = Field(
        default_factory=list,
        description="Non-fatal errors encountered during sync.",
    )


# ---------------------------------------------------------------------------
# Status
# ---------------------------------------------------------------------------


class GmailStatus(BaseModel):
    """Current Gmail integration status."""

    connected: bool = Field(
        description="Whether valid Gmail credentials are stored."
    )
    email: Optional[str] = Field(
        default=None,
        description="The Gmail account email address, if connected.",
    )
    last_sync_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp of the most recent sync operation.",
    )
    total_synced: int = Field(
        default=0,
        description="Cumulative number of emails synced.",
    )


# ---------------------------------------------------------------------------
# Synced Email Detail
# ---------------------------------------------------------------------------


class SyncedEmail(BaseModel):
    """A single synced email with its AI analysis results."""

    id: str = Field(description="Gmail message ID.")
    subject: Optional[str] = None
    from_email: Optional[str] = None
    date: Optional[datetime] = None
    client_name: Optional[str] = Field(
        default=None,
        description="Matched CRM client name, if any.",
    )
    sentiment: Optional[str] = Field(
        default=None,
        description="AI-detected sentiment (positive/neutral/negative).",
    )
    topics: list[str] = Field(
        default_factory=list,
        description="AI-extracted topic keywords.",
    )
    created_feedback_id: Optional[UUID] = Field(
        default=None,
        description="ID of the FeedbackEvent created from this email, if any.",
    )
