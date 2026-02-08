"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Cpu,
  CheckCircle,
  XCircle,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getToken } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Inline API helpers
// ---------------------------------------------------------------------------

const API_BASE = "/api";

async function apiRequest<T>(
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

interface GmailStatus {
  connected: boolean;
  email?: string;
}

interface OrchestrationStatus {
  circuit_breaker_state: "CLOSED" | "OPEN" | "HALF_OPEN";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const router = useRouter();

  const { data: gmailStatus, isLoading: gmailLoading } =
    useQuery<GmailStatus>({
      queryKey: ["gmail", "status"],
      queryFn: () => apiRequest<GmailStatus>("/gmail/status"),
    });

  const { data: orchStatus, isLoading: orchLoading } =
    useQuery<OrchestrationStatus>({
      queryKey: ["orchestration", "status"],
      queryFn: () =>
        apiRequest<OrchestrationStatus>("/orchestration/status"),
    });

  function gmailBadge() {
    if (gmailLoading) {
      return (
        <Badge variant="secondary">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Loading
        </Badge>
      );
    }
    if (gmailStatus?.connected) {
      return (
        <Badge variant="success">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Disconnected
      </Badge>
    );
  }

  function orchBadge() {
    if (orchLoading) {
      return (
        <Badge variant="secondary">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Loading
        </Badge>
      );
    }
    switch (orchStatus?.circuit_breaker_state) {
      case "CLOSED":
        return (
          <Badge variant="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        );
      case "OPEN":
        return (
          <Badge variant="destructive">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Circuit Open
          </Badge>
        );
      case "HALF_OPEN":
        return (
          <Badge variant="warning">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Half Open
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  }

  const integrations = [
    {
      title: "Gmail Integration",
      description:
        "Connect Gmail to automatically import client emails, extract feedback, and analyze sentiment.",
      icon: Mail,
      href: "/integrations/gmail",
      badge: gmailBadge(),
      subtitle: gmailStatus?.email
        ? `Connected as ${gmailStatus.email}`
        : "Not connected",
    },
    {
      title: "AI Orchestration",
      description:
        "Monitor AI usage, manage circuit breaker safety, configure token limits, and view cost analytics.",
      icon: Cpu,
      href: "/integrations/orchestration",
      badge: orchBadge(),
      subtitle: orchStatus?.circuit_breaker_state
        ? `Circuit breaker: ${orchStatus.circuit_breaker_state}`
        : "Status unknown",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-1">
          Manage external integrations and AI orchestration settings.
        </p>
      </div>

      {/* Integration cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card
              key={integration.href}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(integration.href)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {integration.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {integration.subtitle}
                      </p>
                    </div>
                  </div>
                  {integration.badge}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {integration.description}
                </CardDescription>
                <div className="flex items-center gap-1 text-sm text-primary mt-4 font-medium">
                  Configure
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
