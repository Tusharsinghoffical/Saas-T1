"use client";

import React, { useState, useMemo } from "react";
import { TrendingUp, CheckCircle2, Calendar, Sparkles, Activity } from "lucide-react";

export interface ProductivityDay {
  date: string;
  label: string;
  completed: number;
  created?: number;
}

export interface ProductivityChartProps {
  data: ProductivityDay[];
  title?: string;
  subtitle?: string;
}

// Smooth cubic bezier spline calculation
function getSmoothSvgPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function ProductivityChart({
  data = [],
  title = "30-Day Workspace Productivity",
  subtitle = "Daily task creation & completion velocity trend",
}: ProductivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedRange, setSelectedRange] = useState<"7d" | "14d" | "30d">("30d");

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (selectedRange === "7d") return data.slice(-7);
    if (selectedRange === "14d") return data.slice(-14);
    return data;
  }, [data, selectedRange]);

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-slate-800">
        <Activity className="mb-2 h-6 w-6 text-slate-300 dark:text-slate-600" />
        No productivity metrics recorded for this period.
      </div>
    );
  }

  const maxVal = Math.max(
    ...filteredData.map((d) => Math.max(d.completed, d.created || 0, 4))
  );
  const totalCompletedInPeriod = filteredData.reduce((acc, d) => acc + d.completed, 0);
  const totalCreatedInPeriod = filteredData.reduce((acc, d) => acc + (d.created || 0), 0);

  // SVG dimensions
  const height = 180;
  const paddingX = 18;
  const paddingY = 24;
  const viewBoxWidth = 600;

  const points = filteredData.map((d, index) => {
    const x =
      paddingX +
      (index / Math.max(filteredData.length - 1, 1)) *
        (viewBoxWidth - paddingX * 2);
    const y =
      height - paddingY - (d.completed / maxVal) * (height - paddingY * 2);
    return { x, y, d, index };
  });

  const pathD = getSmoothSvgPath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaD = `${pathD} L ${lastPoint?.x || 0} ${height - paddingY} L ${firstPoint?.x || 0} ${height - paddingY} Z`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" /> +{totalCompletedInPeriod} done
            </span>
            {totalCreatedInPeriod > 0 && (
              <span className="hidden items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 sm:inline-flex">
                <Sparkles className="h-2.5 w-2.5" /> +{totalCreatedInPeriod} created
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        {/* Range Selector & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-indigo-500/20" />
              <span className="text-[11px] font-medium">Completed</span>
            </div>
          </div>

          {/* Period Range Switcher */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-[11px] font-semibold dark:border-slate-800 dark:bg-slate-800/60">
            {(["7d", "14d", "30d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRange(r)}
                className={`rounded-md px-2 py-0.5 transition-all ${
                  selectedRange === r
                    ? "bg-white text-slate-900 shadow-sm font-bold dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full overflow-hidden pt-1">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${height}`}
          className="h-44 w-full overflow-visible"
        >
          <defs>
            <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.32" />
              <stop offset="70%" stopColor="#6366F1" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
            </linearGradient>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366F1" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = height - paddingY - ratio * (height - paddingY * 2);
            return (
              <line
                key={ratio}
                x1={paddingX}
                y1={y}
                x2={viewBoxWidth - paddingX}
                y2={y}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800/80"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Smooth Gradient Area */}
          <path d={areaD} fill="url(#productivityGradient)" />

          {/* Smooth Trend Line with Glow */}
          <path
            d={pathD}
            fill="none"
            stroke="#6366F1"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lineGlow)"
          />

          {/* Interactive Data Points */}
          {points.map((p) => {
            const isHovered = hoveredIndex === p.index;
            const hasData = p.d.completed > 0;
            return (
              <g
                key={p.index}
                onMouseEnter={() => setHoveredIndex(p.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Large Invisible Hit Area */}
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                {/* Outer Glow Ring on Hover */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="8"
                    className="animate-ping fill-indigo-400/30"
                  />
                )}

                {/* Point Circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? "5.5" : hasData ? "4" : "2.5"}
                  className={`transition-all duration-150 ${
                    isHovered
                      ? "fill-indigo-600 stroke-white stroke-2 dark:fill-indigo-400 dark:stroke-slate-950 shadow-lg"
                      : hasData
                        ? "fill-white stroke-indigo-600 stroke-2 dark:fill-slate-900 dark:stroke-indigo-400"
                        : "fill-slate-200 stroke-slate-400 stroke-1 dark:fill-slate-800 dark:stroke-slate-600"
                  }`}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="pointer-events-none absolute -top-2 z-30 -translate-x-1/2 transform rounded-xl border border-slate-700/80 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-2xl backdrop-blur-md transition-all dark:border-slate-300/40 dark:bg-white/95 dark:text-slate-900"
            style={{
              left: `${(points[hoveredIndex].x / viewBoxWidth) * 100}%`,
            }}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <Calendar className="h-3 w-3 text-indigo-400 dark:text-indigo-600" />
              {points[hoveredIndex].d.label}
            </div>
            <div className="mt-1 flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 font-bold text-emerald-400 dark:text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                {points[hoveredIndex].d.completed} completed
              </span>
              {points[hoveredIndex].d.created !== undefined && (
                <span className="text-slate-400 dark:text-slate-500">
                  {points[hoveredIndex].d.created} created
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Date Labels */}
      <div className="flex justify-between border-t border-slate-100 pt-2 text-[10px] font-medium text-slate-400 dark:border-slate-800">
        <span>{filteredData[0]?.label}</span>
        <span>{filteredData[Math.floor(filteredData.length / 2)]?.label}</span>
        <span>{filteredData[filteredData.length - 1]?.label}</span>
      </div>
    </div>
  );
}
