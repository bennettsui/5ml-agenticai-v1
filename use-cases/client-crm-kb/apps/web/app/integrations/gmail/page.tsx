"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Mail,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Clock,
  Users,
  MessageSquarePlus,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getToken } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Inline API helpers (not yet added to api.ts)
// ---------------------------------------------------------------------------

const API_BASE = "/api";

async function gmailRequest<T>(
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
  last_sync?: string;
  total_emails_synced?: number;
}

interface GmailAuthResponse {
  auth_url: string;
}

interface SyncResult {
  emails_processed: number;
  matched_clients: number;
  new_feedback_count: number;
  errors: string[];
}

interface GmailEmail {
  id: string;
  subject: string;
  from_email: string;
  date: string;
  snippet: string;
  sentiment?: "positive" | "neutral" | "negative";
  matched_client_name?: string;
  topics?: string[];
  processed: boolean;
}

// ---------------------------------------------------------------------------
// Sentiment badge helper
// ---------------------------------------------------------------------------

function getSentimentVariant(
  sentiment?: string
): "success" | "warning" | "destructive" | "secondary" {
  switch (sentiment) {
    case "positive":
      return "success";
    case "negative":
      return "destructive";
    case "neutral":
      return "warning";
    default:
      return "secondary";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GmailIntegrationPage() {
  const queryClient = useQueryClient();
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // Fetch Gmail connection status (auto-refresh every 30s)
  const {
    data: status,
    isLoading: statusLoading,
    error: statusError,
  } = useQuery<GmailStatus>({
    queryKey: ["gmail", "status"],
    queryFn: () => gmailRequest<GmailStatus>("/gmail/status"),
    refetchInterval: 30_000,
  });

  // Fetch synced emails
  const {
    data: emails,
    isLoading: emailsLoading,
    error: emailsError,
  } = useQuery<GmailEmail[]>({
    queryKey: ["gmail", "emails"],
    queryFn: () => gmailRequest<GmailEmail[]>("/gmail/emails"),
    enabled: status?.connected === true,
  });

  // Connect Gmail (redirect to OAuth)
  const connectMutation = useMutation({
    mutationFn: async () => {
      const data = await gmailRequest<GmailAuthResponse>("/gmail/auth");
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.auth_url;
    },
  });

  // Sync now
  const syncMutation = useMutation({
    mutationFn: () =>
      gmailRequest<SyncResult>("/gmail/sync", { method: "POST" }),
    onSuccess: (data) => {
      setSyncResult(data);
      queryClient.invalidateQueries({ queryKey: ["gmail"] });
    },
  });

  // Check for OAuth callback code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      gmailRequest(`/gmail/callback?code=${encodeURIComponent(code)}`)
        .then(() => {
          // Remove code from URL
          window.history.replaceState({}, "", "/integrations/gmail");
          queryClient.invalidateQueries({ queryKey: ["gmail"] });
        })
        .catch((err) => {
          console.error("Gmail callback error:", err);
        });
    }
  }, [queryClient]);

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
            Gmail Integration
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect your Gmail account to automatically import client feedback
            from emails.
          </p>
        </div>
      </div>

      {/* Connection status card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Connection Status</CardTitle>
                <CardDescription>
                  Gmail account connection and sync information
                </CardDescription>
              </div>
            </div>
            {statusLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : status?.connected ? (
              <Badge variant="success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {statusError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
              <p className="text-destructive text-sm font-medium">
                Failed to load Gmail status
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {statusError instanceof Error
                  ? statusError.message
                  : "Unknown error"}
              </p>
            </div>
          ) : status?.connected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{status.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="font-medium">
                    {status.last_sync
                      ? new Date(status.last_sync).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Emails Synced:</span>
                  <span className="font-medium">
                    {status.total_emails_synced ?? 0}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync Now
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Connect your Gmail account to automatically scan for client
                emails, extract feedback, and analyze sentiment.
              </p>
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                size="lg"
              >
                {connectMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Connect Gmail
              </Button>
              {connectMutation.isError && (
                <p className="text-sm text-destructive">
                  Failed to start authentication. Please try again.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync results */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sync Results</CardTitle>
            <CardDescription>
              Results from the most recent sync operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                <p className="text-2xl font-bold">
                  {syncResult.matched_clients}
                </p>
                <p className="text-xs text-muted-foreground">
                  Matched Clients
                </p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <MessageSquarePlus className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-2xl font-bold">
                  {syncResult.new_feedback_count}
                </p>
                <p className="text-xs text-muted-foreground">
                  New Feedback Items
                </p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <Mail className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">
                  {syncResult.emails_processed}
                </p>
                <p className="text-xs text-muted-foreground">
                  Emails Processed
                </p>
              </div>
            </div>
            {syncResult.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    Sync Errors ({syncResult.errors.length})
                  </span>
                </div>
                <ul className="space-y-1">
                  {syncResult.errors.map((err, i) => (
                    <li
                      key={i}
                      className="text-xs text-destructive/80 pl-6"
                    >
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent synced emails */}
      {status?.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Synced Emails</CardTitle>
            <CardDescription>
              Emails imported and analyzed from your Gmail account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : emailsError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                <p className="text-sm text-destructive">
                  Failed to load emails
                </p>
              </div>
            ) : !emails || emails.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No emails synced yet. Click &quot;Sync Now&quot; to import
                  emails.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Sentiment</TableHead>
                      <TableHead>Topics</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {email.subject}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {email.snippet}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {email.from_email}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(email.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {email.matched_client_name ? (
                            <span className="text-sm font-medium">
                              {email.matched_client_name}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              --
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {email.sentiment ? (
                            <Badge
                              variant={getSentimentVariant(email.sentiment)}
                              className="capitalize"
                            >
                              {email.sentiment}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {email.topics?.map((topic) => (
                              <Badge
                                key={topic}
                                variant="outline"
                                className="text-xs"
                              >
                                {topic}
                              </Badge>
                            )) ?? (
                              <span className="text-xs text-muted-foreground">
                                --
                              </span>
                            )}
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
      )}
    </div>
  );
}
