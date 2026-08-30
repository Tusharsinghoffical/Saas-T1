import posthog from "posthog-js";

export interface AnalyticsEventRecord {
  id: string;
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
}

const OPT_OUT_KEY = "tasq_analytics_opt_out";
const RECENT_EVENTS_KEY = "tasq_recent_analytics_events";
const MAX_DEBUG_EVENTS = 50;

let isInitialized = false;

/**
 * Initializes PostHog on client side with opt-out check
 */
export function initPostHog(): void {
  if (typeof window === "undefined" || isInitialized) return;

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  const isOptedOut = isAnalyticsOptedOut();

  if (posthogKey && posthogKey !== "placeholder") {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: "identified_only",
      capture_pageview: false, // Managed manually
      capture_pageleave: true,
      autocapture: false,
      opt_out_capturing_by_default: isOptedOut,
      loaded: (ph) => {
        if (isOptedOut) {
          ph.opt_out_capturing();
        }
      },
    });
  }

  isInitialized = true;
}

/**
 * Checks if user has opted out of analytics tracking
 */
export function isAnalyticsOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(OPT_OUT_KEY) === "true";
}

/**
 * Sets user analytics consent preference
 */
export function setAnalyticsOptOut(optOut: boolean): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(OPT_OUT_KEY, optOut ? "true" : "false");

  if (isInitialized && typeof posthog.opt_out_capturing === "function") {
    if (optOut) {
      posthog.opt_out_capturing();
    } else {
      posthog.opt_in_capturing();
    }
  }
}

/**
 * Captures custom analytics event and saves to QA debug ring buffer
 */
export function captureEvent(
  eventName:
    | "org_signup_completed"
    | "task_created"
    | "task_status_changed"
    | "task_completed"
    | "ai_enhance_used"
    | "notification_clicked"
    | string,
  properties: Record<string, any> = {}
): void {
  if (typeof window === "undefined") return;

  const eventRecord: AnalyticsEventRecord = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: eventName,
    properties: {
      ...properties,
      url: window.location.pathname,
    },
    timestamp: new Date().toISOString(),
  };

  // 1. Send to PostHog if not opted out
  if (!isAnalyticsOptedOut()) {
    try {
      if (isInitialized && typeof posthog.capture === "function") {
        posthog.capture(eventName, eventRecord.properties);
      }
    } catch (err) {
      console.warn("[PostHog] Event dispatch warning:", err);
    }
  }

  // 2. Persist in local QA ring buffer for the /admin/analytics-debug dashboard
  try {
    const existingRaw = localStorage.getItem(RECENT_EVENTS_KEY);
    const existing: AnalyticsEventRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [eventRecord, ...existing].slice(0, MAX_DEBUG_EVENTS);
    localStorage.setItem(RECENT_EVENTS_KEY, JSON.stringify(updated));

    // Dispatch custom DOM event so live QA page updates dynamically
    window.dispatchEvent(
      new CustomEvent("tasq:analytics_event", { detail: eventRecord })
    );
  } catch (_) {}
}

/**
 * Fetches recent events stored in QA buffer
 */
export function getRecentEvents(): AnalyticsEventRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const existingRaw = localStorage.getItem(RECENT_EVENTS_KEY);
    return existingRaw ? JSON.parse(existingRaw) : [];
  } catch {
    return [];
  }
}

/**
 * Clears the QA debug buffer
 */
export function clearRecentEvents(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENT_EVENTS_KEY);
  window.dispatchEvent(new CustomEvent("tasq:analytics_cleared"));
}
