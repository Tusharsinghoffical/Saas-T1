import React from "react";
import {
  Skeleton,
  KpiGridSkeleton,
  KanbanBoardSkeleton,
  ChartSkeleton,
} from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 pb-12">
      {/* ── Executive Admin Command Banner Skeleton ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-28 rounded-full bg-white/10" />
              <Skeleton className="h-5 w-36 rounded-full bg-white/10" />
              <Skeleton className="h-5 w-32 rounded-full bg-white/10" />
            </div>
            <Skeleton className="h-8 w-64 rounded-lg bg-white/20" />
            <Skeleton className="h-4 w-96 rounded bg-white/10" />
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-6 w-28 rounded-lg bg-white/10" />
              <Skeleton className="h-6 w-40 rounded-lg bg-white/10" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 lg:flex-col lg:items-end">
            <Skeleton className="h-9 w-64 rounded-xl bg-white/10" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28 rounded-xl bg-white/10" />
              <Skeleton className="h-9 w-24 rounded-xl bg-white/10" />
              <Skeleton className="h-9 w-28 rounded-xl bg-indigo-500/40" />
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards Skeleton ── */}
      <KpiGridSkeleton />

      {/* ── Productivity Chart Skeleton ── */}
      <ChartSkeleton title="30-Day Workspace Productivity" />

      {/* ── Task Swimlane Summary Bar Skeleton ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90"
          >
            <Skeleton className="h-3 w-3 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-10 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Kanban Board Skeleton ── */}
      <KanbanBoardSkeleton />
    </div>
  );
}
