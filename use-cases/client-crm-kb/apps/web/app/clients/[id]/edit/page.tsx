"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clients as clientsApi, ApiError } from "@/lib/api";
import type { ClientStatus, ClientValueTier, ClientUpdate } from "@/types";
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

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "prospect", label: "Prospect" },
  { value: "dormant", label: "Dormant" },
  { value: "lost", label: "Lost" },
];

const TIER_OPTIONS: { value: ClientValueTier; label: string }[] = [
  { value: "A", label: "Tier A (Highest)" },
  { value: "B", label: "Tier B" },
  { value: "C", label: "Tier C" },
  { value: "D", label: "Tier D (Lowest)" },
];

const INDUSTRY_SUGGESTIONS = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Education",
  "Media",
  "Real Estate",
  "Energy",
  "Hospitality",
  "Automotive",
  "Telecommunications",
  "Food & Beverage",
  "Fashion",
  "Sports",
  "Entertainment",
];

interface FormData {
  name: string;
  legal_name: string;
  industry: string;
  region: string;
  languages: string;
  status: ClientStatus;
  timezone: string;
  website_url: string;
  company_size: string;
  parent_company: string;
  internal_notes: string;
  client_value_tier: string;
  health_score: string;
}

export default function ClientEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const clientId = params.id as string;

  const [form, setForm] = useState<FormData>({
    name: "",
    legal_name: "",
    industry: "",
    region: "",
    languages: "",
    status: "active",
    timezone: "",
    website_url: "",
    company_size: "",
    parent_company: "",
    internal_notes: "",
    client_value_tier: "",
    health_score: "50",
  });
  const [error, setError] = useState<string | null>(null);

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => clientsApi.get(clientId),
  });

  // Pre-populate form when client data loads
  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        legal_name: client.legal_name ?? "",
        industry: client.industry?.join(", ") ?? "",
        region: client.region?.join(", ") ?? "",
        languages: client.languages?.join(", ") ?? "",
        status: client.status,
        timezone: client.timezone ?? "",
        website_url: client.website_url ?? "",
        company_size: client.company_size ?? "",
        parent_company: client.parent_company ?? "",
        internal_notes: client.internal_notes ?? "",
        client_value_tier: client.client_value_tier ?? "",
        health_score: String(client.health_score),
      });
    }
  }, [client]);

  const mutation = useMutation({
    mutationFn: (data: ClientUpdate) => clientsApi.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-overview", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push(`/clients/${clientId}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const body = err.body as { detail?: string };
        setError(body?.detail || "Failed to update client");
      } else {
        setError("An unexpected error occurred");
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const splitAndTrim = (val: string): string[] | null => {
      if (!val.trim()) return null;
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const data: ClientUpdate = {
      name: form.name,
      legal_name: form.legal_name || null,
      industry: splitAndTrim(form.industry),
      region: splitAndTrim(form.region),
      languages: splitAndTrim(form.languages),
      status: form.status,
      timezone: form.timezone || null,
      website_url: form.website_url || null,
      company_size: form.company_size || null,
      parent_company: form.parent_company || null,
      internal_notes: form.internal_notes || null,
      client_value_tier: (form.client_value_tier as ClientValueTier) || null,
      health_score: parseInt(form.health_score) || 50,
    };

    mutation.mutate(data);
  }

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
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
        <span className="text-foreground">Edit</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
        <p className="text-muted-foreground mt-1">
          Update client information and settings
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
            <CardDescription>Core client identification details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_name">Legal Name</Label>
                <Input
                  id="legal_name"
                  value={form.legal_name}
                  onChange={(e) => updateField("legal_name", e.target.value)}
                  placeholder="Acme Corporation Ltd."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="value_tier">Value Tier</Label>
                <Select
                  value={form.client_value_tier || "none"}
                  onValueChange={(val) =>
                    updateField(
                      "client_value_tier",
                      val === "none" ? "" : val
                    )
                  }
                >
                  <SelectTrigger id="value_tier">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Tier</SelectItem>
                    {TIER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={form.website_url}
                onChange={(e) => updateField("website_url", e.target.value)}
                placeholder="https://www.example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Industry & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Industry & Region</CardTitle>
            <CardDescription>
              Comma-separated values for multi-select fields
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="industry">
                Industry (comma-separated)
              </Label>
              <Input
                id="industry"
                value={form.industry}
                onChange={(e) => updateField("industry", e.target.value)}
                placeholder="Technology, Finance, Healthcare"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {INDUSTRY_SUGGESTIONS.slice(0, 8).map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    className="text-xs px-2 py-0.5 rounded-full border bg-muted hover:bg-accent transition-colors"
                    onClick={() => {
                      const current = form.industry
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (!current.includes(ind)) {
                        updateField(
                          "industry",
                          [...current, ind].join(", ")
                        );
                      }
                    }}
                  >
                    + {ind}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Region (comma-separated)</Label>
                <Input
                  id="region"
                  value={form.region}
                  onChange={(e) => updateField("region", e.target.value)}
                  placeholder="EMEA, APAC, NA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="languages">Languages (comma-separated)</Label>
                <Input
                  id="languages"
                  value={form.languages}
                  onChange={(e) => updateField("languages", e.target.value)}
                  placeholder="English, Spanish, French"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_size">Company Size</Label>
                <Input
                  id="company_size"
                  value={form.company_size}
                  onChange={(e) =>
                    updateField("company_size", e.target.value)
                  }
                  placeholder="e.g. 100-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_company">Parent Company</Label>
                <Input
                  id="parent_company"
                  value={form.parent_company}
                  onChange={(e) =>
                    updateField("parent_company", e.target.value)
                  }
                  placeholder="Parent Corp Inc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={form.timezone}
                  onChange={(e) => updateField("timezone", e.target.value)}
                  placeholder="America/New_York"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health & Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Health Score & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="health_score">
                Health Score (0-100): {form.health_score}
              </Label>
              <input
                id="health_score"
                type="range"
                min={0}
                max={100}
                value={form.health_score}
                onChange={(e) =>
                  updateField("health_score", e.target.value)
                }
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 - Critical</span>
                <span>50 - At Risk</span>
                <span>100 - Excellent</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                value={form.internal_notes}
                onChange={(e) =>
                  updateField("internal_notes", e.target.value)
                }
                placeholder="Internal notes about this client..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/clients/${clientId}`)}
            disabled={mutation.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending || !form.name}>
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
