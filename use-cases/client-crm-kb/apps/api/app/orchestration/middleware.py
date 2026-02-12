"""
FastAPI middleware for the AI orchestration engine.

Intercepts requests to AI-powered endpoints, enforces circuit breaker
policy, logs token usage, auto-downgrades models when approaching limits,
and injects usage headers into responses.

Usage::

    from app.orchestration.middleware import OrchestrationMiddleware
    app.add_middleware(OrchestrationMiddleware)
"""

from __future__ import annotations

import logging
import time
from typing import Set

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from .engine import OrchestrationEngine
from .schemas import CircuitBreakerState, OperationPriority

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Endpoint classification
# ---------------------------------------------------------------------------

# Map URL path prefixes to operation priorities.  More specific paths
# should appear first so the first match wins.
_PRIORITY_MAP: list[tuple[str, str]] = [
    ("/api/chatbot", "CRITICAL"),
    ("/api/feedback", "HIGH"),
    ("/api/gmail", "MEDIUM"),
    ("/api/patterns", "LOW"),
    ("/api/rules", "MEDIUM"),
    ("/api/brand", "MEDIUM"),
    ("/api/clients", "MEDIUM"),
    ("/api/contacts", "MEDIUM"),
    ("/api/contracts", "MEDIUM"),
    ("/api/projects", "MEDIUM"),
    ("/api/opportunities", "MEDIUM"),
]

# Endpoints that actually call the Claude API and therefore consume tokens.
# Non-AI endpoints pass through without orchestration checks.
_AI_ENDPOINT_PREFIXES: Set[str] = {
    "/api/chatbot",
    "/api/feedback",
    "/api/patterns",
    "/api/brand",
}


def _classify_priority(path: str) -> str:
    """Return the OperationPriority string for the given request path."""
    for prefix, priority in _PRIORITY_MAP:
        if path.startswith(prefix):
            return priority
    return "MEDIUM"


def _is_ai_endpoint(path: str) -> bool:
    """Return True if the request path corresponds to an AI-powered endpoint."""
    return any(path.startswith(prefix) for prefix in _AI_ENDPOINT_PREFIXES)


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

class OrchestrationMiddleware(BaseHTTPMiddleware):
    """Starlette middleware wrapping AI-powered endpoints.

    For every request to an AI endpoint the middleware:
    1. Checks whether the circuit breaker allows the call.
    2. Determines the recommended model and stores it in ``request.state``.
    3. After the response, records usage (token counts are expected to be
       set on ``request.state`` by the endpoint handler).
    4. Adds informational headers to the response.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        path: str = request.url.path

        # Skip non-AI endpoints and the orchestration API itself
        if not _is_ai_endpoint(path) or path.startswith("/api/orchestration"):
            return await call_next(request)

        engine = OrchestrationEngine.get_instance()
        priority = _classify_priority(path)

        # --- Pre-flight check ------------------------------------------------
        allowed, reason = await engine.check_allowed(caller=path, priority=priority)
        if not allowed:
            logger.warning(
                "Orchestration blocked %s %s: %s",
                request.method,
                path,
                reason,
            )
            return JSONResponse(
                status_code=429,
                content={
                    "detail": reason or "Request blocked by AI orchestration engine.",
                    "circuit_breaker_state": engine._cb_state.value,
                },
                headers={
                    "X-AI-Circuit-Breaker": engine._cb_state.value,
                    "Retry-After": "60",
                },
            )

        # --- Inject recommended model into request state ---------------------
        recommended_model = engine.get_recommended_model(priority=priority)
        request.state.ai_recommended_model = recommended_model
        request.state.ai_priority = priority
        # Placeholders for endpoint handlers to populate after calling Claude
        request.state.ai_input_tokens = 0
        request.state.ai_output_tokens = 0
        request.state.ai_model_used = recommended_model
        request.state.ai_session_id = None

        # --- Call the actual endpoint ----------------------------------------
        start = time.monotonic()
        response: Response = await call_next(request)
        elapsed_ms = round((time.monotonic() - start) * 1000, 2)

        # --- Record usage (from values set by the endpoint handler) ----------
        input_tokens: int = getattr(request.state, "ai_input_tokens", 0)
        output_tokens: int = getattr(request.state, "ai_output_tokens", 0)
        model_used: str = getattr(request.state, "ai_model_used", recommended_model)
        session_id: str | None = getattr(request.state, "ai_session_id", None)

        if input_tokens > 0 or output_tokens > 0:
            await engine.record_call(
                caller=path,
                model=model_used,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                session_id=session_id,
                priority=priority,
            )

        # --- Inject usage headers into response ------------------------------
        total_tokens = input_tokens + output_tokens
        status = await engine.get_status()

        response.headers["X-AI-Tokens-Used"] = str(total_tokens)
        response.headers["X-AI-Budget-Remaining"] = (
            f"tokens={status.budget.tokens_remaining};"
            f"usd={status.budget.cost_remaining_usd:.4f}"
        )
        response.headers["X-AI-Model-Used"] = model_used
        response.headers["X-AI-Circuit-Breaker"] = status.circuit_breaker_state.value
        response.headers["X-AI-Response-Time-Ms"] = str(elapsed_ms)

        return response
