import React from "react";
import {
  Skeleton,
  KpiGridSkeleton,
  KanbanBoardSkeleton,
} from "@/components/ui/skeleton";

export default function ManagerDashboardLoading() {
  return (
    <div className="space-y-6 pb-12">
      {/* ── Manager Command Banner Skeleton ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-28 rounded-full bg-white/10" />
              <Skeleton className="h-5 w-32 rounded-full bg-white/10" />
            </div>
            <Skeleton className="h-8 w-56 rounded-lg bg-white/20" />
            <Skeleton className="h-4 w-80 rounded bg-white/10" />
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-6 w-28 rounded-lg bg-white/10" />
              <Skeleton className="h-6 w-36 rounded-lg bg-white/10" />
              <Skeleton className="h-6 w-32 rounded-lg bg-white/10" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-xl bg-white/10" />
            <Skeleton className="h-9 w-40 rounded-xl bg-white/10" />
            <Skeleton className="h-9 w-28 rounded-xl bg-indigo-500/40" />
          </div>
        </div>
      </div>

      {/* ── Active Team Assignees Live Roster Skeleton ── */}
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/90">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-3 w-40 rounded" />
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-shrink-0 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/60"
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-2.5 w-14 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Metric Grid Skeleton ── */}
      <KpiGridSkeleton />

      {/* ── Kanban Board Skeleton ── */}
      <KanbanBoardSkeleton />
    </div>
  );
}
