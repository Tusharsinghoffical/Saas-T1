"use client";

import React, { useState, useEffect } from "react";
import {
  getRecentEvents,
  clearRecentEvents,
  captureEvent,
  isAnalyticsOptedOut,
  setAnalyticsOptOut,
  type AnalyticsEventRecord,
} from "@/lib/analytics/posthog";
import {
  Activity,
  Trash2,
  Play,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Clock,
  Code2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsDebugPage() {
  const [events, setEvents] = useState<AnalyticsEventRecord[]>([]);
  const [isOptedOut, setIsOptedOut] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<AnalyticsEventRecord | null>(null);

  const refreshEvents = () => {
    setEvents(getRecentEvents());
    setIsOptedOut(isAnalyticsOptedOut());
  };

  useEffect(() => {
    refreshEvents();

    const handleNewEvent = () => refreshEvents();
    const handleCleared = () => setEvents([]);

    window.addEventListener("tasq:analytics_event", handleNewEvent);
    window.addEventListener("tasq:analytics_cleared", handleCleared);
    window.addEventListener("storage", handleNewEvent);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel("tasq-analytics-channel");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "CLEARED") {
          setEvents([]);
        } else {
          refreshEvents();
        }
      };
    }

    return () => {
      window.removeEventListener("tasq:analytics_event", handleNewEvent);
      window.removeEventListener("tasq:analytics_cleared", handleCleared);
      window.removeEventListener("storage", handleNewEvent);
      if (bc) bc.close();
    };
  }, []);

  const handleToggleOptOut = () => {
    const next = !isOptedOut;
    setAnalyticsOptOut(next);
    setIsOptedOut(next);
  };

  const handleFireSampleEvent = (
    eventName: string,
    props: Record<string, any>
  ) => {
    captureEvent(eventName, props);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Dev-Only Banner */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <span>PostHog Analytics Debugger</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                QA / Internal Only
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Live inspection stream of PostHog events dispatched by client
              actions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleOptOut}
            className={`flex min-h-[36px] items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              isOptedOut
                ? "border border-urgent/20 bg-urgent/10 text-urgent"
                : "border border-success/20 bg-success/10 text-success"
            }`}
          >
            {isOptedOut ? (
              <>
                <ShieldAlert className="h-4 w-4" />
                <span>Opted Out</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Tracking Active</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => clearRecentEvents()}
            className="flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-urgent dark:hover:bg-slate-800"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Trigger Sample Events Bar */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <Play className="h-3.5 w-3.5 text-primary" />
          <span>Trigger Sample Test Events</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              handleFireSampleEvent("org_signup_completed", {
                orgName: "Test SMB Corp",
                plan: "starter",
                invitesCount: 4,
              })
            }
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold transition hover:bg-primary/10 hover:text-primary dark:bg-slate-800"
          >
            + org_signup_completed
          </button>
          <button
            type="button"
            onClick={() =>
              handleFireSampleEvent("task_created", {
                taskId: "task-demo-123",
                priority: "high",
                hasDueDate: true,
              })
            }
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold transition hover:bg-primary/10 hover:text-primary dark:bg-slate-800"
          >
            + task_created
          </button>
          <button
            type="button"
            onClick={() =>
              handleFireSampleEvent("task_status_changed", {
                taskId: "task-demo-123",
                oldStatus: "in_progress",
                newStatus: "in_review",
              })
            }
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold transition hover:bg-primary/10 hover:text-primary dark:bg-slate-800"
          >
            + task_status_changed
          </button>
          <button
            type="button"
            onClick={() =>
              handleFireSampleEvent("task_completed", {
                taskId: "task-demo-123",
                durationDays: 2,
              })
            }
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold transition hover:bg-primary/10 hover:text-primary dark:bg-slate-800"
          >
            + task_completed
          </button>
          <button
            type="button"
            onClick={() =>
              handleFireSampleEvent("ai_enhance_used", {
                originalLength: 32,
                enhancedLength: 210,
              })
            }
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold transition hover:bg-primary/10 hover:text-primary dark:bg-slate-800"
          >
            + ai_enhance_used
          </button>
          <button
            type="button"
            onClick={() =>
              handleFireSampleEvent("notification_clicked", {
                notificationId: "notif-999",
                type: "task.assigned",
              })
            }
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold transition hover:bg-primary/10 hover:text-primary dark:bg-slate-800"
          >
            + notification_clicked
          </button>
        </div>
      </div>

      {/* Events Stream Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Captured Events Stream ({events.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={refreshEvents}
            className="rounded-lg p-1.5 text-slate-400 transition hover:text-primary"
            title="Refresh stream"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {events.length === 0 ? (
          <div className="space-y-2 p-12 text-center text-slate-400">
            <Activity className="mx-auto h-8 w-8 animate-pulse opacity-40" />
            <p className="text-xs">
              No analytics events captured yet in this session.
            </p>
            <p className="text-[11px] text-slate-500">
              Click any of the trigger buttons above or perform actions in the
              app.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="dark:hover:bg-slate-850 flex cursor-pointer items-center justify-between gap-4 p-4 text-xs transition hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex-shrink-0 rounded-xl bg-primary/10 p-2 font-mono text-[11px] font-bold text-primary">
                    EVENT
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {evt.name}
                    </span>
                    <div className="mt-0.5 truncate text-[10px] text-slate-400">
                      {JSON.stringify(evt.properties)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2 text-[11px] text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspect Event Modal */}
      {selectedEvent && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {selectedEvent.name}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold text-slate-500">
                Timestamp:
              </div>
              <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                {selectedEvent.timestamp}
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold text-slate-500">
                Payload Properties:
              </div>
              <pre className="max-h-60 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-slate-100">
                {JSON.stringify(selectedEvent.properties, null, 2)}
              </pre>
            </div>

            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="w-full rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
