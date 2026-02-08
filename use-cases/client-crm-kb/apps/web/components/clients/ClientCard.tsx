"use client";

import Link from "next/link";
import type { Client } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HealthScoreBadge } from "@/components/clients/HealthScoreWidget";
import {
  Building2,
  Globe,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientCardProps {
  client: Client;
  className?: string;
}

function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  switch (status) {
    case "active":
      return "success";
    case "prospect":
      return "info" as "default";
    case "dormant":
      return "warning";
    case "lost":
      return "destructive";
    default:
      return "secondary";
  }
}

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

export function ClientCard({ client, className }: ClientCardProps) {
  return (
    <Link href={`/clients/${client.id}`}>
      <Card
        className={cn(
          "hover:shadow-md transition-shadow cursor-pointer h-full",
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base truncate">
                {client.name}
              </h3>
              {client.legal_name && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {client.legal_name}
                </p>
              )}
            </div>
            <HealthScoreBadge score={client.health_score} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
                getStatusBadgeClasses(client.status)
              )}
            >
              {client.status}
            </span>
            {client.client_value_tier && (
              <Badge variant="outline" className="text-xs">
                Tier {client.client_value_tier}
              </Badge>
            )}
          </div>

          {client.industry && client.industry.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{client.industry.join(", ")}</span>
            </div>
          )}

          {client.website_url && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{client.website_url}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>
              Added {new Date(client.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
