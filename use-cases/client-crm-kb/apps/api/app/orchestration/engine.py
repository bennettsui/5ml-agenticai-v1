"""
AI Orchestration Engine for the CRM Knowledge-Base platform.

Responsibilities:
- Track every Claude API call (in-memory ring buffer + DB persistence)
- Calculate rolling metrics (tokens/min, tokens/hour, tokens/day, cost/day)
- Enforce configurable budget limits (daily token limit, daily cost limit)
- Detect infinite loops via call-pattern analysis with circuit breaker
- Optimise costs by downgrading models when approaching budget limits
- Suggest cron job schedules based on operation priorities

Usage::

    engine = OrchestrationEngine.get_instance()
    await engine.record_call(caller="chatbot", model="claude-sonnet-4-20250514", ...)
    status = await engine.get_status()
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Any, Deque, Dict, List, Optional, Tuple

from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session_factory

from .models import AIUsageLog
from .schemas import (
    Alert,
    AlertSeverity,
    AlertsResponse,
    BatchSuggestion,
    BudgetStatus,
    CircuitBreakerState,
    CronJob,
    EndpointUsage,
    EngineConfigResponse,
    EngineStatusResponse,
    HourlyUsage,
    ModelUsage,
    OperationPriority,
    ResetResponse,
    RollingMetrics,
    ScheduleResponse,
    UsageLogEntry,
    UsageResponse,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pricing (USD per 1 000 tokens) -- kept as a simple dict so it is easy to
# update without touching the rest of the code.
# ---------------------------------------------------------------------------
MODEL_PRICING: Dict[str, Dict[str, float]] = {
    "claude-sonnet-4-20250514": {"input": 0.003, "output": 0.015},
    "claude-sonnet-4-0": {"input": 0.003, "output": 0.015},
    "claude-haiku-35": {"input": 0.00025, "output": 0.00125},
    "claude-haiku-3": {"input": 0.00025, "output": 0.00125},
    "claude-opus-4-0": {"input": 0.015, "output": 0.075},
}

# Fallback pricing when model is not in the lookup table
_DEFAULT_PRICING = {"input": 0.003, "output": 0.015}

# Priority ordering (lower value = higher priority)
PRIORITY_ORDER: Dict[str, int] = {
    "CRITICAL": 0,
    "HIGH": 1,
    "MEDIUM": 2,
    "LOW": 3,
}


def _estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Return estimated cost in USD for a single API call."""
    pricing = MODEL_PRICING.get(model, _DEFAULT_PRICING)
    return (
        (input_tokens / 1000) * pricing["input"]
        + (output_tokens / 1000) * pricing["output"]
    )


# ---------------------------------------------------------------------------
# In-memory ring-buffer entry
# ---------------------------------------------------------------------------

class _CallRecord:
    """Lightweight record kept in the in-memory ring buffer."""

    __slots__ = (
        "timestamp", "caller", "model", "input_tokens", "output_tokens",
        "total_tokens", "cost_usd", "session_id", "priority",
    )

    def __init__(
        self,
        caller: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        session_id: Optional[str],
        priority: str,
    ) -> None:
        self.timestamp = datetime.now(timezone.utc)
        self.caller = caller
        self.model = model
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
        self.total_tokens = input_tokens + output_tokens
        self.cost_usd = _estimate_cost(model, input_tokens, output_tokens)
        self.session_id = session_id
        self.priority = priority


# ---------------------------------------------------------------------------
# Orchestration Engine (singleton)
# ---------------------------------------------------------------------------

class OrchestrationEngine:
    """Central orchestration engine -- singleton, thread-safe via asyncio locks."""

    _instance: Optional["OrchestrationEngine"] = None
    _lock_cls = asyncio.Lock  # class-level; actual lock created in __init__

    # -- Singleton accessor ---------------------------------------------------

    @classmethod
    def get_instance(cls) -> "OrchestrationEngine":
        """Return the singleton engine instance, creating it if needed."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # -- Init -----------------------------------------------------------------

    def __init__(self) -> None:
        # Asyncio lock guards all mutable state
        self._lock = asyncio.Lock()

        # Ring buffer (last N calls)
        self._buffer_size: int = 1000
        self._buffer: Deque[_CallRecord] = deque(maxlen=self._buffer_size)

        # Circuit breaker
        self._cb_state: CircuitBreakerState = CircuitBreakerState.CLOSED
        self._cb_opened_at: Optional[datetime] = None
        self._cb_half_open_test_count: int = 0
        self._cb_half_open_max_tests: int = 3

        # Budget / limits
        self._daily_token_limit: int = 500_000
        self._daily_cost_limit_usd: float = 10.0
        self._budget_warning_threshold: float = 0.80  # 80%

        # Loop detection config
        self._loop_max_calls: int = 5
        self._loop_window_seconds: int = 60

        # Model defaults
        self._default_model: str = "claude-sonnet-4-20250514"
        self._downgrade_model: str = "claude-haiku-35"
        self._active_model: str = self._default_model
        self._downgraded: bool = False

        # Call-pattern tracking: caller -> list of timestamps
        self._call_patterns: Dict[str, List[float]] = defaultdict(list)

        # Alerts
        self._alerts: List[Alert] = []
        self._max_alerts: int = 200

        # Engine start time
        self._started_at: float = time.monotonic()

    # -- Public API -----------------------------------------------------------

    async def record_call(
        self,
        caller: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        session_id: Optional[str] = None,
        priority: str = "MEDIUM",
    ) -> Tuple[bool, Optional[str]]:
        """Record a Claude API call.

        Returns:
            (allowed, message) -- ``allowed`` is False if the circuit breaker
            blocked the call.  ``message`` contains a human-readable reason
            when the call is blocked or a warning/suggestion.
        """
        async with self._lock:
            # 1. Check circuit breaker
            if self._cb_state == CircuitBreakerState.OPEN:
                # Only CRITICAL operations pass when breaker is open
                if PRIORITY_ORDER.get(priority, 99) > PRIORITY_ORDER["CRITICAL"]:
                    msg = (
                        "Circuit breaker is OPEN. Only CRITICAL operations are "
                        "allowed. Please wait or reset the breaker."
                    )
                    self._add_alert(
                        AlertSeverity.ERROR,
                        "circuit_breaker",
                        f"Blocked {caller} (priority={priority}): breaker OPEN",
                    )
                    return False, msg

            # 2. Record in ring buffer
            record = _CallRecord(
                caller=caller,
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                session_id=session_id,
                priority=priority,
            )
            self._buffer.append(record)

            # 3. Persist to DB (fire-and-forget in background)
            asyncio.create_task(
                self._persist_log(record)
            )

            # 4. Loop detection
            loop_detected, loop_msg = self._detect_loop(caller)
            if loop_detected:
                self._trip_circuit_breaker(loop_msg)
                return False, loop_msg

            # 5. Budget checks
            tokens_today, cost_today = self._compute_daily_totals()

            # Budget exceeded -- only CRITICAL allowed
            if (
                tokens_today > self._daily_token_limit
                or cost_today > self._daily_cost_limit_usd
            ):
                if PRIORITY_ORDER.get(priority, 99) > PRIORITY_ORDER["CRITICAL"]:
                    msg = (
                        f"Daily budget exceeded (tokens={tokens_today}, "
                        f"cost=${cost_today:.4f}). Only CRITICAL operations "
                        "are permitted until the next day."
                    )
                    self._add_alert(
                        AlertSeverity.CRITICAL,
                        "budget_warning",
                        msg,
                    )
                    return False, msg

            # Approaching budget -- downgrade model
            utilisation = max(
                tokens_today / max(self._daily_token_limit, 1),
                cost_today / max(self._daily_cost_limit_usd, 0.001),
            )
            if utilisation >= self._budget_warning_threshold and not self._downgraded:
                self._active_model = self._downgrade_model
                self._downgraded = True
                self._add_alert(
                    AlertSeverity.WARNING,
                    "budget_warning",
                    (
                        f"Budget utilisation at {utilisation:.0%}. "
                        f"Switching non-critical operations to {self._downgrade_model}."
                    ),
                )

            # 6. Half-open testing
            if self._cb_state == CircuitBreakerState.HALF_OPEN:
                self._cb_half_open_test_count += 1
                if self._cb_half_open_test_count >= self._cb_half_open_max_tests:
                    # Tests passed -- close breaker
                    self._cb_state = CircuitBreakerState.CLOSED
                    self._cb_half_open_test_count = 0
                    self._add_alert(
                        AlertSeverity.INFO,
                        "circuit_breaker",
                        "Circuit breaker returned to CLOSED after successful tests.",
                    )

            return True, None

    async def check_allowed(
        self, caller: str, priority: str = "MEDIUM"
    ) -> Tuple[bool, Optional[str]]:
        """Pre-flight check: can this caller make an API call right now?

        Does NOT record a call -- use ``record_call`` after actual API usage.
        """
        async with self._lock:
            if self._cb_state == CircuitBreakerState.OPEN:
                if PRIORITY_ORDER.get(priority, 99) > PRIORITY_ORDER["CRITICAL"]:
                    return False, "Circuit breaker OPEN -- call blocked."

            tokens_today, cost_today = self._compute_daily_totals()
            if (
                tokens_today > self._daily_token_limit
                or cost_today > self._daily_cost_limit_usd
            ):
                if PRIORITY_ORDER.get(priority, 99) > PRIORITY_ORDER["CRITICAL"]:
                    return False, "Daily budget exceeded."

            return True, None

    def get_recommended_model(self, priority: str = "MEDIUM") -> str:
        """Return the model to use given current budget status.

        CRITICAL operations always use the default (best) model.
        """
        if priority == "CRITICAL":
            return self._default_model
        return self._active_model

    async def get_status(self) -> EngineStatusResponse:
        """Build current engine status snapshot."""
        async with self._lock:
            tokens_today, cost_today = self._compute_daily_totals()
            metrics = self._compute_rolling_metrics()
            budget = BudgetStatus(
                daily_token_limit=self._daily_token_limit,
                daily_cost_limit_usd=self._daily_cost_limit_usd,
                tokens_used_today=tokens_today,
                cost_used_today_usd=round(cost_today, 6),
                tokens_remaining=max(0, self._daily_token_limit - tokens_today),
                cost_remaining_usd=round(
                    max(0.0, self._daily_cost_limit_usd - cost_today), 6
                ),
                utilisation_pct=round(
                    max(
                        tokens_today / max(self._daily_token_limit, 1),
                        cost_today / max(self._daily_cost_limit_usd, 0.001),
                    )
                    * 100,
                    2,
                ),
            )
            return EngineStatusResponse(
                circuit_breaker_state=self._cb_state,
                budget=budget,
                metrics=metrics,
                active_model=self._active_model,
                downgraded=self._downgraded,
                engine_uptime_seconds=round(
                    time.monotonic() - self._started_at, 2
                ),
            )

    async def get_usage(self, limit: int = 50) -> UsageResponse:
        """Build usage statistics from the in-memory buffer."""
        async with self._lock:
            now = datetime.now(timezone.utc)
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

            # Hourly buckets for today
            hourly_map: Dict[int, dict] = {}
            endpoint_map: Dict[str, dict] = defaultdict(
                lambda: {"tokens": 0, "cost": 0.0, "count": 0}
            )
            model_map: Dict[str, dict] = defaultdict(
                lambda: {"tokens": 0, "cost": 0.0, "count": 0}
            )
            daily_tokens = 0
            daily_cost = 0.0

            for rec in self._buffer:
                if rec.timestamp >= today_start:
                    h = rec.timestamp.hour
                    if h not in hourly_map:
                        hourly_map[h] = {"tokens": 0, "cost": 0.0, "count": 0}
                    hourly_map[h]["tokens"] += rec.total_tokens
                    hourly_map[h]["cost"] += rec.cost_usd
                    hourly_map[h]["count"] += 1

                    daily_tokens += rec.total_tokens
                    daily_cost += rec.cost_usd

                endpoint_map[rec.caller]["tokens"] += rec.total_tokens
                endpoint_map[rec.caller]["cost"] += rec.cost_usd
                endpoint_map[rec.caller]["count"] += 1

                model_map[rec.model]["tokens"] += rec.total_tokens
                model_map[rec.model]["cost"] += rec.cost_usd
                model_map[rec.model]["count"] += 1

            hourly = [
                HourlyUsage(
                    hour=f"{h:02d}:00",
                    total_tokens=v["tokens"],
                    total_cost_usd=round(v["cost"], 6),
                    call_count=v["count"],
                )
                for h, v in sorted(hourly_map.items())
            ]

            by_endpoint = [
                EndpointUsage(
                    caller=k,
                    total_tokens=v["tokens"],
                    total_cost_usd=round(v["cost"], 6),
                    call_count=v["count"],
                )
                for k, v in sorted(
                    endpoint_map.items(), key=lambda x: x[1]["tokens"], reverse=True
                )
            ]

            by_model = [
                ModelUsage(
                    model=k,
                    total_tokens=v["tokens"],
                    total_cost_usd=round(v["cost"], 6),
                    call_count=v["count"],
                )
                for k, v in sorted(
                    model_map.items(), key=lambda x: x[1]["tokens"], reverse=True
                )
            ]

            recent = [
                UsageLogEntry(
                    id=uuid.uuid4(),  # placeholder; DB id not in buffer
                    timestamp=r.timestamp,
                    caller=r.caller,
                    model=r.model,
                    input_tokens=r.input_tokens,
                    output_tokens=r.output_tokens,
                    total_tokens=r.total_tokens,
                    estimated_cost_usd=round(r.cost_usd, 6),
                    session_id=r.session_id,
                    priority=r.priority,
                    circuit_breaker_state=self._cb_state.value,
                    created_at=r.timestamp,
                )
                for r in list(self._buffer)[-limit:]
            ]

            return UsageResponse(
                hourly=hourly,
                daily_total_tokens=daily_tokens,
                daily_total_cost_usd=round(daily_cost, 6),
                by_endpoint=by_endpoint,
                by_model=by_model,
                recent_logs=recent,
            )

    def suggest_schedule(self) -> ScheduleResponse:
        """Return recommended cron job schedule for AI-powered operations."""
        jobs = [
            CronJob(
                name="gmail_sync_business_hours",
                description=(
                    "Sync Gmail inbox during business hours (09:00-18:00 HKT). "
                    "Checks for new client emails and extracts feedback."
                ),
                cron_expression="*/15 9-17 * * 1-5",
                timezone="Asia/Hong_Kong",
                priority=OperationPriority.MEDIUM,
                estimated_tokens_per_run=2000,
                estimated_daily_cost_usd=0.36,
            ),
            CronJob(
                name="gmail_sync_off_hours",
                description=(
                    "Sync Gmail inbox during off-hours. Reduced frequency "
                    "to conserve token budget."
                ),
                cron_expression="0 0-8,18-23 * * *",
                timezone="Asia/Hong_Kong",
                priority=OperationPriority.LOW,
                estimated_tokens_per_run=1500,
                estimated_daily_cost_usd=0.14,
            ),
            CronJob(
                name="feedback_analysis_batch",
                description=(
                    "Batch-process pending feedback items every 30 minutes. "
                    "Analyses sentiment, extracts topics and requirements."
                ),
                cron_expression="*/30 * * * *",
                timezone="Asia/Hong_Kong",
                priority=OperationPriority.HIGH,
                estimated_tokens_per_run=5000,
                estimated_daily_cost_usd=1.44,
            ),
            CronJob(
                name="health_score_recalculation",
                description=(
                    "Recalculate client health scores every 6 hours based on "
                    "recent feedback, project status, and engagement metrics."
                ),
                cron_expression="0 */6 * * *",
                timezone="Asia/Hong_Kong",
                priority=OperationPriority.MEDIUM,
                estimated_tokens_per_run=8000,
                estimated_daily_cost_usd=0.38,
            ),
            CronJob(
                name="pattern_detection_cross_client",
                description=(
                    "Run cross-client pattern detection daily at 3 AM HKT. "
                    "Identifies recurring themes, best practices, and error "
                    "patterns across all clients."
                ),
                cron_expression="0 3 * * *",
                timezone="Asia/Hong_Kong",
                priority=OperationPriority.LOW,
                estimated_tokens_per_run=25000,
                estimated_daily_cost_usd=0.45,
            ),
            CronJob(
                name="token_usage_report",
                description=(
                    "Generate and persist daily token usage report at midnight "
                    "HKT. Includes per-endpoint and per-model breakdowns."
                ),
                cron_expression="0 0 * * *",
                timezone="Asia/Hong_Kong",
                priority=OperationPriority.LOW,
                estimated_tokens_per_run=500,
                estimated_daily_cost_usd=0.01,
            ),
            CronJob(
                name="stale_data_cleanup",
                description=(
                    "Weekly cleanup of stale data on Sunday at 4 AM HKT. "
                    "Archives old chat sessions, prunes usage logs older than "
                    "90 days, and compacts ring buffer snapshots."
                ),
                cron_expression="0 4 * * 0",
                timezone="Asia/Hong_Kong",
                priority=OperationPriority.LOW,
                estimated_tokens_per_run=0,
                estimated_daily_cost_usd=0.0,
            ),
        ]

        total_tokens = sum(j.estimated_tokens_per_run or 0 for j in jobs)
        total_cost = sum(j.estimated_daily_cost_usd or 0.0 for j in jobs)

        notes = [
            "All times are in Asia/Hong_Kong (HKT, UTC+8).",
            "Gmail sync frequency doubles during business hours to catch "
            "client emails promptly.",
            "Feedback analysis runs every 30 min to batch multiple items per "
            "call, reducing total token usage by ~40%.",
            "Pattern detection is the most token-intensive job; scheduled at "
            "3 AM to avoid peak-hour budget pressure.",
            f"Estimated total daily token usage: ~{total_tokens:,} tokens.",
            f"Estimated total daily cost: ~${total_cost:.2f} USD.",
        ]

        return ScheduleResponse(
            recommended_jobs=jobs,
            estimated_daily_token_total=total_tokens,
            estimated_daily_cost_usd=round(total_cost, 2),
            notes=notes,
        )

    async def get_alerts(self) -> AlertsResponse:
        """Return recent alerts."""
        async with self._lock:
            unresolved = sum(1 for a in self._alerts if not a.resolved)
            return AlertsResponse(
                alerts=list(reversed(self._alerts)),
                total=len(self._alerts),
                unresolved_count=unresolved,
            )

    async def update_config(
        self,
        daily_token_limit: Optional[int] = None,
        daily_cost_limit_usd: Optional[float] = None,
        loop_max_calls: Optional[int] = None,
        loop_window_seconds: Optional[int] = None,
        budget_warning_threshold_pct: Optional[float] = None,
        default_model: Optional[str] = None,
        downgrade_model: Optional[str] = None,
    ) -> EngineConfigResponse:
        """Update engine configuration at runtime."""
        async with self._lock:
            if daily_token_limit is not None:
                self._daily_token_limit = daily_token_limit
            if daily_cost_limit_usd is not None:
                self._daily_cost_limit_usd = daily_cost_limit_usd
            if loop_max_calls is not None:
                self._loop_max_calls = loop_max_calls
            if loop_window_seconds is not None:
                self._loop_window_seconds = loop_window_seconds
            if budget_warning_threshold_pct is not None:
                self._budget_warning_threshold = budget_warning_threshold_pct
            if default_model is not None:
                self._default_model = default_model
                if not self._downgraded:
                    self._active_model = default_model
            if downgrade_model is not None:
                self._downgrade_model = downgrade_model

            return EngineConfigResponse(
                daily_token_limit=self._daily_token_limit,
                daily_cost_limit_usd=self._daily_cost_limit_usd,
                loop_detection_max_calls=self._loop_max_calls,
                loop_detection_window_seconds=self._loop_window_seconds,
                budget_warning_threshold_pct=self._budget_warning_threshold,
                default_model=self._default_model,
                downgrade_model=self._downgrade_model,
            )

    async def reset(
        self,
        reset_circuit_breaker: bool = False,
        clear_alerts: bool = False,
        clear_usage_buffer: bool = False,
    ) -> ResetResponse:
        """Reset engine state as requested."""
        async with self._lock:
            cb_reset = False
            alerts_cleared = False
            buffer_cleared = False

            if reset_circuit_breaker:
                self._cb_state = CircuitBreakerState.CLOSED
                self._cb_opened_at = None
                self._cb_half_open_test_count = 0
                self._downgraded = False
                self._active_model = self._default_model
                self._call_patterns.clear()
                cb_reset = True
                logger.info("Circuit breaker reset to CLOSED.")

            if clear_alerts:
                self._alerts.clear()
                alerts_cleared = True
                logger.info("Alerts cleared.")

            if clear_usage_buffer:
                self._buffer.clear()
                buffer_cleared = True
                logger.info("Usage ring buffer cleared.")

            parts = []
            if cb_reset:
                parts.append("circuit breaker reset")
            if alerts_cleared:
                parts.append("alerts cleared")
            if buffer_cleared:
                parts.append("usage buffer cleared")
            message = "Reset completed: " + ", ".join(parts) if parts else "No action taken."

            return ResetResponse(
                circuit_breaker_reset=cb_reset,
                alerts_cleared=alerts_cleared,
                usage_buffer_cleared=buffer_cleared,
                message=message,
            )

    def suggest_batching(self) -> List[BatchSuggestion]:
        """Analyse recent calls and suggest batching opportunities."""
        # Count similar operations in last 5 minutes
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
        caller_counts: Dict[str, int] = defaultdict(int)
        for rec in self._buffer:
            if rec.timestamp >= cutoff:
                caller_counts[rec.caller] += 1

        suggestions: List[BatchSuggestion] = []
        for caller, count in caller_counts.items():
            if count >= 3:
                est_individual = count * 3000  # rough estimate
                est_batched = 5000  # batched is usually cheaper
                savings = max(0.0, (est_individual - est_batched) / est_individual)
                suggestions.append(
                    BatchSuggestion(
                        operation_type=caller,
                        pending_count=count,
                        estimated_tokens_individual=est_individual,
                        estimated_tokens_batched=est_batched,
                        savings_pct=round(savings * 100, 1),
                        message=(
                            f"{count} {caller} operations in the last 5 minutes -- "
                            f"batch them into one call to save ~{savings:.0%} tokens."
                        ),
                    )
                )
        return suggestions

    # -- Private helpers ------------------------------------------------------

    def _compute_daily_totals(self) -> Tuple[int, float]:
        """Sum tokens and cost from today's entries in the ring buffer."""
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tokens = 0
        cost = 0.0
        for rec in self._buffer:
            if rec.timestamp >= today_start:
                tokens += rec.total_tokens
                cost += rec.cost_usd
        return tokens, cost

    def _compute_rolling_metrics(self) -> RollingMetrics:
        """Calculate rolling rates from the ring buffer."""
        now = datetime.now(timezone.utc)
        one_min_ago = now - timedelta(minutes=1)
        one_hour_ago = now - timedelta(hours=1)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        tokens_1m = 0
        tokens_1h = 0
        tokens_day = 0
        cost_day = 0.0
        calls_today = 0

        for rec in self._buffer:
            if rec.timestamp >= today_start:
                tokens_day += rec.total_tokens
                cost_day += rec.cost_usd
                calls_today += 1
            if rec.timestamp >= one_hour_ago:
                tokens_1h += rec.total_tokens
            if rec.timestamp >= one_min_ago:
                tokens_1m += rec.total_tokens

        return RollingMetrics(
            tokens_per_minute=float(tokens_1m),
            tokens_per_hour=float(tokens_1h),
            tokens_per_day=float(tokens_day),
            cost_per_day_usd=round(cost_day, 6),
            total_calls_today=calls_today,
        )

    def _detect_loop(self, caller: str) -> Tuple[bool, Optional[str]]:
        """Detect repeated calls from the same caller within the window.

        Returns (detected, message).
        """
        now_ts = time.time()
        window_start = now_ts - self._loop_window_seconds

        # Append current timestamp
        self._call_patterns[caller].append(now_ts)

        # Prune old entries
        self._call_patterns[caller] = [
            ts for ts in self._call_patterns[caller] if ts >= window_start
        ]

        recent_count = len(self._call_patterns[caller])
        if recent_count > self._loop_max_calls:
            msg = (
                f"Loop detected: {caller} called {recent_count} times in "
                f"{self._loop_window_seconds}s (limit: {self._loop_max_calls}). "
                "Execution paused. Consider batching requests or reviewing "
                "the calling logic."
            )
            self._add_alert(AlertSeverity.ERROR, "loop_detection", msg)
            logger.warning(msg)
            return True, msg

        # Additionally check for rising token usage without progress
        # (same caller, similar token counts in sequence)
        recent_records = [
            r for r in self._buffer
            if r.caller == caller and r.timestamp.timestamp() >= window_start
        ]
        if len(recent_records) >= 4:
            token_counts = [r.total_tokens for r in recent_records[-4:]]
            avg = sum(token_counts) / len(token_counts)
            if avg > 0:
                variance_ratio = max(
                    abs(t - avg) / avg for t in token_counts
                )
                # If all recent calls have very similar token counts (<10%
                # variance), it may be a stuck loop
                if variance_ratio < 0.10 and len(recent_records) >= self._loop_max_calls:
                    msg = (
                        f"Potential stuck loop: {caller} produced {len(recent_records)} "
                        "calls with near-identical token usage. This may indicate "
                        "the same tool is being called repeatedly without progress."
                    )
                    self._add_alert(AlertSeverity.WARNING, "loop_detection", msg)
                    logger.warning(msg)
                    return True, msg

        return False, None

    def _trip_circuit_breaker(self, reason: str) -> None:
        """Move circuit breaker to OPEN state."""
        self._cb_state = CircuitBreakerState.OPEN
        self._cb_opened_at = datetime.now(timezone.utc)
        self._add_alert(
            AlertSeverity.CRITICAL,
            "circuit_breaker",
            f"Circuit breaker tripped to OPEN: {reason}",
        )
        logger.error("Circuit breaker OPEN: %s", reason)

        # Schedule auto-transition to HALF_OPEN after 60 seconds
        asyncio.ensure_future(self._auto_half_open())

    async def _auto_half_open(self) -> None:
        """After a cooldown, transition from OPEN to HALF_OPEN."""
        await asyncio.sleep(60)
        async with self._lock:
            if self._cb_state == CircuitBreakerState.OPEN:
                self._cb_state = CircuitBreakerState.HALF_OPEN
                self._cb_half_open_test_count = 0
                self._add_alert(
                    AlertSeverity.INFO,
                    "circuit_breaker",
                    "Circuit breaker transitioned to HALF_OPEN. "
                    "Next few calls will be test calls.",
                )
                logger.info("Circuit breaker moved to HALF_OPEN.")

    def _add_alert(
        self,
        severity: AlertSeverity,
        category: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Append an alert, pruning oldest if over the cap."""
        alert = Alert(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            severity=severity,
            category=category,
            message=message,
            details=details,
            resolved=False,
        )
        self._alerts.append(alert)
        if len(self._alerts) > self._max_alerts:
            self._alerts = self._alerts[-self._max_alerts:]

    async def _persist_log(self, record: _CallRecord) -> None:
        """Write a usage log entry to the database."""
        try:
            async with async_session_factory() as session:
                log_entry = AIUsageLog(
                    caller=record.caller,
                    model=record.model,
                    input_tokens=record.input_tokens,
                    output_tokens=record.output_tokens,
                    total_tokens=record.total_tokens,
                    estimated_cost_usd=record.cost_usd,
                    session_id=record.session_id,
                    priority=record.priority,
                    circuit_breaker_state=self._cb_state.value,
                )
                session.add(log_entry)
                await session.commit()
        except Exception:
            logger.exception("Failed to persist AI usage log to database.")
