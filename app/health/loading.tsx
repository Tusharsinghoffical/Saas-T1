import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function HealthPageLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      <MarketingNav />

      {/* Hero Banner Skeleton */}
      <div className="border-b border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900/60 sm:py-16">
        <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-6 w-48 rounded-full" />
          </div>
          <Skeleton className="h-10 w-80 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded" />

          <div className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-4 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
