"use client";

import React, { useState } from "react";
import { TrendingUp, CheckCircle2, Calendar } from "lucide-react";

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

export function ProductivityChart({
  data = [],
  title = "30-Day Velocity & Output",
  subtitle = "Daily completed tasks across the workspace",
}: ProductivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
        No productivity metrics recorded for this period.
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.completed, d.created || 0, 5))
  );
  const totalCompletedInPeriod = data.reduce((acc, d) => acc + d.completed, 0);

  // SVG dimensions
  const height = 180;
  const paddingX = 20;
  const paddingY = 25;

  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1)) * (600 - paddingX * 2);
    const y =
      height - paddingY - (d.completed / maxVal) * (height - paddingY * 2);
    return { x, y, d, index };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0} ${height - paddingY} L ${points[0]?.x || 0} ${height - paddingY} Z`;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
              <TrendingUp className="h-3 w-3" /> +{totalCompletedInPeriod} done
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>Created</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 600 ${height}`}
          className="h-44 w-full overflow-visible"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = height - paddingY - ratio * (height - paddingY * 2);
            return (
              <line
                key={ratio}
                x1={paddingX}
                y1={y}
                x2={600 - paddingX}
                y2={y}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Smooth Gradient Area */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Smooth Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#4F46E5"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points & Hover Targets */}
          {points.map((p) => (
            <g
              key={p.index}
              onMouseEnter={() => setHoveredIndex(p.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              {/* Invisible larger hover hit area */}
              <circle cx={p.x} cy={p.y} r="12" fill="transparent" />

              {/* Data circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === p.index ? "5" : "3"}
                className={`transition-all duration-150 ${
                  hoveredIndex === p.index
                    ? "fill-primary stroke-white stroke-2 dark:stroke-slate-900"
                    : "fill-white stroke-primary stroke-2 dark:fill-slate-900"
                }`}
              />
            </g>
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="pointer-events-none absolute -top-1 z-30 -translate-x-1/2 transform rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white shadow-xl transition-all dark:bg-white dark:text-slate-900"
            style={{
              left: `${(points[hoveredIndex].x / 600) * 100}%`,
            }}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <Calendar className="h-3 w-3 opacity-70" />
              {points[hoveredIndex].d.label}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-0.5 font-semibold text-emerald-400 dark:text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                {points[hoveredIndex].d.completed} completed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Date Labels */}
      <div className="flex justify-between border-t border-slate-100 pt-1 text-[10px] text-slate-400 dark:border-slate-800">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
