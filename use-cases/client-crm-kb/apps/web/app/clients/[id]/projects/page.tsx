"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { clients as clientsApi, projects as projectsApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  ArrowLeft,
  Loader2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

function getProgressPercent(status: string): number {
  switch (status) {
    case "planning":
      return 15;
    case "in_progress":
      return 55;
    case "on_hold":
      return 40;
    case "completed":
      return 100;
    case "cancelled":
      return 0;
    default:
      return 0;
  }
}

export default function ClientProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => clientsApi.get(clientId),
  });

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ["client-projects", clientId],
    queryFn: () => projectsApi.list({ client_id: clientId, size: 100 }),
  });

  const projects = projectsData?.items ?? [];

  if (loadingClient) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        <Link
          href={`/clients/${clientId}`}
          className="hover:text-foreground transition-colors"
        >
          {client?.name ?? "..."}
        </Link>
        <span>/</span>
        <span className="text-foreground">Projects</span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            All projects for {client?.name ?? "this client"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/clients/${clientId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Client
        </Button>
      </div>

      {/* Projects */}
      {loadingProjects ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No projects found for this client.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const progress = getProgressPercent(project.status);
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                      {project.brief && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {project.brief}
                        </p>
                      )}
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              progress === 100
                                ? "bg-green-500"
                                : progress > 0
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {project.start_date ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.start_date).toLocaleDateString()}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {project.end_date
                        ? new Date(project.end_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/projects/${project.id}`)
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
