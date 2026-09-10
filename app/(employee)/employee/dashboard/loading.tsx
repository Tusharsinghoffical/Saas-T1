import React from "react";
import { Skeleton, KpiGridSkeleton, TaskCardSkeleton } from "@/components/ui/skeleton";

export default function EmployeeDashboardLoading() {
  return (
    <div className="space-y-6 pb-12">
      {/* ── Employee Sprint Banner Skeleton ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-24 rounded-full bg-white/10" />
              <Skeleton className="h-5 w-32 rounded-full bg-white/10" />
            </div>
            <Skeleton className="h-8 w-60 rounded-lg bg-white/20" />
            <Skeleton className="h-4 w-72 rounded bg-white/10" />
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-6 w-28 rounded-lg bg-white/10" />
              <Skeleton className="h-6 w-32 rounded-lg bg-white/10" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-xl bg-white/10" />
            <Skeleton className="h-9 w-32 rounded-xl bg-white/10" />
          </div>
        </div>
      </div>

      {/* ── KPI Metric Grid Skeleton ── */}
      <KpiGridSkeleton />

      {/* ── Task Filter & Search Bar Skeleton ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-9 w-48 rounded-xl" />
      </div>

      {/* ── Employee Assigned Tasks Stack Skeleton ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
