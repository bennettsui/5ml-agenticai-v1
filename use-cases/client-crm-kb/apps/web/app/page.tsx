"use client";

import { useClients } from "@/lib/hooks/useClients";
import { useFeedbackList } from "@/lib/hooks/useFeedback";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FolderKanban,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  if (!sentiment) return null;

  const variants: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    positive: "success",
    neutral: "secondary",
    negative: "destructive",
  };

  return (
    <Badge variant={variants[sentiment] ?? "secondary"}>
      {sentiment}
    </Badge>
  );
}

function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return null;

  const variants: Record<string, "info" | "warning" | "destructive" | "secondary"> = {
    info: "info",
    minor: "secondary",
    major: "warning",
    critical: "destructive",
  };

  return (
    <Badge variant={variants[severity] ?? "secondary"}>
      {severity}
    </Badge>
  );
}

export default function DashboardPage() {
  const { data: clientsData, isLoading: clientsLoading } = useClients({
    size: 100,
  });

  const { data: feedbackData, isLoading: feedbackLoading } = useFeedbackList({
    size: 10,
    status: "new",
  });

  const clients = clientsData?.items ?? [];
  const feedbackItems = feedbackData?.items ?? [];
  const totalClients = clientsData?.total ?? 0;

  // Compute stats
  const activeProjects = clients.reduce((acc, _c) => acc, 0);
  const newFeedbackCount = feedbackData?.total ?? 0;
  const healthAlerts = clients.filter((c) => c.health_score < 50);

  const isLoading = clientsLoading || feedbackLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Loading your CRM overview...
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 rounded bg-muted" />
                <div className="mt-2 h-3 w-32 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here is an overview of your client portfolio.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={totalClients}
          description={`${clients.filter((c) => c.status === "active").length} active`}
          icon={Users}
          href="/clients"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects}
          description="Across all clients"
          icon={FolderKanban}
          href="/projects"
        />
        <StatCard
          title="New Feedback"
          value={newFeedbackCount}
          description="Awaiting review"
          icon={MessageSquare}
          href="/feedback"
        />
        <StatCard
          title="Health Alerts"
          value={healthAlerts.length}
          description="Clients below 50 score"
          icon={AlertTriangle}
          href="/clients?status=alert"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>
              Latest feedback items requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedbackItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No new feedback items.
              </p>
            ) : (
              <div className="space-y-4">
                {feedbackItems.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/feedback/${item.id}`}
                    className="block"
                  >
                    <div className="flex items-start justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-tight line-clamp-2">
                          {item.raw_text.substring(0, 120)}
                          {item.raw_text.length > 120 ? "..." : ""}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{item.source}</span>
                          <span>
                            {formatDistanceToNow(new Date(item.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <SentimentBadge sentiment={item.sentiment} />
                        <SeverityBadge severity={item.severity} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clients needing attention */}
        <Card>
          <CardHeader>
            <CardTitle>Clients Needing Attention</CardTitle>
            <CardDescription>
              Clients with health score below 50
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All clients are in good health.
              </p>
            ) : (
              <div className="space-y-4">
                {healthAlerts.slice(0, 5).map((client) => (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{client.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {client.status}
                          </Badge>
                          {client.industry && client.industry.length > 0 && (
                            <span>{client.industry[0]}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-bold text-destructive">
                            {client.health_score}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Health
                          </p>
                        </div>
                        <div
                          className="h-8 w-8 rounded-full border-2"
                          style={{
                            borderColor:
                              client.health_score < 25
                                ? "hsl(0 84.2% 60.2%)"
                                : client.health_score < 50
                                  ? "hsl(38 92% 50%)"
                                  : "hsl(142 71% 45%)",
                            background: `conic-gradient(
                              ${
                                client.health_score < 25
                                  ? "hsl(0 84.2% 60.2%)"
                                  : client.health_score < 50
                                    ? "hsl(38 92% 50%)"
                                    : "hsl(142 71% 45%)"
                              } ${client.health_score * 3.6}deg,
                              transparent 0
                            )`,
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
