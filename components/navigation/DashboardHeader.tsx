"use client";

import React from "react";
import { Menu, Radio, Sparkles, ChevronRight } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface DashboardHeaderProps {
  onOpenMobileMenu?: () => void;
  breadcrumbs?: { label: string; href?: string }[];
  statusLabel?: string;
  isRealtimeConnected?: boolean;
  userInitials?: string;
}

export function DashboardHeader({
  onOpenMobileMenu,
  breadcrumbs = [{ label: "Workspace" }, { label: "Dashboard" }],
  statusLabel = "Active",
  isRealtimeConnected = true,
  userInitials,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-900/80 sm:px-6">
      {/* Left side: Hamburger (mobile) + Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {idx > 0 && (
                  <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
                )}
                {isLast ? (
                  <span className="font-bold text-slate-900 dark:text-white">
                    {crumb.label}
                  </span>
                ) : (
                  <span className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Realtime Status Badge (hidden on smallest screens) */}
        <span
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-all ${
            isRealtimeConnected
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          }`}
        >
          <span className="relative flex h-1.5 w-1.5">
            {isRealtimeConnected && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                isRealtimeConnected ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </span>
          <span>{isRealtimeConnected ? "Live Sync" : "Connecting…"}</span>
        </span>
      </div>

      {/* Right side: Actions & Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Notification Bell */}
        <NotificationBell />

        {/* Mobile User Avatar Pill */}
        {userInitials && (
          <div className="flex md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-xs font-bold text-white shadow-xs">
              {userInitials}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
