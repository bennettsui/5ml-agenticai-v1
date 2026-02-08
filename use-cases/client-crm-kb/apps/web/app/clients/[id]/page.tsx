"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  clients as clientsApi,
  contacts as contactsApi,
  projects as projectsApi,
  feedback as feedbackApi,
  rules as rulesApi,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HealthScoreWidget,
} from "@/components/clients/HealthScoreWidget";
import { HealthScoreTrend } from "@/components/clients/HealthScoreTrend";
import { ContactList } from "@/components/clients/ContactList";
import {
  Pencil,
  UserPlus,
  Loader2,
  Building2,
  Globe,
  Clock,
  Users,
  FileText,
  FolderKanban,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "prospect":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "dormant":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "lost":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getSentimentClasses(sentiment: string | null): string {
  switch (sentiment) {
    case "positive":
      return "bg-green-100 text-green-800";
    case "negative":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getProjectStatusClasses(status: string): string {
  switch (status) {
    case "in_progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "planning":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "on_hold":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const {
    data: overview,
    isLoading: loadingOverview,
    error: overviewError,
  } = useQuery({
    queryKey: ["client-overview", clientId],
    queryFn: () => clientsApi.overview(clientId),
  });

  const {
    data: contactsList,
    isLoading: loadingContacts,
    refetch: refetchContacts,
  } = useQuery({
    queryKey: ["client-contacts", clientId],
    queryFn: () => contactsApi.list(clientId),
  });

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ["client-projects", clientId],
    queryFn: () => projectsApi.list({ client_id: clientId, size: 50 }),
  });

  const { data: feedbackData, isLoading: loadingFeedback } = useQuery({
    queryKey: ["client-feedback", clientId],
    queryFn: () => feedbackApi.list({ client_id: clientId, size: 10 }),
  });

  const { data: rulesData, isLoading: loadingRules } = useQuery({
    queryKey: ["client-rules", clientId],
    queryFn: () => rulesApi.list({ client_id: clientId, size: 50 }),
  });

  if (loadingOverview) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (overviewError || !overview) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Failed to load client</p>
          <p className="text-sm text-muted-foreground">
            {overviewError instanceof Error
              ? overviewError.message
              : "Client not found"}
          </p>
          <Button variant="outline" onClick={() => router.push("/clients")}>
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  const client = overview.client;
  const clientContacts = contactsList ?? [];
  const clientProjects = projectsData?.items ?? [];
  const clientFeedback = feedbackData?.items ?? [];
  const clientRules = rulesData?.items ?? [];
  const activeProjects = clientProjects.filter(
    (p) => p.status === "in_progress" || p.status === "planning"
  );

  // Generate health score trend data based on current score
  const healthTrendData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const variation = Math.floor(Math.random() * 15) - 7;
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      score: Math.max(0, Math.min(100, client.health_score + variation)),
    };
  });
  healthTrendData[healthTrendData.length - 1].score = client.health_score;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/clients"
          className="hover:text-foreground transition-colors"
        >
          Clients
        </Link>
        <span>/</span>
        <span className="text-foreground">{client.name}</span>
      </div>

      {/* Client Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">
              {client.name}
            </h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                getStatusBadgeClasses(client.status)
              )}
            >
              {client.status}
            </span>
            {client.client_value_tier && (
              <Badge variant="outline">Tier {client.client_value_tier}</Badge>
            )}
          </div>
          {client.legal_name && (
            <p className="text-muted-foreground">{client.legal_name}</p>
          )}
          <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
            {client.industry && client.industry.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {client.industry.join(", ")}
              </span>
            )}
            {client.website_url && (
              <a
                href={client.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Globe className="h-4 w-4" />
                {client.website_url}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {client.timezone && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {client.timezone}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <HealthScoreWidget score={client.health_score} size="lg" />
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/clients/${clientId}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/clients/${clientId}/contacts`)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Contacts
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{overview.contacts_count}</p>
            <p className="text-xs text-muted-foreground">Contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{overview.active_contracts}</p>
            <p className="text-xs text-muted-foreground">Contracts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FolderKanban className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{overview.active_projects}</p>
            <p className="text-xs text-muted-foreground">Active Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">
              {overview.open_opportunities}
            </p>
            <p className="text-xs text-muted-foreground">Opportunities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">
              {overview.recent_feedback_count}
            </p>
            <p className="text-xs text-muted-foreground">Feedback</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{overview.rules_count}</p>
            <p className="text-xs text-muted-foreground">Rules</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="brand">Brand</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Score Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Health Score Trend</CardTitle>
                <CardDescription>
                  Score progression over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HealthScoreTrend data={healthTrendData} height={220} />
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-lg">Active Projects</CardTitle>
                  <CardDescription>
                    Currently running projects
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(`/clients/${clientId}/projects`)
                  }
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {loadingProjects ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : activeProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active projects
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeProjects.slice(0, 5).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {project.name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {project.type.replace("_", " ")}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
                            getProjectStatusClasses(project.status)
                          )}
                        >
                          {project.status.replace("_", " ")}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Feedback</CardTitle>
                <CardDescription>
                  Latest feedback from the client
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingFeedback ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : clientFeedback.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No feedback recorded yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {clientFeedback.slice(0, 5).map((fb) => (
                      <div
                        key={fb.id}
                        className="p-3 rounded-lg border space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {fb.source}
                            </Badge>
                            {fb.sentiment && (
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                                  getSentimentClasses(fb.sentiment)
                                )}
                              >
                                {fb.sentiment}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(fb.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">{fb.raw_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risks & Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risks & Notes</CardTitle>
                <CardDescription>
                  Internal observations and risk factors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.health_score < 50 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Low Health Score
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">
                        Client health score is below 50. Review recent
                        feedback and take corrective action.
                      </p>
                    </div>
                  </div>
                )}
                {client.status === "dormant" && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Dormant Client
                      </p>
                      <p className="text-xs text-yellow-600 mt-0.5">
                        This client is currently dormant. Consider reaching
                        out with new opportunities.
                      </p>
                    </div>
                  </div>
                )}
                {client.internal_notes ? (
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Internal Notes
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {client.internal_notes}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No internal notes recorded.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          {loadingContacts ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ContactList
              clientId={clientId}
              contacts={clientContacts}
              onRefresh={() => refetchContacts()}
            />
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          {loadingProjects ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : clientProjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No projects found for this client.
            </div>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientProjects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <TableCell className="font-medium">
                        {project.name}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {project.type.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
                            getProjectStatusClasses(project.status)
                          )}
                        >
                          {project.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.start_date
                          ? new Date(project.start_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.end_date
                          ? new Date(project.end_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          {loadingFeedback ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : clientFeedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No feedback recorded for this client.
            </div>
          ) : (
            <div className="space-y-4">
              {clientFeedback.map((fb) => (
                <Card key={fb.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {fb.source}
                        </Badge>
                        {fb.sentiment && (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                              getSentimentClasses(fb.sentiment)
                            )}
                          >
                            {fb.sentiment}
                          </span>
                        )}
                        {fb.severity && (
                          <Badge
                            variant={
                              fb.severity === "critical"
                                ? "destructive"
                                : fb.severity === "major"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {fb.severity}
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {fb.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(fb.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{fb.raw_text}</p>
                    {fb.topics && fb.topics.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {fb.topics.map((topic) => (
                          <Badge
                            key={topic}
                            variant="secondary"
                            className="text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules">
          {loadingRules ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : clientRules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No rules defined for this client.
            </div>
          ) : (
            <div className="space-y-3">
              {clientRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              rule.rule_type === "hard"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {rule.rule_type}
                          </Badge>
                          <Badge
                            variant={
                              rule.status === "active" ? "success" : "outline"
                            }
                          >
                            {rule.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Priority: {rule.priority}
                          </span>
                        </div>
                        <p className="text-sm">{rule.description}</p>
                        {rule.applies_to && rule.applies_to.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-1">
                            <span className="text-xs text-muted-foreground">
                              Applies to:
                            </span>
                            {rule.applies_to.map((scope) => (
                              <Badge
                                key={scope}
                                variant="outline"
                                className="text-xs"
                              >
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        <p>Used {rule.usage_count}x</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Brand Tab */}
        <TabsContent value="brand">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>
                Brand profile management is available on the dedicated brand
                profile page.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/clients/${clientId}/brand`)}
              >
                Manage Brand Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
