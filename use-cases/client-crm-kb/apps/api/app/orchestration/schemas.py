"""
Pydantic schemas for the AI orchestration engine.

Covers request/response models for status, usage, schedule, config,
alerts, and reset endpoints.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class CircuitBreakerState(str, enum.Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class OperationPriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class AlertSeverity(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


# ---------------------------------------------------------------------------
# Usage log record
# ---------------------------------------------------------------------------

class UsageLogEntry(BaseModel):
    """A single AI API usage log entry."""
    id: UUID
    timestamp: datetime
    caller: str
    model: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    session_id: Optional[str] = None
    priority: str
    circuit_breaker_state: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Status endpoint
# ---------------------------------------------------------------------------

class RollingMetrics(BaseModel):
    """Rolling token and cost metrics."""
    tokens_per_minute: float = 0.0
    tokens_per_hour: float = 0.0
    tokens_per_day: float = 0.0
    cost_per_day_usd: float = 0.0
    total_calls_today: int = 0


class BudgetStatus(BaseModel):
    """Current budget utilisation."""
    daily_token_limit: int
    daily_cost_limit_usd: float
    tokens_used_today: int = 0
    cost_used_today_usd: float = 0.0
    tokens_remaining: int = 0
    cost_remaining_usd: float = 0.0
    utilisation_pct: float = 0.0


class EngineStatusResponse(BaseModel):
    """Response for GET /api/orchestration/status."""
    circuit_breaker_state: CircuitBreakerState
    budget: BudgetStatus
    metrics: RollingMetrics
    active_model: str
    downgraded: bool = False
    engine_uptime_seconds: float = 0.0


# ---------------------------------------------------------------------------
# Usage endpoint
# ---------------------------------------------------------------------------

class HourlyUsage(BaseModel):
    hour: str
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    call_count: int = 0


class EndpointUsage(BaseModel):
    caller: str
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    call_count: int = 0


class ModelUsage(BaseModel):
    model: str
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    call_count: int = 0


class UsageResponse(BaseModel):
    """Response for GET /api/orchestration/usage."""
    hourly: List[HourlyUsage] = []
    daily_total_tokens: int = 0
    daily_total_cost_usd: float = 0.0
    by_endpoint: List[EndpointUsage] = []
    by_model: List[ModelUsage] = []
    recent_logs: List[UsageLogEntry] = []


# ---------------------------------------------------------------------------
# Schedule endpoint
# ---------------------------------------------------------------------------

class CronJob(BaseModel):
    """A single recommended cron job."""
    name: str
    description: str
    cron_expression: str
    timezone: str = "Asia/Hong_Kong"
    priority: OperationPriority = OperationPriority.MEDIUM
    estimated_tokens_per_run: Optional[int] = None
    estimated_daily_cost_usd: Optional[float] = None


class ScheduleResponse(BaseModel):
    """Response for GET /api/orchestration/schedule."""
    recommended_jobs: List[CronJob] = []
    estimated_daily_token_total: int = 0
    estimated_daily_cost_usd: float = 0.0
    notes: List[str] = []


# ---------------------------------------------------------------------------
# Config endpoint
# ---------------------------------------------------------------------------

class EngineConfigUpdate(BaseModel):
    """Request body for POST /api/orchestration/config."""
    daily_token_limit: Optional[int] = Field(
        None, ge=1000, description="Max tokens allowed per day"
    )
    daily_cost_limit_usd: Optional[float] = Field(
        None, ge=0.01, description="Max USD spend per day"
    )
    loop_detection_max_calls: Optional[int] = Field(
        None, ge=2, description="Max calls from same endpoint in window"
    )
    loop_detection_window_seconds: Optional[int] = Field(
        None, ge=10, description="Window in seconds for loop detection"
    )
    budget_warning_threshold_pct: Optional[float] = Field(
        None, ge=0.1, le=1.0,
        description="Fraction of budget at which to start downgrading models",
    )
    default_model: Optional[str] = Field(
        None, description="Default Claude model for normal operations"
    )
    downgrade_model: Optional[str] = Field(
        None, description="Cheaper model used when approaching budget limits"
    )


class EngineConfigResponse(BaseModel):
    """Response after updating engine config."""
    daily_token_limit: int
    daily_cost_limit_usd: float
    loop_detection_max_calls: int
    loop_detection_window_seconds: int
    budget_warning_threshold_pct: float
    default_model: str
    downgrade_model: str
    updated: bool = True


# ---------------------------------------------------------------------------
# Alerts endpoint
# ---------------------------------------------------------------------------

class Alert(BaseModel):
    """A single alert or warning generated by the orchestration engine."""
    id: str
    timestamp: datetime
    severity: AlertSeverity
    category: str  # "loop_detection", "budget_warning", "circuit_breaker"
    message: str
    details: Optional[Dict[str, Any]] = None
    resolved: bool = False


class AlertsResponse(BaseModel):
    """Response for GET /api/orchestration/alerts."""
    alerts: List[Alert] = []
    total: int = 0
    unresolved_count: int = 0


# ---------------------------------------------------------------------------
# Reset endpoint
# ---------------------------------------------------------------------------

class ResetRequest(BaseModel):
    """Request body for POST /api/orchestration/reset."""
    reset_circuit_breaker: bool = False
    clear_alerts: bool = False
    clear_usage_buffer: bool = False


class ResetResponse(BaseModel):
    """Response for POST /api/orchestration/reset."""
    circuit_breaker_reset: bool = False
    alerts_cleared: bool = False
    usage_buffer_cleared: bool = False
    message: str = "Reset completed."


# ---------------------------------------------------------------------------
# Batching suggestion
# ---------------------------------------------------------------------------

class BatchSuggestion(BaseModel):
    """Suggestion to batch multiple similar operations."""
    operation_type: str
    pending_count: int
    estimated_tokens_individual: int
    estimated_tokens_batched: int
    savings_pct: float
    message: str
