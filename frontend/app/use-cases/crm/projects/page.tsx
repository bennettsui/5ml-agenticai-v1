"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Plus,
  Loader2,
  Building2,
  ChevronRight,
  ArrowRight,
  Search,
  Calendar,
  Zap,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  crmApi,
  type Brand,
  type Project,
  type ProjectStatus,
} from "@/lib/crm-kb-api";
import { useCrmAi } from "../context";

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: "bg-purple-900/40 text-purple-300 border-purple-700",
  in_progress: "bg-blue-900/40 text-blue-300 border-blue-700",
  on_hold: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  completed: "bg-green-900/40 text-green-300 border-green-700",
  cancelled: "bg-red-900/40 text-red-300 border-red-700",
};

const BRAND_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-900/40 text-green-300 border-green-700",
  prospect: "bg-blue-900/40 text-blue-300 border-blue-700",
  dormant: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  lost: "bg-red-900/40 text-red-300 border-red-700",
};

const BRAND_STATUS_DOT: Record<string, string> = {
  active: "bg-green-400",
  prospect: "bg-blue-400",
  dormant: "bg-yellow-400",
  lost: "bg-red-400",
};

function formatType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProjectsPage() {
  const router = useRouter();
  const { setPageState } = useCrmAi();

  // Brands state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load brands on mount
  useEffect(() => {
    setPageState({ pageType: "projects-list", pageTitle: "Projects" });

    async function fetchBrands() {
      setBrandsLoading(true);
      try {
        const data = await crmApi.brands.list({ size: 100 });
        const items = data.items ?? [];
        setBrands(items);
        if (items.length > 0) {
          setSelectedBrand(items[0]);
        }
      } catch {
        // silently ignore — brands list is non-critical
      } finally {
        setBrandsLoading(false);
      }
    }
    fetchBrands();
  }, []);

  // Load projects when selected brand changes
  useEffect(() => {
    if (!selectedBrand) {
      setProjects([]);
      return;
    }
    let cancelled = false;
    async function fetchProjects() {
      setProjectsLoading(true);
      try {
        const data = await crmApi.brands.projects(selectedBrand!.id, { size: 100 });
        if (!cancelled) setProjects(data.items ?? []);
      } catch {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    }
    fetchProjects();
    return () => {
      cancelled = true;
    };
  }, [selectedBrand]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, project: Project) => {
      e.stopPropagation();
      if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
      setDeletingId(project.id);
      try {
        await crmApi.projects.delete(project.id);
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete project");
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  const filteredBrands = brands.filter(
    (b) =>
      !brandSearch ||
      b.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
      (b.industry ?? []).some((i) =>
        i.toLowerCase().includes(brandSearch.toLowerCase())
      )
  );

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-900/40 rounded-lg">
            <FolderKanban className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Projects</h1>
            <p className="text-xs text-slate-400 mt-0.5">Select a brand to view and manage its projects</p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5 items-start">
        {/* Left: Brand Selector */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
            {/* Panel header */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-700/50">
              <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Brands
              </h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter brands..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Brands list */}
            <div className="max-h-[62vh] overflow-y-auto">
              {brandsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                </div>
              ) : filteredBrands.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Building2 className="w-7 h-7 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">
                    {brandSearch ? "No brands match your search" : "No brands yet"}
                  </p>
                  {!brandSearch && (
                    <Link
                      href="/use-cases/crm/brands/new"
                      className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 inline-block"
                    >
                      + Add first brand
                    </Link>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-700/30">
                  {filteredBrands.map((brand) => {
                    const isSelected = selectedBrand?.id === brand.id;
                    return (
                      <button
                        key={brand.id}
                        onClick={() => setSelectedBrand(brand)}
                        className={`w-full px-4 py-3 text-left transition-all ${
                          isSelected
                            ? "bg-emerald-900/20 border-l-2 border-emerald-400 pl-3.5"
                            : "hover:bg-white/[0.03] border-l-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-sm font-medium truncate ${
                              isSelected ? "text-white" : "text-slate-300"
                            }`}
                          >
                            {brand.name}
                          </span>
                          {isSelected && (
                            <ChevronRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              BRAND_STATUS_DOT[brand.status] ?? "bg-slate-500"
                            }`}
                          />
                          <span className="text-xs text-slate-500 capitalize">
                            {brand.status}
                          </span>
                          {brand.client_value_tier && (
                            <>
                              <span className="text-slate-700 text-xs">·</span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-700/60 px-1.5 py-0.5 rounded">
                                Tier {brand.client_value_tier}
                              </span>
                            </>
                          )}
                        </div>
                        {brand.industry && brand.industry.length > 0 && (
                          <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                            {brand.industry.slice(0, 2).join(", ")}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700/50">
              <Link
                href="/use-cases/crm/brands/new"
                className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors rounded-lg hover:bg-white/[0.03]"
              >
                <Plus className="w-3.5 h-3.5" />
                New Brand
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Projects Panel */}
        <div className="flex-1 min-w-0">
          {!selectedBrand ? (
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl flex items-center justify-center py-24">
              <div className="text-center">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Select a brand to view its projects</p>
              </div>
            </div>
          ) : (
            <>
              {/* Brand context header */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-slate-700/60 rounded-xl flex-shrink-0">
                      <Building2 className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-white truncate">
                          {selectedBrand.name}
                        </h2>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            BRAND_STATUS_COLORS[selectedBrand.status] ??
                            "bg-slate-700 text-slate-300 border-slate-600"
                          }`}
                        >
                          {selectedBrand.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {selectedBrand.industry && selectedBrand.industry.length > 0 && (
                          <span className="text-xs text-slate-400">
                            {selectedBrand.industry.slice(0, 2).join(", ")}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-400">
                            Health: {selectedBrand.health_score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/use-cases/crm/brands/detail?id=${selectedBrand.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
                    >
                      Brand Profile
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      href={`/use-cases/crm/projects/new?client_id=${selectedBrand.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Project
                    </Link>
                  </div>
                </div>
              </div>

              {/* Projects list */}
              {projectsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <div className="bg-slate-800/40 border border-slate-700/50 border-dashed rounded-xl p-12 text-center">
                  <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm mb-1">
                    No projects yet for {selectedBrand.name}
                  </p>
                  <p className="text-xs text-slate-500 mb-5">
                    Create the first project for this brand to get started
                  </p>
                  <Link
                    href={`/use-cases/crm/projects/new?client_id=${selectedBrand.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create Project
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() =>
                        router.push(
                          `/use-cases/crm/projects/detail?id=${project.id}`
                        )
                      }
                      className="group bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 hover:bg-slate-800/80 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-sm font-semibold text-white truncate">
                              {project.name}
                            </h3>
                            {(project.type === "social_campaign" ||
                              project.type === "content_production") && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-500/10 border border-purple-700/30 rounded text-[10px] text-purple-400 flex-shrink-0">
                                <Zap className="w-2.5 h-2.5" /> SCO
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                            <span className="capitalize">
                              {formatType(project.type)}
                            </span>
                            {project.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {formatDate(project.start_date)}
                                {project.end_date && (
                                  <> → {formatDate(project.end_date)}</>
                                )}
                              </span>
                            )}
                            {project.success_flag && (
                              <span className="text-slate-500">
                                · {project.success_flag}
                              </span>
                            )}
                          </div>

                          {project.brief && (
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              {project.brief}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              STATUS_COLORS[project.status]
                            }`}
                          >
                            {formatStatus(project.status)}
                          </span>
                          <button
                            onClick={(e) => handleDelete(e, project)}
                            disabled={deletingId === project.id}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40"
                            title="Delete project"
                          >
                            {deletingId === project.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
