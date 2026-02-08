"""
FastAPI router for Gmail integration endpoints.

Provides OAuth2 authentication, email sync triggers, and sync status/results.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.gmail.schemas import (
    GmailAuthResponse,
    GmailStatus,
    GmailSyncRequest,
    GmailSyncResponse,
    SyncedEmail,
)
from app.gmail.service import (
    authorize_url,
    get_sync_status,
    get_synced_emails,
    handle_callback,
    sync_emails,
)

router = APIRouter(prefix="/api/gmail", tags=["gmail"])


@router.get(
    "/auth",
    response_model=GmailAuthResponse,
    summary="Get Google OAuth authorization URL",
)
async def gmail_auth():
    """Return the Google OAuth consent URL the user must visit to connect Gmail."""
    try:
        url = authorize_url()
        return GmailAuthResponse(auth_url=url)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate authorization URL: {exc}",
        )


@router.get(
    "/callback",
    summary="OAuth callback handler",
)
async def gmail_callback(
    code: str = Query(..., description="Authorization code from Google"),
):
    """Exchange the Google OAuth authorization code for tokens and store them."""
    try:
        result = handle_callback(code)
        return {
            "success": result.get("success", False),
            "email": result.get("email"),
            "message": "Gmail account connected successfully.",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth callback failed: {exc}",
        )


@router.post(
    "/sync",
    response_model=GmailSyncResponse,
    summary="Trigger email sync",
)
async def gmail_sync(
    body: Optional[GmailSyncRequest] = None,
    db: AsyncSession = Depends(get_db),
):
    """Fetch recent emails from the connected Gmail account, match them to CRM
    clients, analyse with AI, and create FeedbackEvent records."""
    request = body or GmailSyncRequest()
    try:
        result = await sync_emails(
            db,
            client_id=request.client_id,
            max_results=request.max_results,
        )
        return GmailSyncResponse(**result)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {exc}",
        )


@router.get(
    "/status",
    response_model=GmailStatus,
    summary="Get Gmail sync status",
)
async def gmail_status(
    db: AsyncSession = Depends(get_db),
):
    """Return the current Gmail integration status including connection info,
    last sync time, and total emails synced."""
    try:
        result = await get_sync_status(db)
        return GmailStatus(
            connected=result["connected"],
            email=result.get("email"),
            last_sync_at=result.get("last_sync_at"),
            total_synced=result.get("total_synced", 0),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve status: {exc}",
        )


@router.get(
    "/emails",
    response_model=list[SyncedEmail],
    summary="List recently synced emails",
)
async def gmail_emails():
    """Return the list of emails from the most recent sync operation with
    their AI analysis results."""
    try:
        emails = get_synced_emails()
        return [SyncedEmail(**e) for e in emails]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve synced emails: {exc}",
        )
