"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Cpu,
  ArrowLeft,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Zap,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Save,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getToken } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Inline API helpers
// ---------------------------------------------------------------------------

const API_BASE = "/api";

async function orchRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new Error(
      `API Error ${res.status}: ${typeof body === "object" ? JSON.stringify(body) : body}`
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrchestrationStatus {
  circuit_breaker_state: "CLOSED" | "OPEN" | "HALF_OPEN";
  daily_token_usage: number;
  daily_token_limit: number;
  daily_cost: number;
  daily_cost_limit: number;
  current_rate_tokens_per_min: number;
  loop_detection_threshold: number;
  budget_warning_pct: number;
}

interface UsageData {
  hourly: Array<{
    hour: string;
    tokens: number;
    cost: number;
  }>;
  total_tokens: number;
  total_cost: number;
}

interface ScheduleItem {
  job_name: string;
  frequency: string;
  description: string;
  next_run: string;
}

interface AlertItem {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
}

interface ConfigUpdate {
  daily_token_limit: number;
  daily_cost_limit: number;
  loop_detection_threshold: number;
  budget_warning_pct: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function circuitBreakerBadge(state: string) {
  switch (state) {
    case "CLOSED":
      return (
        <Badge variant="success">
          <CheckCircle className="h-3 w-3 mr-1" />
          CLOSED
        </Badge>
      );
    case "OPEN":
      return (
        <Badge variant="destructive">
          <ShieldAlert className="h-3 w-3 mr-1" />
          OPEN
        </Badge>
      );
    case "HALF_OPEN":
      return (
        <Badge variant="warning">
          <AlertTriangle className="h-3 w-3 mr-1" />
          HALF_OPEN
        </Badge>
      );
    default:
      return <Badge variant="secondary">{state}</Badge>;
  }
}

function alertSeverityBadge(severity: string) {
  switch (severity) {
    case "critical":
      return <Badge variant="destructive">Critical</Badge>;
    case "warning":
      return <Badge variant="warning">Warning</Badge>;
    case "info":
      return <Badge variant="info">Info</Badge>;
    default:
      return <Badge variant="secondary">{severity}</Badge>;
  }
}

function ProgressBar({
  value,
  max,
  color = "bg-blue-600",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isWarning = pct >= 80;
  const isDanger = pct >= 95;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>
          {value.toLocaleString()} / {max.toLocaleString()}
        </span>
        <span>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isDanger ? "bg-red-600" : isWarning ? "bg-yellow-500" : color
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OrchestrationPage() {
  const queryClient = useQueryClient();

  // Config form state
  const [configForm, setConfigForm] = useState<ConfigUpdate | null>(null);

  // Fetch orchestration status
  const {
    data: status,
    isLoading: statusLoading,
    error: statusError,
  } = useQuery<OrchestrationStatus>({
    queryKey: ["orchestration", "status"],
    queryFn: () =>
      orchRequest<OrchestrationStatus>("/orchestration/status"),
    refetchInterval: 15_000,
  });

  // Fetch usage data
  const { data: usage, isLoading: usageLoading } = useQuery<UsageData>({
    queryKey: ["orchestration", "usage"],
    queryFn: () => orchRequest<UsageData>("/orchestration/usage"),
    refetchInterval: 30_000,
  });

  // Fetch schedule
  const { data: schedule } = useQuery<ScheduleItem[]>({
    queryKey: ["orchestration", "schedule"],
    queryFn: () => orchRequest<ScheduleItem[]>("/orchestration/schedule"),
  });

  // Fetch alerts
  const { data: alerts } = useQuery<AlertItem[]>({
    queryKey: ["orchestration", "alerts"],
    queryFn: () => orchRequest<AlertItem[]>("/orchestration/alerts"),
  });

  // Save config
  const configMutation = useMutation({
    mutationFn: (data: ConfigUpdate) =>
      orchRequest("/orchestration/config", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orchestration"] });
      setConfigForm(null);
    },
  });

  // Reset circuit breaker
  const resetMutation = useMutation({
    mutationFn: () =>
      orchRequest("/orchestration/reset", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orchestration"] });
    },
  });

  // Initialize config form from status
  const currentConfig: ConfigUpdate = configForm ?? {
    daily_token_limit: status?.daily_token_limit ?? 0,
    daily_cost_limit: status?.daily_cost_limit ?? 0,
    loop_detection_threshold: status?.loop_detection_threshold ?? 0,
    budget_warning_pct: status?.budget_warning_pct ?? 0,
  };

  // Find the max bar value for the hourly chart
  const maxHourlyTokens =
    usage?.hourly.reduce((m, h) => Math.max(m, h.tokens), 0) ?? 1;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href="/integrations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            AI Orchestration Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor AI usage, costs, circuit breaker state, and configure
            safety limits.
          </p>
        </div>
      </div>

      {/* Loading / error */}
      {statusLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {statusError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">
            Failed to load orchestration status
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {statusError instanceof Error
              ? statusError.message
              : "Unknown error"}
          </p>
        </div>
      )}

      {status && (
        <>
          {/* Status overview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Circuit Breaker */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Circuit Breaker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {circuitBreakerBadge(status.circuit_breaker_state)}
                  {status.circuit_breaker_state !== "CLOSED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetMutation.mutate()}
                      disabled={resetMutation.isPending}
                    >
                      {resetMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Reset
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily Token Usage */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Daily Token Usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressBar
                  value={status.daily_token_usage}
                  max={status.daily_token_limit}
                  color="bg-blue-600"
                />
              </CardContent>
            </Card>

            {/* Daily Cost */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Daily Cost
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressBar
                  value={status.daily_cost}
                  max={status.daily_cost_limit}
                  color="bg-green-600"
                />
              </CardContent>
            </Card>

            {/* Current Rate */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Current Rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {status.current_rate_tokens_per_min.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">tokens / min</p>
              </CardContent>
            </Card>
          </div>

          {/* Hourly usage chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hourly Usage</CardTitle>
              <CardDescription>
                Token usage breakdown by hour (today)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !usage?.hourly || usage.hourly.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No usage data available yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-end gap-1 h-40">
                    {usage.hourly.map((h) => {
                      const heightPct =
                        maxHourlyTokens > 0
                          ? (h.tokens / maxHourlyTokens) * 100
                          : 0;
                      return (
                        <div
                          key={h.hour}
                          className="flex-1 flex flex-col items-center justify-end group relative"
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover border rounded px-2 py-1 text-xs shadow-md whitespace-nowrap z-10">
                            <p className="font-medium">
                              {h.tokens.toLocaleString()} tokens
                            </p>
                            <p className="text-muted-foreground">
                              ${h.cost.toFixed(4)}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "w-full rounded-t transition-all",
                              heightPct >= 90
                                ? "bg-red-500"
                                : heightPct >= 70
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                            )}
                            style={{
                              height: `${Math.max(heightPct, 2)}%`,
                              minHeight: "2px",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-1">
                    {usage.hourly.map((h) => (
                      <div
                        key={h.hour}
                        className="flex-1 text-center text-[10px] text-muted-foreground truncate"
                      >
                        {h.hour}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      Total: {usage.total_tokens.toLocaleString()} tokens
                    </span>
                    <span>Total Cost: ${usage.total_cost.toFixed(4)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Alerts</CardTitle>
              <CardDescription>
                System alerts and warnings from the orchestration layer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!alerts || alerts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No recent alerts. All systems operating normally.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3",
                        alert.severity === "critical" &&
                          "border-red-200 bg-red-50",
                        alert.severity === "warning" &&
                          "border-yellow-200 bg-yellow-50",
                        alert.severity === "info" &&
                          "border-blue-200 bg-blue-50"
                      )}
                    >
                      <div className="pt-0.5">
                        {alertSeverityBadge(alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended cron schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Recommended Cron Schedule
              </CardTitle>
              <CardDescription>
                Scheduled jobs for automated AI operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!schedule || schedule.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No scheduled jobs configured.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Name</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Next Run</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.map((item) => (
                        <TableRow key={item.job_name}>
                          <TableCell className="font-medium">
                            {item.job_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.frequency}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.description}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.next_run).toLocaleString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
              <CardDescription>
                Edit safety limits and budget thresholds for AI orchestration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="daily_token_limit">Daily Token Limit</Label>
                  <Input
                    id="daily_token_limit"
                    type="number"
                    value={currentConfig.daily_token_limit}
                    onChange={(e) =>
                      setConfigForm({
                        ...currentConfig,
                        daily_token_limit: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum tokens allowed per day before circuit breaker trips
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily_cost_limit">
                    Daily Cost Limit ($)
                  </Label>
                  <Input
                    id="daily_cost_limit"
                    type="number"
                    step="0.01"
                    value={currentConfig.daily_cost_limit}
                    onChange={(e) =>
                      setConfigForm({
                        ...currentConfig,
                        daily_cost_limit: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum daily spend before circuit breaker trips
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loop_detection_threshold">
                    Loop Detection Threshold
                  </Label>
                  <Input
                    id="loop_detection_threshold"
                    type="number"
                    value={currentConfig.loop_detection_threshold}
                    onChange={(e) =>
                      setConfigForm({
                        ...currentConfig,
                        loop_detection_threshold:
                          parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of repeated calls that trigger loop detection
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget_warning_pct">
                    Budget Warning (%)
                  </Label>
                  <Input
                    id="budget_warning_pct"
                    type="number"
                    min={0}
                    max={100}
                    value={currentConfig.budget_warning_pct}
                    onChange={(e) =>
                      setConfigForm({
                        ...currentConfig,
                        budget_warning_pct: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentage of budget at which to trigger a warning alert
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              {configForm && (
                <Button
                  variant="outline"
                  onClick={() => setConfigForm(null)}
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={() => configMutation.mutate(currentConfig)}
                disabled={!configForm || configMutation.isPending}
              >
                {configMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Configuration
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
