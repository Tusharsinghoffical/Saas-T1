import React from "react";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function AdminActivityLoading() {
  return (
    <div className="space-y-6 pb-12">
      {/* ── Banner Skeleton ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28 rounded-full bg-white/10" />
            <Skeleton className="h-5 w-24 rounded-full bg-white/10" />
          </div>
          <Skeleton className="h-8 w-56 rounded-lg bg-white/20" />
          <Skeleton className="h-4 w-96 rounded bg-white/10" />
        </div>
      </div>

      {/* ── Activity Audit Log Skeleton ── */}
      <TableSkeleton rows={8} />
    </div>
  );
}
