"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Filter,
} from "lucide-react";
import {
  crmApi,
  type Project,
  type PaginatedResponse,
  type ProjectStatus,
} from "@/lib/crm-kb-api";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: "bg-purple-900/40 text-purple-300 border-purple-700",
  in_progress: "bg-blue-900/40 text-blue-300 border-blue-700",
  on_hold: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  completed: "bg-green-900/40 text-green-300 border-green-700",
  cancelled: "bg-red-900/40 text-red-300 border-red-700",
};

function formatType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatStatus(status: ProjectStatus): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProjectsPage() {
  const [data, setData] = useState<PaginatedResponse<Project> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchProjects() {
      setLoading(true);
      setError(null);
      try {
        const result = await crmApi.projects.list({
          page,
          size: 20,
          status: statusFilter || undefined,
        });
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch projects");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProjects();
    return () => {
      cancelled = true;
    };
  }, [page, statusFilter]);

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setStatusFilter(e.target.value);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/use-cases/crm"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to CRM KB
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-900/40 rounded-lg">
                <FolderKanban className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Projects</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Status filter */}
              <div className="relative flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={handleStatusChange}
                  className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none pr-8 cursor-pointer"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <Link
                href="/use-cases/crm/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => {
                setPage(1);
                setStatusFilter("");
              }}
              className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        ) : data && data.items.length === 0 ? (
          <div className="text-center py-32">
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No projects found</p>
            <p className="text-slate-500 text-sm mt-1">
              {statusFilter
                ? "Try adjusting the status filter."
                : "Create your first project to get started."}
            </p>
          </div>
        ) : data ? (
          <>
            {/* Table */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-800 border-b border-slate-700">
                      <th className="px-6 py-4 font-semibold text-slate-300 whitespace-nowrap">
                        Name
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-300 whitespace-nowrap">
                        Type
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-300 whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-300 whitespace-nowrap">
                        Start Date
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-300 whitespace-nowrap">
                        End Date
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-300 whitespace-nowrap">
                        Success
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {data.items.map((project) => (
                      <tr
                        key={project.id}
                        onClick={() => alert(`Project: ${project.name}\nID: ${project.id}`)}
                        className="hover:bg-slate-700/40 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                          {project.name}
                        </td>
                        <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                          {formatType(project.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[project.status]}`}
                          >
                            {formatStatus(project.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                          {formatDate(project.start_date)}
                        </td>
                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                          {formatDate(project.end_date)}
                        </td>
                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                          {project.success_flag ?? "\u2014"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between mt-6 px-2">
                <p className="text-sm text-slate-400">
                  Page {data.page} of {data.pages} ({data.total} total projects)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page >= data.pages}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
