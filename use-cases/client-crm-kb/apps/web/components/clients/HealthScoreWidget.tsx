"use client";

import { cn } from "@/lib/utils";

interface HealthScoreWidgetProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
  if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  if (score >= 40) return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-red-600 bg-red-50 border-red-200";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "At Risk";
  return "Critical";
}

function getProgressColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
};

export function HealthScoreWidget({
  score,
  size = "md",
  showLabel = true,
  className,
}: HealthScoreWidgetProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full border-2 font-bold",
          sizeClasses[size],
          getScoreColor(clampedScore)
        )}
      >
        {clampedScore}
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{getScoreLabel(clampedScore)}</span>
          <div className="mt-1 h-1.5 w-24 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", getProgressColor(clampedScore))}
              style={{ width: `${clampedScore}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function HealthScoreBadge({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border",
        getScoreColor(clampedScore)
      )}
    >
      {clampedScore}
    </span>
  );
}
