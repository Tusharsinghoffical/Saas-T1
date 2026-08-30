"use client";

import React, { useEffect, useState } from "react";
import { initPostHog, setAnalyticsOptOut, isAnalyticsOptedOut } from "@/lib/analytics/posthog";
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
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            Privacy & Analytics Preferences
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            We use privacy-friendly analytics via PostHog to improve app performance and user workflows. You can change your choice anytime.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleOptOut}
          className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          Opt Out
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="min-h-[36px] px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-700 text-white font-semibold text-xs shadow-sm shadow-primary/25 transition"
        >
          Accept Analytics
        </button>
      </div>
    </aside>
  );
}
