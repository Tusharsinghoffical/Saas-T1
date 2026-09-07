"use client";

import React, { useState, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";

/**
 * useAutoRefresh — Purely manual refresh hook.
 * Background auto-polling has been removed to prevent form disruptions,
 * state loss, and premature submissions during task editing.
 * Re-fetching happens strictly on user demand via triggerManual.
 */
export function useAutoRefresh(
  callback: (silent?: boolean) => Promise<any> | void,
  _intervalSeconds?: number,
  _defaultEnabled?: boolean
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const triggerManual = useCallback(async (silent = false) => {
    setIsRefreshing(true);
    try {
      await Promise.resolve(callbackRef.current(silent));
    } catch {
      // Non-blocking fallback
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return {
    isEnabled: false,
    toggle: () => {},
    setIsEnabled: () => {},
    secondsRemaining: 0,
    isRefreshing,
    triggerManual: () => triggerManual(false),
  };
}

interface AutoRefreshBadgeProps {
  isEnabled?: boolean;
  toggle?: () => void;
  secondsRemaining?: number;
  isRefreshing: boolean;
  triggerManual?: () => void;
  className?: string;
}

/**
 * AutoRefreshBadge / ManualRefreshButton — Manual refresh button.
 * Replaces the old auto-sync countdown pill with an on-demand sync button.
 */
export function AutoRefreshBadge({
  isRefreshing,
  triggerManual,
  className = "",
}: AutoRefreshBadgeProps) {
  if (!triggerManual) return null;

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={triggerManual}
        title="Click to refresh data manually"
        aria-label="Refresh data"
        disabled={isRefreshing}
        className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-indigo-200 dark:hover:bg-white/15 dark:hover:text-white"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isRefreshing
              ? "animate-spin text-primary dark:text-indigo-400"
              : "text-slate-400 group-hover:rotate-45 dark:text-indigo-300"
          }`}
        />
        <span>{isRefreshing ? "Refreshing…" : "Refresh"}</span>
      </button>
    </div>
  );
}

export const ManualRefreshButton = AutoRefreshBadge;
