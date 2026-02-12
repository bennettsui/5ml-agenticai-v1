"""
CRM tool definitions and execution for the AI chatbot.

Each tool maps to a real CRM operation (query clients, update records, etc.)
and is exposed to Claude via the Anthropic tool_use API.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Client,
    Contact,
    Project,
    FeedbackEvent,
    ClientRule,
    BrandProfile,
    Pattern,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Tool definitions (Anthropic format)
# ---------------------------------------------------------------------------

TOOLS = [
    {
        "name": "query_clients",
        "description": "Search for clients by name, status, or industry. Returns matching client records.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Client name to search for (partial match)",
                },
                "status": {
                    "type": "string",
                    "description": "Filter by status: active, prospect, dormant, lost",
                },
            },
        },
    },
    {
        "name": "get_client_details",
        "description": "Get full details for a specific client including contacts, projects, and brand profile.",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {
                    "type": "string",
                    "description": "The UUID of the client",
                },
            },
            "required": ["client_id"],
        },
    },
    {
        "name": "update_client",
        "description": "Update client fields such as name, status, health_score, notes, industry, etc.",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {"type": "string"},
                "updates": {
                    "type": "object",
                    "description": "Key-value pairs of fields to update",
                },
            },
            "required": ["client_id", "updates"],
        },
    },
    {
        "name": "create_feedback",
        "description": "Log new client feedback. The system will auto-analyze sentiment and topics.",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {"type": "string"},
                "raw_text": {
                    "type": "string",
                    "description": "The feedback text from the client",
                },
                "project_id": {
                    "type": "string",
                    "description": "Optional project ID this feedback relates to",
                },
            },
            "required": ["client_id", "raw_text"],
        },
    },
    {
        "name": "get_feedback",
        "description": "Get recent feedback for a client, optionally filtered by sentiment.",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {"type": "string"},
                "sentiment": {
                    "type": "string",
                    "description": "Filter: positive, neutral, negative",
                },
            },
        },
    },
    {
        "name": "create_project",
        "description": "Create a new project for a client.",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {"type": "string"},
                "name": {"type": "string"},
                "type": {
                    "type": "string",
                    "description": "Project type: website, social_campaign, rebrand, video_series, content_production, other",
                },
            },
            "required": ["client_id", "name"],
        },
    },
    {
        "name": "list_projects",
        "description": "List projects for a client, optionally filtered by status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {"type": "string"},
                "status": {
                    "type": "string",
                    "description": "Filter: planning, in_progress, on_hold, completed, cancelled",
                },
            },
        },
    },
    {
        "name": "get_rules",
        "description": "Get client-specific rules (learned preferences and constraints).",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {"type": "string"},
                "rule_type": {
                    "type": "string",
                    "description": "Filter: hard or soft",
                },
            },
        },
    },
    {
        "name": "create_rule",
        "description": "Create a new client rule (a learned preference or constraint).",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {"type": "string"},
                "description": {
                    "type": "string",
                    "description": "The rule description",
                },
                "rule_type": {
                    "type": "string",
                    "description": "hard (must follow) or soft (preference)",
                },
                "applies_to": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Channels/contexts: social, web, video, email, etc.",
                },
            },
            "required": ["client_id", "description", "rule_type"],
        },
    },
    {
        "name": "get_brand_profile",
        "description": "Get the brand profile for a client (tone, values, do's, don'ts).",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {"type": "string"},
            },
            "required": ["client_id"],
        },
    },
]


# ---------------------------------------------------------------------------
# Tool execution
# ---------------------------------------------------------------------------

UPDATABLE_CLIENT_FIELDS = {
    "name", "legal_name", "industry", "region", "languages",
    "status", "timezone", "website_url", "company_size",
    "parent_company", "internal_notes", "client_value_tier",
    "health_score", "notes",
}


async def execute_tool(
    tool_name: str,
    tool_input: dict[str, Any],
    db: AsyncSession,
) -> str:
    """Execute a CRM tool and return the result as a JSON string."""
    try:
        result = await _dispatch(tool_name, tool_input, db)
        return json.dumps(result, default=str, ensure_ascii=False)
    except Exception as e:
        logger.exception(f"Tool execution error: {tool_name}")
        return json.dumps({"error": str(e)})


async def _dispatch(
    tool_name: str,
    inp: dict[str, Any],
    db: AsyncSession,
) -> Any:
    if tool_name == "query_clients":
        return await _query_clients(db, inp)
    elif tool_name == "get_client_details":
        return await _get_client_details(db, inp["client_id"])
    elif tool_name == "update_client":
        return await _update_client(db, inp["client_id"], inp["updates"])
    elif tool_name == "create_feedback":
        return await _create_feedback(db, inp)
    elif tool_name == "get_feedback":
        return await _get_feedback(db, inp)
    elif tool_name == "create_project":
        return await _create_project(db, inp)
    elif tool_name == "list_projects":
        return await _list_projects(db, inp)
    elif tool_name == "get_rules":
        return await _get_rules(db, inp)
    elif tool_name == "create_rule":
        return await _create_rule(db, inp)
    elif tool_name == "get_brand_profile":
        return await _get_brand_profile(db, inp["client_id"])
    else:
        return {"error": f"Unknown tool: {tool_name}"}


async def _query_clients(db: AsyncSession, inp: dict) -> list:
    query = select(Client).where(Client.deleted_at.is_(None))
    if name := inp.get("name"):
        query = query.where(Client.name.ilike(f"%{name}%"))
    if status := inp.get("status"):
        query = query.where(Client.status == status)
    query = query.order_by(Client.name).limit(10)
    result = await db.execute(query)
    clients = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "status": c.status if isinstance(c.status, str) else c.status.value,
            "health_score": c.health_score,
            "industry": c.industry or [],
            "client_value_tier": c.client_value_tier.value if c.client_value_tier else None,
        }
        for c in clients
    ]


async def _get_client_details(db: AsyncSession, client_id: str) -> dict:
    result = await db.execute(
        select(Client).where(Client.id == client_id)
    )
    client = result.scalars().first()
    if not client:
        return {"error": "Client not found"}

    # Contacts
    contacts_result = await db.execute(
        select(Contact).where(Contact.client_id == client_id).limit(20)
    )
    contacts = contacts_result.scalars().all()

    # Projects
    projects_result = await db.execute(
        select(Project).where(Project.client_id == client_id).limit(10)
    )
    projects = projects_result.scalars().all()

    # Brand profile
    bp_result = await db.execute(
        select(BrandProfile).where(BrandProfile.client_id == client_id)
    )
    brand = bp_result.scalars().first()

    return {
        "client": {
            "id": str(client.id),
            "name": client.name,
            "legal_name": client.legal_name,
            "status": client.status if isinstance(client.status, str) else client.status.value,
            "health_score": client.health_score,
            "industry": client.industry or [],
            "region": client.region or [],
            "internal_notes": client.internal_notes,
            "client_value_tier": client.client_value_tier.value if client.client_value_tier else None,
        },
        "contacts": [
            {"id": str(c.id), "name": c.name, "email": c.email, "is_primary": c.is_primary}
            for c in contacts
        ],
        "projects": [
            {
                "id": str(p.id),
                "name": p.name,
                "status": p.status if isinstance(p.status, str) else p.status.value,
            }
            for p in projects
        ],
        "brand_profile": {
            "brand_tone": brand.brand_tone,
            "brand_values": brand.brand_values,
            "do_list": brand.do_list,
            "dont_list": brand.dont_list,
        } if brand else None,
    }


async def _update_client(db: AsyncSession, client_id: str, updates: dict) -> dict:
    result = await db.execute(
        select(Client).where(Client.id == client_id)
    )
    client = result.scalars().first()
    if not client:
        return {"error": "Client not found"}

    updated_fields = []
    for key, value in updates.items():
        if key in UPDATABLE_CLIENT_FIELDS and hasattr(client, key):
            # Map "notes" to "internal_notes" for convenience
            attr_name = "internal_notes" if key == "notes" else key
            if hasattr(client, attr_name):
                setattr(client, attr_name, value)
                updated_fields.append(key)

    await db.flush()
    return {"success": True, "updated_fields": updated_fields}


async def _create_feedback(db: AsyncSession, inp: dict) -> dict:
    fb = FeedbackEvent(
        client_id=inp["client_id"],
        raw_text=inp["raw_text"],
        source="chat",
    )
    if project_id := inp.get("project_id"):
        fb.project_id = project_id
    db.add(fb)
    await db.flush()
    return {"success": True, "id": str(fb.id), "note": "Feedback created. Use the feedback analysis endpoint to analyze sentiment."}


async def _get_feedback(db: AsyncSession, inp: dict) -> list:
    query = select(FeedbackEvent)
    if client_id := inp.get("client_id"):
        query = query.where(FeedbackEvent.client_id == client_id)
    if sentiment := inp.get("sentiment"):
        query = query.where(FeedbackEvent.sentiment == sentiment)
    query = query.order_by(FeedbackEvent.created_at.desc()).limit(10)
    result = await db.execute(query)
    items = result.scalars().all()
    return [
        {
            "id": str(f.id),
            "raw_text": f.raw_text[:200],
            "sentiment": f.sentiment if isinstance(f.sentiment, str) else (f.sentiment.value if f.sentiment else None),
            "topics": f.topics,
            "created_at": str(f.created_at),
        }
        for f in items
    ]


async def _create_project(db: AsyncSession, inp: dict) -> dict:
    project = Project(
        client_id=inp["client_id"],
        name=inp["name"],
        type=inp.get("type", "other"),
    )
    db.add(project)
    await db.flush()
    return {"success": True, "id": str(project.id), "name": project.name}


async def _list_projects(db: AsyncSession, inp: dict) -> list:
    query = select(Project)
    if client_id := inp.get("client_id"):
        query = query.where(Project.client_id == client_id)
    if status := inp.get("status"):
        query = query.where(Project.status == status)
    query = query.order_by(Project.created_at.desc()).limit(10)
    result = await db.execute(query)
    items = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "status": p.status if isinstance(p.status, str) else p.status.value,
            "created_at": str(p.created_at),
        }
        for p in items
    ]


async def _get_rules(db: AsyncSession, inp: dict) -> list:
    query = select(ClientRule)
    if client_id := inp.get("client_id"):
        query = query.where(ClientRule.client_id == client_id)
    if rule_type := inp.get("rule_type"):
        query = query.where(ClientRule.rule_type == rule_type)
    query = query.where(ClientRule.status == "active").limit(20)
    result = await db.execute(query)
    items = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "description": r.description,
            "rule_type": r.rule_type if isinstance(r.rule_type, str) else r.rule_type.value,
            "applies_to": r.applies_to,
            "priority": r.priority,
        }
        for r in items
    ]


async def _create_rule(db: AsyncSession, inp: dict) -> dict:
    rule = ClientRule(
        client_id=inp["client_id"],
        description=inp["description"],
        rule_type=inp["rule_type"],
        applies_to=inp.get("applies_to"),
    )
    db.add(rule)
    await db.flush()
    return {"success": True, "id": str(rule.id)}


async def _get_brand_profile(db: AsyncSession, client_id: str) -> dict:
    result = await db.execute(
        select(BrandProfile).where(BrandProfile.client_id == client_id)
    )
    bp = result.scalars().first()
    if not bp:
        return {"message": "No brand profile found for this client"}
    return {
        "brand_tone": bp.brand_tone,
        "brand_values": bp.brand_values,
        "key_messages": bp.key_messages,
        "do_list": bp.do_list,
        "dont_list": bp.dont_list,
        "legal_sensitivities": bp.legal_sensitivities,
    }
