"""
Chatbot API endpoint with Claude tool_use integration.

Provides a conversational AI assistant that can query and modify CRM data
using Anthropic's tool_use API. Supports multi-turn conversations with
automatic tool execution loops.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.chatbot.tools import TOOLS, execute_tool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chatbot"])

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are an AI assistant for a Client CRM and Knowledge Base system used by a creative agency. You help team members manage client relationships efficiently.

You can:
1. Search and view client information (query_clients, get_client_details)
2. Update client records (update_client)
3. Log and review client feedback (create_feedback, get_feedback)
4. Manage projects (create_project, list_projects)
5. View and create client rules/preferences (get_rules, create_rule)
6. View brand profiles (get_brand_profile)

Guidelines:
- Be concise and helpful. Format responses clearly.
- When listing data, use clean formatting with key details.
- If asked about a client, search for them first using query_clients.
- When creating records, confirm the action was successful.
- You can respond in both English and Chinese (Traditional) depending on what the user writes in.
- If you don't have enough information to complete an action, ask the user for clarification.
- Never make up data - always use the tools to query real data."""

# Maximum number of tool-use round-trips to prevent infinite loops
MAX_TOOL_ROUNDS = 5


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class ChatMessageInput(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessageInput]
    session_id: str | None = None


class ChatResponse(BaseModel):
    message: str
    session_id: str
    tool_calls: list[dict[str, Any]] | None = None


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Process a chat message with Claude, executing CRM tools as needed."""

    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key not configured",
        )

    session_id = request.session_id or str(uuid.uuid4())

    # Build messages for Claude
    messages: list[dict[str, Any]] = [
        {"role": m.role, "content": m.content}
        for m in request.messages
    ]

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    all_tool_calls: list[dict[str, Any]] = []
    final_text = ""

    # Tool-use loop: Claude may request multiple rounds of tools
    for _round in range(MAX_TOOL_ROUNDS):
        try:
            response = await client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                messages=messages,
                tools=TOOLS,
            )
        except anthropic.APIError as e:
            logger.error(f"Anthropic API error: {e}")
            raise HTTPException(status_code=502, detail="AI service error")

        # Check if Claude wants to use tools
        if response.stop_reason == "tool_use":
            # Collect tool results
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    tool_result = await execute_tool(block.name, block.input, db)
                    all_tool_calls.append({
                        "tool": block.name,
                        "input": block.input,
                        "result_preview": tool_result[:200] if len(tool_result) > 200 else tool_result,
                    })
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": tool_result,
                    })

            # Continue the conversation with tool results
            # Serialize content blocks properly for the API
            assistant_content = []
            for block in response.content:
                if block.type == "text":
                    assistant_content.append({"type": "text", "text": block.text})
                elif block.type == "tool_use":
                    assistant_content.append({
                        "type": "tool_use",
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    })

            messages.append({"role": "assistant", "content": assistant_content})
            messages.append({"role": "user", "content": tool_results})
        else:
            # No more tool calls - extract final text
            for block in response.content:
                if hasattr(block, "text"):
                    final_text = block.text
                    break
            break
    else:
        # Exceeded max rounds
        final_text = "I've completed the maximum number of operations. Please check the results and let me know if you need anything else."

    return ChatResponse(
        message=final_text,
        session_id=session_id,
        tool_calls=all_tool_calls if all_tool_calls else None,
    )
