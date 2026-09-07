"use client";

import React, { useEffect, useState } from "react";
import {
  initPostHog,
  setAnalyticsOptOut,
  isAnalyticsOptedOut,
} from "@/lib/analytics/posthog";
import { ShieldCheck, X } from "lucide-react";

export function AnalyticsProvider() {
  const [showConsentBanner, setShowConsentBanner] = useState(false);

  useEffect(() => {
    initPostHog();

    const decision = localStorage.getItem("tasq_cookie_decision");
    if (!decision) {
      setShowConsentBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("tasq_cookie_decision", "accepted");
    setAnalyticsOptOut(false);
    setShowConsentBanner(false);
  };

  const handleOptOut = () => {
    localStorage.setItem("tasq_cookie_decision", "opted_out");
    setAnalyticsOptOut(true);
    setShowConsentBanner(false);
  };

  if (!showConsentBanner) return null;

  return (
    <aside
      aria-label="Cookie consent banner"
      className="animate-fade-in fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:left-6 sm:right-auto sm:max-w-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 rounded-xl bg-primary/10 p-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            Privacy & Analytics Preferences
          </div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            We use privacy-friendly analytics via PostHog to improve app
            performance and user workflows. You can change your choice anytime.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-1 dark:border-slate-800">
        <button
          type="button"
          onClick={handleOptOut}
          className="min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Opt Out
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="min-h-[36px] rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-700"
        >
          Accept Analytics
        </button>
      </div>
    </aside>
  );
}
