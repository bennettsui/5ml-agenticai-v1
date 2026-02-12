"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { clients as clientsApi } from "@/lib/api";
import type { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ClientCard } from "@/components/clients/ClientCard";
import { HealthScoreBadge } from "@/components/clients/HealthScoreWidget";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "prospect", label: "Prospect" },
  { value: "dormant", label: "Dormant" },
  { value: "lost", label: "Lost" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "health_score", label: "Health Score" },
  { value: "created_at", label: "Date Created" },
];

const PAGE_SIZE = 12;

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

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [healthMin, setHealthMin] = useState("");
  const [healthMax, setHealthMax] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["clients", page, statusFilter, debouncedSearch],
    queryFn: () =>
      clientsApi.list({
        page,
        size: PAGE_SIZE,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: debouncedSearch || undefined,
      }),
  });

  // Client-side sort and health filter since API may not support all params
  const filteredAndSorted = useCallback((): Client[] => {
    if (!data?.items) return [];
    let items = [...data.items];

    // Health score filter
    const min = healthMin ? parseInt(healthMin) : 0;
    const max = healthMax ? parseInt(healthMax) : 100;
    items = items.filter(
      (c) => c.health_score >= min && c.health_score <= max
    );

    // Sort
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "health_score":
          cmp = a.health_score - b.health_score;
          break;
        case "created_at":
          cmp =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [data, sortBy, sortDir, healthMin, healthMax]);

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: string }) {
    if (sortBy !== field)
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1" />
    );
  }

  const items = filteredAndSorted();
  const totalPages = data?.pages ?? 1;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client portfolio
          </p>
        </div>
        <Button onClick={() => router.push("/clients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="w-[160px]">
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

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Health:
          </span>
          <Input
            type="number"
            placeholder="Min"
            min={0}
            max={100}
            value={healthMin}
            onChange={(e) => setHealthMin(e.target.value)}
            className="w-[70px]"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            min={0}
            max={100}
            value={healthMax}
            onChange={(e) => setHealthMax(e.target.value)}
            className="w-[70px]"
          />
        </div>

        <div className="w-[160px]">
          <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={() => setViewMode("table")}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">
            Failed to load clients
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {items.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <p className="text-muted-foreground">
                No clients found matching your filters.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-foreground transition-colors"
                        onClick={() => toggleSort("name")}
                      >
                        Client
                        <SortIcon field="name" />
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-foreground transition-colors"
                        onClick={() => toggleSort("health_score")}
                      >
                        Health
                        <SortIcon field="health_score" />
                      </button>
                    </TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-foreground transition-colors"
                        onClick={() => toggleSort("created_at")}
                      >
                        Created
                        <SortIcon field="created_at" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.legal_name && (
                            <p className="text-xs text-muted-foreground">
                              {client.legal_name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
                            getStatusBadgeClasses(client.status)
                          )}
                        >
                          {client.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {client.industry?.join(", ") || "-"}
                      </TableCell>
                      <TableCell>
                        <HealthScoreBadge score={client.health_score} />
                      </TableCell>
                      <TableCell>
                        {client.client_value_tier ? (
                          <Badge variant="outline">
                            Tier {client.client_value_tier}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(client.created_at).toLocaleDateString()}
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
                Page {page} of {totalPages} ({data?.total ?? 0} total clients)
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
    </div>
  );
}
