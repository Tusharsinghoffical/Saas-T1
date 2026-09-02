"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";

/**
 * useManualRefresh — Simple manual-only refresh hook.
 * Auto-refresh timer has been removed; only manual triggering is supported.
 */
export function useAutoRefresh(
  callback: () => Promise<any> | void,
  _intervalSeconds?: number,
  _defaultEnabled?: boolean
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Initial data load on mount
  useEffect(() => {
    let cancelled = false;
    setIsRefreshing(true);
    Promise.resolve(callbackRef.current())
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTimeout(() => setIsRefreshing(false), 500);
      });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerManual = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.resolve(callbackRef.current());
    } catch {
      // Non-blocking
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  return {
    isEnabled: false,
    toggle: () => {},
    setIsEnabled: () => {},
    secondsRemaining: 0,
    isRefreshing,
    triggerManual,
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
 * AutoRefreshBadge — Displays only a manual refresh button.
 * The auto-refresh toggle has been removed.
 */
export function AutoRefreshBadge({
  isRefreshing,
  triggerManual,
  className = "",
}: AutoRefreshBadgeProps) {
  if (!triggerManual) return null;

  return (
    <button
      type="button"
      onClick={triggerManual}
      title="Refresh Now"
      disabled={isRefreshing}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xs ${className}`}
    >
      <RefreshCw
        className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
      />
      <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
    </button>
  );
}
