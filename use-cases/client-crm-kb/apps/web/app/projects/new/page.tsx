"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  projects as projectsApi,
  clients as clientsApi,
  ApiError,
} from "@/lib/api";
import type { ProjectType, ProjectStatus, ProjectCreate } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";

const TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "social_campaign", label: "Social Campaign" },
  { value: "rebrand", label: "Rebrand" },
  { value: "video_series", label: "Video Series" },
  { value: "content_production", label: "Content Production" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

interface FormData {
  name: string;
  client_id: string;
  type: ProjectType;
  status: ProjectStatus;
  start_date: string;
  end_date: string;
  brief: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormData>({
    name: "",
    client_id: "",
    type: "website",
    status: "planning",
    start_date: "",
    end_date: "",
    brief: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch clients for the selector
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientsApi.list({ size: 200 }),
  });

  const mutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(`/projects/${created.id}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const body = err.body as { detail?: string };
        setError(body?.detail || "Failed to create project");
      } else {
        setError("An unexpected error occurred");
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Project name is required");
      return;
    }

    if (!form.client_id) {
      setError("Please select a client");
      return;
    }

    const data: ProjectCreate = {
      client_id: form.client_id,
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      brief: form.brief.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };

    mutation.mutate(data);
  }

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/projects"
          className="hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        <span>/</span>
        <span className="text-foreground">New Project</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
        <p className="text-muted-foreground mt-1">
          Create a new project in the CRM system
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
            <CardDescription>Core project details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                  placeholder="Q1 Brand Campaign"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => updateField("type", val)}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <Select
                  value={form.client_id || "none"}
                  onValueChange={(val) =>
                    updateField("client_id", val === "none" ? "" : val)
                  }
                >
                  <SelectTrigger id="client_id">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Select a client
                    </SelectItem>
                    {clientsLoading && (
                      <SelectItem value="loading" disabled>
                        Loading clients...
                      </SelectItem>
                    )}
                    {clientsData?.items?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => updateField("status", val)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
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
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule</CardTitle>
            <CardDescription>Project timeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => updateField("start_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => updateField("end_date", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brief */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Brief</CardTitle>
            <CardDescription>Project description and objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="brief">Brief Description</Label>
              <Textarea
                id="brief"
                value={form.brief}
                onChange={(e) => updateField("brief", e.target.value)}
                placeholder="Describe the project goals, scope, and key deliverables..."
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/projects")}
            disabled={mutation.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || !form.name.trim() || !form.client_id}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {mutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
