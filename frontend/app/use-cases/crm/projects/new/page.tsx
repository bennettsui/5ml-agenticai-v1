"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save,
  X,
  Loader2,
  ArrowLeft,
  FolderKanban,
} from "lucide-react";
import {
  crmApi,
  type Client,
  type ProjectCreate,
  type ProjectType,
  type ProjectStatus,
} from "@/lib/crm-kb-api";
import { useCrmAi } from '../../context';

const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "social_campaign", label: "Social Campaign" },
  { value: "rebrand", label: "Rebrand" },
  { value: "video_series", label: "Video Series" },
  { value: "content_production", label: "Content Production" },
  { value: "other", label: "Other" },
];

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { setPageState, updateFormData, registerFormCallback } = useCrmAi();

  useEffect(() => {
    setPageState({ pageType: 'projects-new', pageTitle: 'New Project' });
    registerFormCallback((updates: Record<string, string>) => {
      if ('name' in updates) setName(updates.name);
      if ('clientId' in updates) setClientId(updates.clientId);
      if ('type' in updates) setType(updates.type as ProjectType);
      if ('status' in updates) setStatus(updates.status as ProjectStatus);
      if ('startDate' in updates) setStartDate(updates.startDate);
      if ('endDate' in updates) setEndDate(updates.endDate);
      if ('brief' in updates) setBrief(updates.brief);
    });
    return () => registerFormCallback(null);
  }, []);

  // Client list for dropdown
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  // Form fields
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState<ProjectType>("website");
  const [status, setStatus] = useState<ProjectStatus>("planning");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [brief, setBrief] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const nameError = touched.name && !name.trim() ? "Name is required" : null;
  const clientError =
    touched.clientId && !clientId ? "Client is required" : null;

  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      try {
        const result = await crmApi.clients.list({ size: 200 });
        if (!cancelled) {
          setClients(result.items);
        }
      } catch {
        // Silently fail - the dropdown will just be empty
      } finally {
        if (!cancelled) {
          setClientsLoading(false);
        }
      }
    }

    loadClients();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Mark all required fields as touched
    setTouched({ name: true, clientId: true });

    if (!name.trim() || !clientId) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: ProjectCreate = {
        client_id: clientId,
        name: name.trim(),
        type,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        brief: brief.trim() || null,
      };

      await crmApi.projects.create(payload);
      router.push("/use-cases/crm/projects");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create project"
      );
      setSubmitting(false);
    }
  }

  const inputClasses =
    "w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500 transition-colors";
  const labelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
  const errorClasses = "text-xs text-red-400 mt-1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700/60 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link
              href="/use-cases/crm/projects"
              className="hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Projects
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200">New Project</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900/40 rounded-lg">
              <FolderKanban className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">New Project</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-lg space-y-6">
            {/* Error banner */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className={labelClasses}>
                Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  updateFormData({ name: val });
                }}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                placeholder="e.g. Q1 Social Campaign"
                className={`${inputClasses} ${nameError ? "border-red-500 focus:ring-red-500" : ""}`}
              />
              {nameError && <p className={errorClasses}>{nameError}</p>}
            </div>

            {/* Client */}
            <div>
              <label htmlFor="client" className={labelClasses}>
                Client <span className="text-red-400">*</span>
              </label>
              {clientsLoading ? (
                <div className="flex items-center gap-2 py-2.5 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading clients...
                </div>
              ) : (
                <select
                  id="client"
                  value={clientId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setClientId(val);
                    updateFormData({ clientId: val });
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, clientId: true }))}
                  className={`${inputClasses} cursor-pointer ${clientError ? "border-red-500 focus:ring-red-500" : ""}`}
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              )}
              {clientError && <p className={errorClasses}>{clientError}</p>}
            </div>

            {/* Type + Status row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="type" className={labelClasses}>
                  Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => {
                    const val = e.target.value as ProjectType;
                    setType(val);
                    updateFormData({ type: val });
                  }}
                  className={`${inputClasses} cursor-pointer`}
                >
                  {PROJECT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className={labelClasses}>
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => {
                    const val = e.target.value as ProjectStatus;
                    setStatus(val);
                    updateFormData({ status: val });
                  }}
                  className={`${inputClasses} cursor-pointer`}
                >
                  {PROJECT_STATUSES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start Date + End Date row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className={labelClasses}>
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    updateFormData({ startDate: val });
                  }}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="endDate" className={labelClasses}>
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEndDate(val);
                    updateFormData({ endDate: val });
                  }}
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Brief */}
            <div>
              <label htmlFor="brief" className={labelClasses}>
                Brief
              </label>
              <textarea
                id="brief"
                value={brief}
                onChange={(e) => {
                  const val = e.target.value;
                  setBrief(val);
                  updateFormData({ brief: val });
                }}
                placeholder="Project brief, goals, and key deliverables..."
                rows={4}
                className={`${inputClasses} resize-y`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Link
              href="/use-cases/crm/projects"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
