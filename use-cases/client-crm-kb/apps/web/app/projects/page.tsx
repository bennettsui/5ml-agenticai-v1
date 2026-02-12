"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projects as projectsApi } from "@/lib/api";
import type { ProjectStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Columns3,
  Calendar,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "website", label: "Website" },
  { value: "social_campaign", label: "Social Campaign" },
  { value: "rebrand", label: "Rebrand" },
  { value: "video_series", label: "Video Series" },
  { value: "content_production", label: "Content Production" },
  { value: "other", label: "Other" },
];

const KANBAN_COLUMNS: {
  status: ProjectStatus;
  label: string;
  color: string;
}[] = [
  {
    status: "planning",
    label: "Planning",
    color: "border-purple-300 bg-purple-50",
  },
  {
    status: "in_progress",
    label: "In Progress",
    color: "border-blue-300 bg-blue-50",
  },
  {
    status: "on_hold",
    label: "On Hold",
    color: "border-yellow-300 bg-yellow-50",
  },
  {
    status: "completed",
    label: "Completed",
    color: "border-green-300 bg-green-50",
  },
  {
    status: "cancelled",
    label: "Cancelled",
    color: "border-red-300 bg-red-50",
  },
];

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

const PAGE_SIZE = 20;

export default function ProjectsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", page, statusFilter],
    queryFn: () =>
      projectsApi.list({
        page,
        size: PAGE_SIZE,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  // Client-side type filter
  const filteredProjects = (data?.items ?? []).filter((p) => {
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    return true;
  });

  const totalPages = data?.pages ?? 1;

  // For kanban view, fetch all projects
  const { data: allProjectsData } = useQuery({
    queryKey: ["projects-all-kanban"],
    queryFn: () => projectsApi.list({ size: 200 }),
    enabled: viewMode === "kanban",
  });

  const kanbanProjects = (
    allProjectsData?.items ??
    data?.items ??
    []
  ).filter((p) => {
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            All projects across clients
          </p>
        </div>
        <Button onClick={() => router.push("/projects/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="w-[180px]">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[180px]">
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center border rounded-md">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={() => setViewMode("table")}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => setViewMode("kanban")}
          >
            <Columns3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">
            Failed to load projects
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {viewMode === "kanban" ? (
            /* Kanban View */
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {KANBAN_COLUMNS.map((column) => {
                const columnProjects = kanbanProjects.filter(
                  (p) => p.status === column.status
                );
                return (
                  <div
                    key={column.status}
                    className={cn(
                      "rounded-lg border-2 p-3 min-h-[200px]",
                      column.color
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">{column.label}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {columnProjects.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {columnProjects.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No projects
                        </p>
                      ) : (
                        columnProjects.map((project) => (
                          <Card
                            key={project.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() =>
                              router.push(`/projects/${project.id}`)
                            }
                          >
                            <CardContent className="p-3 space-y-2">
                              <p className="font-medium text-sm leading-tight">
                                {project.name}
                              </p>
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] capitalize"
                                >
                                  {project.type.replace("_", " ")}
                                </Badge>
                                {project.end_date && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(
                                      project.end_date
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <>
              {filteredProjects.length === 0 ? (
                <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
                  No projects found matching your filters.
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
                        <TableHead>Success</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project) => (
                        <TableRow
                          key={project.id}
                          className="cursor-pointer"
                          onClick={() =>
                            router.push(`/projects/${project.id}`)
                          }
                        >
                          <TableCell>
                            <p className="font-medium">{project.name}</p>
                            {project.brief && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
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
                          <TableCell className="text-muted-foreground text-sm">
                            {project.start_date
                              ? new Date(
                                  project.start_date
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {project.end_date
                              ? new Date(
                                  project.end_date
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {project.success_flag ? (
                              <Badge
                                variant={
                                  project.success_flag === "success"
                                    ? "success"
                                    : project.success_flag === "failure"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {project.success_flag}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({data?.total ?? 0} total
                    projects)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
