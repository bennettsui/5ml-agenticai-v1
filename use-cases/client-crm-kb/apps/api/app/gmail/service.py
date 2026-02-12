"""
Gmail integration service using the Google API.

Handles OAuth2 authentication, email fetching, client matching, and
AI-powered email analysis to create CRM feedback records.
"""

from __future__ import annotations

import base64
import json
import logging
import os
import re
from datetime import date, datetime, timezone
from email.utils import parseaddr, parsedate_to_datetime
from pathlib import Path
from typing import Any, Optional
from uuid import UUID

from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Client, Contact, FeedbackEvent, Project
from app.utils.ai import extract_json

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
]
CREDENTIALS_PATH = Path("/tmp/gmail_credentials.json")
SYNC_STATUS_PATH = Path("/tmp/gmail_sync_status.json")


# ---------------------------------------------------------------------------
# Credential helpers
# ---------------------------------------------------------------------------


def _save_credentials(creds: Credentials) -> None:
    """Persist OAuth2 credentials to a local JSON file."""
    data = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes or SCOPES),
    }
    CREDENTIALS_PATH.write_text(json.dumps(data, indent=2))
    logger.info("Gmail credentials saved to %s", CREDENTIALS_PATH)


def _load_credentials() -> Optional[Credentials]:
    """Load stored OAuth2 credentials, refreshing if expired."""
    if not CREDENTIALS_PATH.exists():
        return None
    try:
        data = json.loads(CREDENTIALS_PATH.read_text())
        creds = Credentials(
            token=data.get("token"),
            refresh_token=data.get("refresh_token"),
            token_uri=data.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=data.get("client_id", settings.GOOGLE_CLIENT_ID),
            client_secret=data.get("client_secret", settings.GOOGLE_CLIENT_SECRET),
            scopes=data.get("scopes", SCOPES),
        )
        if creds.expired and creds.refresh_token:
            creds.refresh(GoogleAuthRequest())
            _save_credentials(creds)
        return creds
    except Exception:
        logger.exception("Failed to load Gmail credentials")
        return None


def _get_redirect_uri() -> str:
    """Resolve the Google OAuth redirect URI from settings."""
    if settings.GOOGLE_REDIRECT_URI:
        return settings.GOOGLE_REDIRECT_URI
    # Fallback: construct from API_BASE_URL
    base = settings.API_BASE_URL.rstrip("/") if settings.API_BASE_URL else ""
    return f"{base}/api/gmail/callback"


def _get_oauth_flow() -> Flow:
    """Build a Google OAuth2 flow from application settings."""
    redirect_uri = _get_redirect_uri()
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri],
        }
    }
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = redirect_uri
    return flow


# ---------------------------------------------------------------------------
# Sync status helpers
# ---------------------------------------------------------------------------


def _load_sync_status() -> dict[str, Any]:
    """Load the persistent sync-status metadata."""
    if not SYNC_STATUS_PATH.exists():
        return {"last_sync_at": None, "total_synced": 0, "email": None}
    try:
        return json.loads(SYNC_STATUS_PATH.read_text())
    except Exception:
        return {"last_sync_at": None, "total_synced": 0, "email": None}


def _save_sync_status(status: dict[str, Any]) -> None:
    SYNC_STATUS_PATH.write_text(json.dumps(status, indent=2, default=str))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def authorize_url() -> str:
    """Return the Google OAuth consent URL the user must visit."""
    flow = _get_oauth_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return auth_url


def handle_callback(code: str) -> dict[str, Any]:
    """Exchange an authorization code for tokens and persist them.

    Returns a dict with ``email`` (if available) and ``success`` flag.
    """
    flow = _get_oauth_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials
    _save_credentials(creds)

    # Try to fetch the connected email address
    email = None
    try:
        service = build("oauth2", "v2", credentials=creds)
        user_info = service.userinfo().get().execute()
        email = user_info.get("email")
    except Exception:
        logger.warning("Could not fetch user email after OAuth callback")

    # Update sync status with the connected account
    status = _load_sync_status()
    status["email"] = email
    _save_sync_status(status)

    return {"success": True, "email": email}


async def sync_emails(
    db: AsyncSession,
    *,
    client_id: Optional[UUID] = None,
    max_results: int = 20,
) -> dict[str, Any]:
    """Fetch recent emails from Gmail, match to CRM clients, and create feedback.

    Parameters
    ----------
    db:
        Async database session.
    client_id:
        If provided, only create feedback for emails matching this client.
    max_results:
        Maximum number of Gmail messages to retrieve.

    Returns
    -------
    dict with keys: synced_count, new_feedback_count, matched_clients, errors
    """
    creds = _load_credentials()
    if not creds or not creds.valid:
        raise ValueError("Gmail is not connected. Please authorize first.")

    service = build("gmail", "v1", credentials=creds)

    # --- Fetch message list ---------------------------------------------------
    results = (
        service.users()
        .messages()
        .list(userId="me", maxResults=max_results, q="in:inbox")
        .execute()
    )
    messages = results.get("messages", [])

    # --- Build contact-email -> client lookup --------------------------------
    contact_query = select(Contact.email, Contact.client_id, Contact.name).where(
        Contact.email.isnot(None)
    )
    if client_id:
        contact_query = contact_query.where(Contact.client_id == client_id)
    contact_rows = (await db.execute(contact_query)).all()
    email_to_client: dict[str, UUID] = {}
    email_to_contact_name: dict[str, str] = {}
    for row in contact_rows:
        if row.email:
            normalised = row.email.strip().lower()
            email_to_client[normalised] = row.client_id
            email_to_contact_name[normalised] = row.name

    # Pre-load client names for matched IDs
    if email_to_client:
        client_ids = list(set(email_to_client.values()))
        client_rows = (
            await db.execute(
                select(Client.id, Client.name).where(Client.id.in_(client_ids))
            )
        ).all()
        client_id_to_name: dict[UUID, str] = {r.id: r.name for r in client_rows}
    else:
        client_id_to_name = {}

    # --- Fetch active projects per client (for AI context) -------------------
    if email_to_client:
        project_rows = (
            await db.execute(
                select(Project.id, Project.client_id, Project.name, Project.status)
                .where(Project.client_id.in_(list(set(email_to_client.values()))))
                .where(Project.status.in_(["planning", "in_progress"]))
            )
        ).all()
        client_projects: dict[UUID, list[dict]] = {}
        for p in project_rows:
            client_projects.setdefault(p.client_id, []).append(
                {"id": str(p.id), "name": p.name, "status": p.status}
            )
    else:
        client_projects = {}

    # --- Process each message ------------------------------------------------
    synced_emails: list[dict[str, Any]] = []
    matched_client_names: set[str] = set()
    new_feedback_count = 0
    errors: list[str] = []

    for msg_meta in messages:
        msg_id = msg_meta["id"]
        try:
            msg = (
                service.users()
                .messages()
                .get(userId="me", id=msg_id, format="full")
                .execute()
            )
            headers = {
                h["name"].lower(): h["value"]
                for h in msg.get("payload", {}).get("headers", [])
            }
            subject = headers.get("subject", "(no subject)")
            from_header = headers.get("from", "")
            date_header = headers.get("date", "")

            # Parse sender email
            _, sender_email = parseaddr(from_header)
            sender_email_lower = sender_email.strip().lower()

            # Parse date
            email_date: Optional[datetime] = None
            try:
                email_date = parsedate_to_datetime(date_header)
            except Exception:
                email_date = datetime.now(timezone.utc)

            # Extract body text
            body_text = _extract_body(msg.get("payload", {}))

            # --- Match to CRM client ----------------------------------------
            matched_cid = email_to_client.get(sender_email_lower)
            matched_name = (
                client_id_to_name.get(matched_cid) if matched_cid else None
            )

            # If filtering by client_id, skip unmatched
            if client_id and matched_cid != client_id:
                synced_emails.append(
                    {
                        "id": msg_id,
                        "subject": subject,
                        "from_email": sender_email,
                        "date": email_date.isoformat() if email_date else None,
                        "client_name": None,
                        "sentiment": None,
                        "topics": [],
                        "created_feedback_id": None,
                    }
                )
                continue

            if matched_cid:
                matched_client_names.add(matched_name or "Unknown")

            # --- AI analysis -------------------------------------------------
            analysis: dict[str, Any] = {}
            if matched_cid and body_text.strip():
                projects_ctx = client_projects.get(matched_cid, [])
                analysis = await _analyze_email(
                    subject=subject,
                    body=body_text,
                    sender=from_header,
                    client_name=matched_name or "Unknown",
                    projects=projects_ctx,
                )

            # --- Create FeedbackEvent if matched -----------------------------
            created_feedback_id: Optional[UUID] = None
            if matched_cid and body_text.strip():
                sentiment_val = analysis.get("sentiment", "neutral")
                topics_val = analysis.get("topics", [])
                project_match_name = analysis.get("project_name")
                is_actionable = analysis.get("is_actionable", False)

                # Try to resolve project_id from name
                resolved_project_id: Optional[UUID] = None
                if project_match_name and matched_cid in client_projects:
                    for proj in client_projects[matched_cid]:
                        if proj["name"].lower() == project_match_name.lower():
                            resolved_project_id = UUID(proj["id"])
                            break

                feedback = FeedbackEvent(
                    client_id=matched_cid,
                    project_id=resolved_project_id,
                    source="email",
                    date=email_date.date() if email_date else date.today(),
                    raw_text=f"Subject: {subject}\n\n{body_text[:5000]}",
                    sentiment=sentiment_val,
                    topics=topics_val if topics_val else None,
                    extracted_requirements=analysis.get(
                        "extracted_requirements"
                    ),
                    severity=analysis.get("severity", "info"),
                )
                db.add(feedback)
                await db.flush()
                created_feedback_id = feedback.id
                new_feedback_count += 1

            synced_emails.append(
                {
                    "id": msg_id,
                    "subject": subject,
                    "from_email": sender_email,
                    "date": email_date.isoformat() if email_date else None,
                    "client_name": matched_name,
                    "sentiment": analysis.get("sentiment"),
                    "topics": analysis.get("topics", []),
                    "created_feedback_id": (
                        str(created_feedback_id) if created_feedback_id else None
                    ),
                }
            )

        except Exception as exc:
            logger.exception("Error processing Gmail message %s", msg_id)
            errors.append(f"Message {msg_id}: {exc}")

    # --- Update sync status --------------------------------------------------
    status = _load_sync_status()
    status["last_sync_at"] = datetime.now(timezone.utc).isoformat()
    status["total_synced"] = status.get("total_synced", 0) + len(messages)
    status["last_synced_emails"] = synced_emails
    _save_sync_status(status)

    return {
        "synced_count": len(messages),
        "new_feedback_count": new_feedback_count,
        "matched_clients": sorted(matched_client_names),
        "errors": errors,
    }


async def get_sync_status(db: AsyncSession) -> dict[str, Any]:
    """Return the current sync status including connection info.

    Parameters
    ----------
    db:
        Async database session (used to count total feedback from email source).
    """
    creds = _load_credentials()
    status = _load_sync_status()

    # Count total email-sourced feedback in DB
    result = await db.execute(
        select(func.count()).select_from(FeedbackEvent).where(
            FeedbackEvent.source == "email"
        )
    )
    db_email_count = result.scalar() or 0

    return {
        "connected": creds is not None and creds.valid if creds else False,
        "email": status.get("email"),
        "last_sync_at": status.get("last_sync_at"),
        "total_synced": status.get("total_synced", 0),
        "total_feedback_from_email": db_email_count,
    }


def get_synced_emails() -> list[dict[str, Any]]:
    """Return the list of emails from the last sync operation."""
    status = _load_sync_status()
    return status.get("last_synced_emails", [])


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _extract_body(payload: dict[str, Any]) -> str:
    """Recursively extract plain-text body from a Gmail message payload."""
    mime_type = payload.get("mimeType", "")
    parts = payload.get("parts", [])

    if mime_type == "text/plain" and "body" in payload:
        data = payload["body"].get("data", "")
        if data:
            return base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")

    if parts:
        # Prefer text/plain, fall back to text/html
        for part in parts:
            if part.get("mimeType") == "text/plain":
                text = _extract_body(part)
                if text:
                    return text
        for part in parts:
            text = _extract_body(part)
            if text:
                return text

    if "body" in payload:
        data = payload["body"].get("data", "")
        if data:
            raw = base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
            # Strip HTML tags if the body is HTML
            if mime_type == "text/html":
                raw = re.sub(r"<[^>]+>", " ", raw)
                raw = re.sub(r"\s+", " ", raw).strip()
            return raw

    return ""


async def _analyze_email(
    *,
    subject: str,
    body: str,
    sender: str,
    client_name: str,
    projects: list[dict[str, Any]],
) -> dict[str, Any]:
    """Use Claude AI to extract structured insights from an email.

    Returns a dict with keys: sentiment, topics, project_name,
    is_actionable, severity, extracted_requirements.
    """
    projects_text = ""
    if projects:
        project_lines = [f"  - {p['name']} (status: {p['status']})" for p in projects]
        projects_text = "Active projects for this client:\n" + "\n".join(project_lines)

    system_prompt = (
        "You are an AI assistant that analyzes client emails for a CRM system. "
        "Extract structured insights from the email below. Be concise and accurate."
    )

    user_message = (
        f"Analyze this email from a contact at client '{client_name}'.\n\n"
        f"From: {sender}\n"
        f"Subject: {subject}\n\n"
        f"Body:\n{body[:3000]}\n\n"
        f"{projects_text}\n\n"
        "Extract the following information about this email."
    )

    json_schema: dict[str, Any] = {
        "type": "object",
        "properties": {
            "sentiment": {
                "type": "string",
                "enum": ["positive", "neutral", "negative"],
                "description": "Overall sentiment of the email.",
            },
            "topics": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Key topics or themes mentioned (max 5).",
            },
            "project_name": {
                "type": ["string", "null"],
                "description": (
                    "Name of the project this email relates to, "
                    "matching one of the active projects if applicable. "
                    "null if no project match."
                ),
            },
            "is_actionable": {
                "type": "boolean",
                "description": "Whether the email contains actionable feedback or requests.",
            },
            "severity": {
                "type": "string",
                "enum": ["info", "minor", "major", "critical"],
                "description": "Severity/urgency of the feedback.",
            },
            "extracted_requirements": {
                "type": "object",
                "properties": {
                    "action_items": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Specific action items or requests.",
                    },
                    "concerns": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Any concerns or issues raised.",
                    },
                    "positive_notes": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Positive feedback or compliments.",
                    },
                    "status_updates": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Project or status updates mentioned.",
                    },
                },
                "required": [
                    "action_items",
                    "concerns",
                    "positive_notes",
                    "status_updates",
                ],
                "description": "Structured requirements extracted from the email.",
            },
        },
        "required": [
            "sentiment",
            "topics",
            "project_name",
            "is_actionable",
            "severity",
            "extracted_requirements",
        ],
    }

    try:
        result = await extract_json(
            system=system_prompt,
            user_message=user_message,
            json_schema=json_schema,
        )
        return result
    except Exception:
        logger.exception("AI analysis of email failed")
        return {
            "sentiment": "neutral",
            "topics": [],
            "project_name": None,
            "is_actionable": False,
            "severity": "info",
            "extracted_requirements": {
                "action_items": [],
                "concerns": [],
                "positive_notes": [],
                "status_updates": [],
            },
        }
