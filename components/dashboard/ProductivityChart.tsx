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
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        No productivity metrics recorded for this period.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.completed, d.created || 0, 5)));
  const totalCompletedInPeriod = data.reduce((acc, d) => acc + d.completed, 0);

  // SVG dimensions
  const height = 180;
  const paddingX = 20;
  const paddingY = 25;

  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1)) * (600 - paddingX * 2);
    const y = height - paddingY - (d.completed / maxVal) * (height - paddingY * 2);
    return { x, y, d, index };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0} ${height - paddingY} L ${points[0]?.x || 0} ${height - paddingY} Z`;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success">
              <TrendingUp className="w-3 h-3" /> +{totalCompletedInPeriod} done
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>Created</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 600 ${height}`}
          className="w-full h-44 overflow-visible"
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
                    ? "fill-primary stroke-white dark:stroke-slate-900 stroke-2"
                    : "fill-white dark:fill-slate-900 stroke-primary stroke-2"
                }`}
              />
            </g>
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute -top-1 pointer-events-none transform -translate-x-1/2 p-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border border-slate-700 text-xs z-30 transition-all"
            style={{
              left: `${(points[hoveredIndex].x / 600) * 100}%`,
            }}
          >
            <div className="font-bold flex items-center gap-1.5 text-[11px]">
              <Calendar className="w-3 h-3 opacity-70" />
              {points[hoveredIndex].d.label}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px]">
              <span className="text-emerald-400 dark:text-emerald-600 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                {points[hoveredIndex].d.completed} completed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Date Labels */}
      <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
