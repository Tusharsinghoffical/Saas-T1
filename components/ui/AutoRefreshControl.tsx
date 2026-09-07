"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { RefreshCw, Radio } from "lucide-react";

/**
 * useAutoRefresh — Realtime background auto-refresh hook.
 * Automatically polls in the background every `intervalSeconds` (default 4s)
 * when document is visible, guaranteeing live state across all components.
 */
export function useAutoRefresh(
  callback: () => Promise<any> | void,
  intervalSeconds: number = 4,
  defaultEnabled: boolean = true
) {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(intervalSeconds);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const triggerManual = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.resolve(callbackRef.current());
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
      // Only execute when document/tab is active to save resources
      if (typeof document !== "undefined" && document.hidden) return;

      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          triggerManual();
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
 * AutoRefreshBadge — Displays live real-time sync pulse with manual refresh trigger.
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
      {/* Live Sync Status Indicator */}
      <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <span>Live</span>
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
