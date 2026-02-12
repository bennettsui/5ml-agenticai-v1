"""
Claude API wrapper for general AI operations.

Provides a thin async interface around the Anthropic Python SDK.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)

_client: Optional[anthropic.AsyncAnthropic] = None


def _get_client() -> anthropic.AsyncAnthropic:
    """Lazy-initialise a shared async Anthropic client."""
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


async def chat(
    system: str,
    user_message: str,
    *,
    model: str = "claude-sonnet-4-20250514",
    max_tokens: int = 16384,
    temperature: float = 0.3,
) -> str:
    """Simple text-in / text-out Claude call."""
    client = _get_client()
    response = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )
    return response.content[0].text


async def chat_with_tools(
    system: str,
    user_message: str,
    tools: list[dict[str, Any]],
    *,
    model: str = "claude-sonnet-4-20250514",
    max_tokens: int = 16384,
    temperature: float = 0.0,
) -> dict[str, Any]:
    """Call Claude with tool_use and return the first tool call result as a dict.

    Parameters
    ----------
    tools:
        List of Anthropic tool definitions (name, description, input_schema).
    """
    client = _get_client()
    response = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system,
        messages=[{"role": "user", "content": user_message}],
        tools=tools,
    )
    # Extract the first tool_use block
    for block in response.content:
        if block.type == "tool_use":
            return block.input
    # Fallback: if no tool_use block, try to parse the text as JSON
    for block in response.content:
        if block.type == "text":
            try:
                return json.loads(block.text)
            except (json.JSONDecodeError, ValueError):
                logger.warning(
                    "Claude did not return a tool_use block and text is not JSON."
                )
    return {}


async def extract_json(
    system: str,
    user_message: str,
    json_schema: dict[str, Any],
    *,
    model: str = "claude-sonnet-4-20250514",
    max_tokens: int = 16384,
) -> dict[str, Any]:
    """Use tool_use to force Claude to return structured JSON matching a schema."""
    tool = {
        "name": "structured_output",
        "description": "Return the analysis result as structured JSON.",
        "input_schema": json_schema,
    }
    return await chat_with_tools(
        system=system,
        user_message=user_message,
        tools=[tool],
        model=model,
        max_tokens=max_tokens,
    )
