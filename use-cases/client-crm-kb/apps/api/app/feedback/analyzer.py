"""
FeedbackAnalyzer: uses the Anthropic Claude API with tool_use
to extract structured sentiment, topics, severity and requirements
from raw feedback text, and to suggest rules.
"""

from __future__ import annotations

import logging
from typing import Any

from app.utils.ai import chat_with_tools

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tool schemas
# ---------------------------------------------------------------------------

_ANALYSIS_TOOL = {
    "name": "feedback_analysis",
    "description": (
        "Return structured analysis of the client feedback including "
        "sentiment, sentiment score, topics, severity, and extracted requirements."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "sentiment": {
                "type": "string",
                "enum": ["positive", "neutral", "negative"],
                "description": "Overall sentiment of the feedback.",
            },
            "sentiment_score": {
                "type": "integer",
                "description": (
                    "Numeric sentiment score from -100 (most negative) "
                    "to 100 (most positive)."
                ),
            },
            "topics": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Key topics or themes mentioned in the feedback.",
            },
            "severity": {
                "type": "string",
                "enum": ["info", "minor", "major", "critical"],
                "description": "How severe the feedback issue is.",
            },
            "extracted_requirements": {
                "type": "object",
                "properties": {
                    "explicit": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Explicitly stated requirements or requests.",
                    },
                    "implicit": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Implied requirements or expectations.",
                    },
                    "constraints": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Constraints or limitations mentioned.",
                    },
                },
                "required": ["explicit", "implicit", "constraints"],
                "description": "Structured extraction of requirements from the feedback.",
            },
        },
        "required": [
            "sentiment",
            "sentiment_score",
            "topics",
            "severity",
            "extracted_requirements",
        ],
    },
}

_SUGGEST_RULES_TOOL = {
    "name": "suggest_rules",
    "description": (
        "Suggest client rules based on feedback analysis. Each rule should "
        "be actionable and categorised as hard (must follow) or soft (guideline)."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "rules": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "description": {
                            "type": "string",
                            "description": "Clear description of the rule.",
                        },
                        "rule_type": {
                            "type": "string",
                            "enum": ["hard", "soft"],
                            "description": "Whether this is a hard rule or soft guideline.",
                        },
                        "applies_to": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Deliverable types this rule applies to.",
                        },
                        "priority": {
                            "type": "integer",
                            "description": "Priority from 1 (highest) to 5 (lowest).",
                        },
                        "reasoning": {
                            "type": "string",
                            "description": "Why this rule is suggested based on the feedback.",
                        },
                    },
                    "required": [
                        "description",
                        "rule_type",
                        "priority",
                        "reasoning",
                    ],
                },
                "description": "List of suggested rules.",
            },
        },
        "required": ["rules"],
    },
}


# ---------------------------------------------------------------------------
# FeedbackAnalyzer
# ---------------------------------------------------------------------------


class FeedbackAnalyzer:
    """Stateless analyzer that wraps Claude tool_use calls."""

    @staticmethod
    async def analyze(raw_text: str) -> dict[str, Any]:
        """Analyze raw feedback text and return structured analysis.

        Returns a dict with keys: sentiment, sentiment_score, topics,
        severity, extracted_requirements.
        """
        result = await chat_with_tools(
            system=(
                "You are an expert client feedback analyst for a creative agency. "
                "Analyze the following feedback from a client and return structured "
                "analysis using the feedback_analysis tool. Be precise about "
                "sentiment scoring and severity classification."
            ),
            user_message=f"Analyze this client feedback:\n\n{raw_text}",
            tools=[_ANALYSIS_TOOL],
        )
        return result

    @staticmethod
    async def suggest_rules(
        raw_text: str,
        extracted_requirements: dict | None = None,
    ) -> list[dict[str, Any]]:
        """Suggest actionable rules from feedback and its extracted requirements.

        Returns a list of rule suggestion dicts.
        """
        context_parts = [f"Original feedback:\n{raw_text}"]
        if extracted_requirements:
            context_parts.append(
                f"\nExtracted requirements:\n"
                f"Explicit: {extracted_requirements.get('explicit', [])}\n"
                f"Implicit: {extracted_requirements.get('implicit', [])}\n"
                f"Constraints: {extracted_requirements.get('constraints', [])}"
            )

        result = await chat_with_tools(
            system=(
                "You are an expert at converting client feedback into actionable "
                "rules for a creative agency. Based on the feedback and extracted "
                "requirements, suggest concrete rules that the team should follow "
                "when working with this client. Use the suggest_rules tool."
            ),
            user_message="\n".join(context_parts),
            tools=[_SUGGEST_RULES_TOOL],
        )
        return result.get("rules", [])
