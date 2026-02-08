"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface HealthScoreTrendProps {
  data: { date: string; score: number }[];
  height?: number;
  className?: string;
}

export function HealthScoreTrend({
  data,
  height = 200,
  className,
}: HealthScoreTrendProps) {
  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground text-sm ${className ?? ""}`}
        style={{ height }}
      >
        No health score history available
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              fontSize: "12px",
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <ReferenceLine
            y={80}
            stroke="hsl(142, 76%, 36%)"
            strokeDasharray="3 3"
            label={{ value: "Good", position: "right", fontSize: 10 }}
          />
          <ReferenceLine
            y={40}
            stroke="hsl(0, 84%, 60%)"
            strokeDasharray="3 3"
            label={{ value: "At Risk", position: "right", fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
