"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { TimeSeries } from "@/lib/types";

const tooltipStyle = {
  backgroundColor: "oklch(0.13 0.018 280 / 0.95)",
  border: "1px solid oklch(1 0 0 / 0.1)",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  color: "oklch(0.97 0.005 280)",
  backdropFilter: "blur(8px)",
};

/** Smooth area chart for time series */
export function AreaTimeChart({
  series,
  height = 200,
  showGrid = true,
  unit = "",
}: {
  series: TimeSeries[];
  height?: number;
  showGrid?: boolean;
  unit?: string;
}) {
  if (series.length === 0) return null;
  const data = series[0].points.map((p, i) => {
    const row: Record<string, number | string> = { time: new Date(p.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) };
    series.forEach((s) => {
      row[s.name] = s.points[i]?.value ?? 0;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`area-${i}-${s.name.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color ?? "oklch(0.72 0.22 295)"} stopOpacity={0.4} />
              <stop offset="100%" stopColor={s.color ?? "oklch(0.72 0.22 295)"} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />}
        <XAxis dataKey="time" stroke="oklch(0.62 0.02 280)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis stroke="oklch(0.62 0.02 280)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
        <Tooltip contentStyle={tooltipStyle} />
        {series.map((s, i) => (
          <Area
            key={i}
            type="monotone"
            dataKey={s.name}
            stroke={s.color ?? "oklch(0.72 0.22 295)"}
            strokeWidth={2}
            fill={`url(#area-${i}-${s.name.replace(/\s/g, "")})`}
            name={`${s.name}${unit ? ` (${s.unit || unit})` : ` (${s.unit})`}`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Line chart */
export function LineTimeChart({
  series,
  height = 200,
}: {
  series: TimeSeries[];
  height?: number;
}) {
  if (series.length === 0) return null;
  const data = series[0].points.map((p, i) => {
    const row: Record<string, number | string> = { time: new Date(p.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) };
    series.forEach((s) => {
      row[s.name] = s.points[i]?.value ?? 0;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
        <XAxis dataKey="time" stroke="oklch(0.62 0.02 280)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis stroke="oklch(0.62 0.02 280)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
        <Tooltip contentStyle={tooltipStyle} />
        {series.map((s, i) => (
          <Line
            key={i}
            type="monotone"
            dataKey={s.name}
            stroke={s.color ?? "oklch(0.72 0.22 295)"}
            strokeWidth={2}
            dot={false}
            name={`${s.name} (${s.unit})`}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Bar chart for counts (e.g., deployments per hour) */
export function BarCountChart({
  data,
  height = 180,
  color = "oklch(0.72 0.22 295)",
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
        <XAxis dataKey="label" stroke="oklch(0.62 0.02 280)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis stroke="oklch(0.62 0.02 280)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 0.03)" }} />
        <Bar dataKey="value" fill="url(#bar-grad)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Radial gauge for single percentage value */
export function RadialGauge({
  value,
  label,
  sublabel,
  size = 140,
  color = "oklch(0.72 0.22 295)",
}: {
  value: number; // 0..100
  label?: string;
  sublabel?: string;
  size?: number;
  color?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(1 0 0 / 0.05)"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{pct.toFixed(0)}%</span>
        {label && <span className="text-xs text-muted-foreground mt-0.5">{label}</span>}
        {sublabel && <span className="text-[10px] text-muted-foreground/60">{sublabel}</span>}
      </div>
    </div>
  );
}
