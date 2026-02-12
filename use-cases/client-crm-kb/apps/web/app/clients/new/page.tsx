"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clients as clientsApi, ApiError } from "@/lib/api";
import type { ClientStatus, ClientValueTier, ClientCreate } from "@/types";
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
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Active" },
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
}

export default function NewClientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormData>({
    name: "",
    legal_name: "",
    industry: "",
    region: "",
    languages: "",
    status: "prospect",
    timezone: "Asia/Hong_Kong",
    website_url: "",
    company_size: "",
    parent_company: "",
    internal_notes: "",
    client_value_tier: "",
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: ClientCreate) => clientsApi.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push(`/clients/${created.id}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const body = err.body as { detail?: string };
        setError(body?.detail || "Failed to create client");
      } else {
        setError("An unexpected error occurred");
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Client name is required");
      return;
    }

    const splitAndTrim = (val: string): string[] | null => {
      if (!val.trim()) return null;
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const data: ClientCreate = {
      name: form.name.trim(),
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
          href="/clients"
          className="hover:text-foreground transition-colors"
        >
          Clients
        </Link>
        <span>/</span>
        <span className="text-foreground">New Client</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Client</h1>
        <p className="text-muted-foreground mt-1">
          Register a new client in the CRM system
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
                  autoFocus
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
                  placeholder="Hong Kong, APAC, Greater China"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="languages">Languages (comma-separated)</Label>
                <Input
                  id="languages"
                  value={form.languages}
                  onChange={(e) => updateField("languages", e.target.value)}
                  placeholder="English, Chinese (Traditional)"
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
                  placeholder="Asia/Hong_Kong"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Internal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="internal_notes">Notes</Label>
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
            onClick={() => router.push("/clients")}
            disabled={mutation.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending || !form.name.trim()}>
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {mutation.isPending ? "Creating..." : "Create Client"}
          </Button>
        </div>
      </form>
    </div>
  );
}
