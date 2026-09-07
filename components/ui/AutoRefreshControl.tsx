"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Checks if the user is currently typing in an input/textarea or has a modal open
 */
function isUserInteracting(): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;
  if (
    active &&
    (active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      (active as HTMLElement).isContentEditable)
  ) {
    return true;
  }
  // Check if any modal or dialog is open
  if (
    document.querySelector('[role="dialog"]') ||
    document.querySelector(".modal-open")
  ) {
    return true;
  }
  return false;
}

/**
 * useAutoRefresh — Intelligent background auto-refresh hook.
 * - Collects and refreshes data in the background silently.
 * - Pauses automatically when user is typing in inputs or interacting with modals.
 * - Flushes updates smoothly without disrupting active user work or resetting views.
 */
export function useAutoRefresh(
  callback: (silent?: boolean) => Promise<any> | void,
  intervalSeconds: number = 20,
  defaultEnabled: boolean = true
) {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(intervalSeconds);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const triggerManual = useCallback(async (silent = false) => {
    setIsRefreshing(true);
    try {
      await Promise.resolve(callbackRef.current(silent));
    } catch {
      // Non-blocking
    } finally {
      setIsRefreshing(false);
      setSecondsRemaining(intervalSeconds);
    }
  }, [intervalSeconds]);

  // Background auto-refresh timer loop
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      // 1. Skip if document/tab is hidden
      if (typeof document !== "undefined" && document.hidden) return;

      // 2. Pause and postpone if user is currently typing or has modal open
      if (isUserInteracting()) {
        // Postpone by resetting timer to give user peace while working
        setSecondsRemaining(10);
        return;
      }

      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Trigger SILENT background refresh so UI doesn't flicker or interrupt
          triggerManual(true);
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isEnabled, intervalSeconds, triggerManual]);

  const toggle = () => setIsEnabled((prev) => !prev);

  return {
    isEnabled,
    toggle,
    setIsEnabled,
    secondsRemaining,
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
 * AutoRefreshBadge — Displays non-disruptive background sync status with manual refresh trigger.
 */
export function AutoRefreshBadge({
  isEnabled = true,
  isRefreshing,
  triggerManual,
  className = "",
}: AutoRefreshBadgeProps) {
  if (!triggerManual) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Background Sync Indicator */}
      <span
        className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400"
        title="Background auto-sync is active (pauses while you type)"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <span>Auto-Sync Active</span>
      </span>

      {/* Manual Refresh Trigger */}
      <button
        type="button"
        onClick={triggerManual}
        title="Sync & Refresh Now"
        disabled={isRefreshing}
        className="shadow-xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${
            isRefreshing ? "animate-spin text-primary" : "text-slate-400"
          }`}
        />
        <span>{isRefreshing ? "Syncing…" : "Refresh"}</span>
      </button>
    </div>
  );
}
