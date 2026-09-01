"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { RefreshCw, Play, Pause } from "lucide-react";

export function useAutoRefresh(
  callback: () => Promise<any> | void,
  intervalSeconds: number = 10,
  defaultEnabled: boolean = true
) {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);
  const [secondsRemaining, setSecondsRemaining] = useState(intervalSeconds);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!isEnabled) {
      setSecondsRemaining(intervalSeconds);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsRefreshing(true);
          Promise.resolve(callbackRef.current())
            .catch(() => {})
            .finally(() => {
              setTimeout(() => setIsRefreshing(false), 500);
            });
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isEnabled, intervalSeconds]);

  const triggerManual = useCallback(async () => {
    setIsRefreshing(true);
    setSecondsRemaining(intervalSeconds);
    try {
      await Promise.resolve(callbackRef.current());
    } catch {
      // Non-blocking
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [intervalSeconds]);

  const toggle = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

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
  isEnabled: boolean;
  toggle: () => void;
  secondsRemaining: number;
  isRefreshing: boolean;
  triggerManual?: () => void;
  className?: string;
}

export function AutoRefreshBadge({
  isEnabled,
  toggle,
  secondsRemaining,
  isRefreshing,
  triggerManual,
  className = "",
}: AutoRefreshBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs ${className}`}
    >
      <button
        type="button"
        onClick={toggle}
        title={isEnabled ? "Click to disable 10s auto-refresh" : "Click to enable 10s auto-refresh"}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all select-none ${
          isEnabled
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/15"
            : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-200/60"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
            isEnabled ? "bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50" : "bg-slate-400"
          }`}
        />
        <span>Auto-Sync: {isEnabled ? `${secondsRemaining}s` : "OFF"}</span>
      </button>

      {triggerManual && (
        <button
          type="button"
          onClick={triggerManual}
          title="Refresh Now"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary transition"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
