import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Base polymorphic Skeleton component
 * Supports GPU-accelerated shimmer wave or standard pulse
 */
export function Skeleton({
  className,
  shimmer = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { shimmer?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg",
        shimmer
          ? "animate-shimmer"
          : "animate-pulse bg-slate-200 dark:bg-slate-800",
        className
      )}
      {...props}
    />
  );
}

/**
 * Task Card Skeleton mimicking TASQ-ONE TaskCard aesthetic
 */
export function TaskCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90",
        className
      )}
    >
      {/* Badges & Priority Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>

      {/* Task Title (2 lines) */}
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-11/12 rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
      </div>

      {/* Subtext description snippet */}
      <Skeleton className="h-3 w-1/2 rounded" />

      {/* Footer: Assignees & Due Date */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/70">
        <div className="flex items-center -space-x-1.5">
          <Skeleton className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-900" />
          <Skeleton className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-900" />
        </div>
        <Skeleton className="h-4 w-20 rounded" />
      </div>
    </div>
  );
}

/**
 * Single Kanban Column with Header and Cards
 */
export function KanbanColumnSkeleton({
  titleWidth = "w-24",
  count = 3,
}: {
  titleWidth?: string;
  count?: number;
}) {
  return (
    <div className="flex min-w-[280px] flex-1 flex-col gap-3 rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/40">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className={`h-4 ${titleWidth} rounded`} />
        </div>
        <Skeleton className="h-5 w-6 rounded-full" />
      </div>

      {/* Task Cards Stack */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Full 4-Column Kanban Board Skeleton
 */
export function KanbanBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KanbanColumnSkeleton titleWidth="w-20" count={3} />
      <KanbanColumnSkeleton titleWidth="w-24" count={2} />
      <KanbanColumnSkeleton titleWidth="w-20" count={2} />
      <KanbanColumnSkeleton titleWidth="w-24" count={1} />
    </div>
  );
}

/**
 * KPI Metric Grid Skeleton (4 cards)
 */
export function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Chart Skeleton for Productivity / Analytics views
 */
export function ChartSkeleton({ title = "Trend Analytics" }: { title?: string }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="space-y-1">
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-3 w-64 rounded" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Chart Visual Skeleton */}
      <div className="relative flex h-56 w-full items-end gap-2 pt-8">
        {Array.from({ length: 14 }).map((_, idx) => {
          const heights = [
            "h-16",
            "h-28",
            "h-20",
            "h-36",
            "h-44",
            "h-32",
            "h-48",
            "h-24",
            "h-40",
            "h-52",
            "h-36",
            "h-28",
            "h-44",
            "h-38",
          ];
          return (
            <div key={idx} className="flex flex-1 flex-col items-center gap-2">
              <Skeleton
                className={cn("w-full rounded-t-md opacity-70", heights[idx % heights.length])}
              />
              <Skeleton className="h-2 w-4 rounded" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton for list & member views
 */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800/80">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-48 rounded" />
        </div>
      </div>
      <div className="hidden sm:flex sm:items-center sm:gap-4">
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  );
}

/**
 * Full Table Skeleton for rosters & linear lists
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-36 rounded" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Notification Item Skeleton
 */
export function NotificationSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <Skeleton className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-4/5 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
            <Skeleton className="h-2.5 w-16 rounded" />
          </div>
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      ))}
    </div>
  );
}
