"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projects as projectsApi, clients as clientsApi } from "@/lib/api";
import type {
  Project,
  DeliverableStatus,
  MilestoneStatus,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Pencil,
  Calendar,
  Users,
  Package,
  Milestone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Save,
  X,
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

function getDeliverableStatusClasses(status: DeliverableStatus): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "review":
      return "bg-yellow-100 text-yellow-800";
    case "not_started":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getMilestoneIcon(status: MilestoneStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "delayed":
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    brief: "",
    status: "" as string,
    start_date: "",
    end_date: "",
  });

  const {
    data: project,
    isLoading: loadingProject,
    error: projectError,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.get(projectId),
  });

  const { data: deliverables, isLoading: loadingDeliverables } = useQuery({
    queryKey: ["project-deliverables", projectId],
    queryFn: () => projectsApi.listDeliverables(projectId),
  });

  const { data: milestones, isLoading: loadingMilestones } = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: () => projectsApi.listMilestones(projectId),
  });

  const { data: team, isLoading: loadingTeam } = useQuery({
    queryKey: ["project-team", projectId],
    queryFn: () => projectsApi.listTeam(projectId),
  });

  const { data: client } = useQuery({
    queryKey: ["client", project?.client_id],
    queryFn: () => clientsApi.get(project!.client_id),
    enabled: !!project?.client_id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Project>) =>
      projectsApi.update(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setEditing(false);
    },
  });

  function startEdit() {
    if (!project) return;
    setEditForm({
      name: project.name,
      brief: project.brief ?? "",
      status: project.status,
      start_date: project.start_date ?? "",
      end_date: project.end_date ?? "",
    });
    setEditing(true);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({
      name: editForm.name,
      brief: editForm.brief || null,
      status: editForm.status as Project["status"],
      start_date: editForm.start_date || null,
      end_date: editForm.end_date || null,
    });
  }

  if (loadingProject) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">
            Failed to load project
          </p>
          <p className="text-sm text-muted-foreground">
            {projectError instanceof Error
              ? projectError.message
              : "Project not found"}
          </p>
          <Button variant="outline" onClick={() => router.push("/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const deliverablesList = deliverables ?? [];
  const milestonesList = milestones ?? [];
  const teamList = team ?? [];

  const completedDeliverables = deliverablesList.filter(
    (d) => d.status === "completed"
  ).length;
  const completedMilestones = milestonesList.filter(
    (m) => m.status === "completed"
  ).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/projects"
          className="hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        {client && (
          <>
            <span>/</span>
            <Link
              href={`/clients/${project.client_id}`}
              className="hover:text-foreground transition-colors"
            >
              {client.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{project.name}</span>
      </div>

      {/* Project Header */}
      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Project Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(val) =>
                      setEditForm({ ...editForm, status: val })
                    }
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-brief">Brief</Label>
                <Textarea
                  id="edit-brief"
                  value={editForm.brief}
                  onChange={(e) =>
                    setEditForm({ ...editForm, brief: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start">Start Date</Label>
                  <Input
                    id="edit-start"
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        start_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end">End Date</Label>
                  <Input
                    id="edit-end"
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        end_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">
                {project.name}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                  getProjectStatusClasses(project.status)
                )}
              >
                {project.status.replace("_", " ")}
              </span>
              <Badge variant="outline" className="capitalize">
                {project.type.replace("_", " ")}
              </Badge>
            </div>
            {project.brief && (
              <p className="text-muted-foreground max-w-2xl">
                {project.brief}
              </p>
            )}
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              {client && (
                <Link
                  href={`/clients/${project.client_id}`}
                  className="hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  Client: {client.name}
                </Link>
              )}
              {project.start_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(project.start_date).toLocaleDateString()} -{" "}
                  {project.end_date
                    ? new Date(project.end_date).toLocaleDateString()
                    : "Ongoing"}
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">
              {completedDeliverables}/{deliverablesList.length}
            </p>
            <p className="text-xs text-muted-foreground">Deliverables</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Milestone className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">
              {completedMilestones}/{milestonesList.length}
            </p>
            <p className="text-xs text-muted-foreground">Milestones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{teamList.length}</p>
            <p className="text-xs text-muted-foreground">Team Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {project.success_flag === "success" ? (
              <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
            ) : project.success_flag === "failure" ? (
              <AlertCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
            ) : (
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            )}
            <p className="text-2xl font-bold capitalize">
              {project.success_flag ?? "-"}
            </p>
            <p className="text-xs text-muted-foreground">Success Flag</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="deliverables" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Deliverables Tab */}
        <TabsContent value="deliverables">
          {loadingDeliverables ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : deliverablesList.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No deliverables defined for this project yet.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliverablesList.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="capitalize font-medium">
                        {d.type.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.description ?? "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                            getDeliverableStatusClasses(d.status)
                          )}
                        >
                          {d.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {d.due_date
                          ? new Date(d.due_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          {loadingMilestones ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : milestonesList.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No milestones defined for this project yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-0">
              {milestonesList
                .sort((a, b) => {
                  if (!a.due_date) return 1;
                  if (!b.due_date) return -1;
                  return (
                    new Date(a.due_date).getTime() -
                    new Date(b.due_date).getTime()
                  );
                })
                .map((milestone, idx) => (
                  <div key={milestone.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      {getMilestoneIcon(milestone.status)}
                      {idx < milestonesList.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-6 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{milestone.name}</p>
                        <Badge
                          variant={
                            milestone.status === "completed"
                              ? "success"
                              : milestone.status === "delayed"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {milestone.status}
                        </Badge>
                      </div>
                      {milestone.due_date && (
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(
                            milestone.due_date
                          ).toLocaleDateString()}
                        </p>
                      )}
                      {milestone.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          {loadingTeam ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : teamList.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No team members assigned to this project yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamList.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.user_id}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {member.role}
                          </Badge>
                          {member.allocation != null && (
                            <span className="text-xs text-muted-foreground">
                              {member.allocation}% allocated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
