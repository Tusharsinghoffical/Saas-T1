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
  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEventRecord | null>(null);

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

    return () => {
      window.removeEventListener("tasq:analytics_event", handleNewEvent);
      window.removeEventListener("tasq:analytics_cleared", handleCleared);
    };
  }, []);

  const handleToggleOptOut = () => {
    const next = !isOptedOut;
    setAnalyticsOptOut(next);
    setIsOptedOut(next);
  };

  const handleFireSampleEvent = (eventName: string, props: Record<string, any>) => {
    captureEvent(eventName, props);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Dev-Only Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>PostHog Analytics Debugger</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">
                QA / Internal Only
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Live inspection stream of PostHog events dispatched by client actions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleOptOut}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              isOptedOut
                ? "bg-urgent/10 text-urgent border border-urgent/20"
                : "bg-success/10 text-success border border-success/20"
            }`}
          >
            {isOptedOut ? (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Opted Out</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Tracking Active</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => clearRecentEvents()}
            className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-urgent hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Trigger Sample Events Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-primary" />
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition"
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition"
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition"
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition"
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition"
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition"
          >
            + notification_clicked
          </button>
        </div>
      </div>

      {/* Events Stream Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Captured Events Stream ({events.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={refreshEvents}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary transition"
            title="Refresh stream"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Activity className="w-8 h-8 mx-auto opacity-40 animate-pulse" />
            <p className="text-xs">No analytics events captured yet in this session.</p>
            <p className="text-[11px] text-slate-500">
              Click any of the trigger buttons above or perform actions in the app.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-850 transition cursor-pointer text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary font-mono text-[11px] font-bold flex-shrink-0">
                    EVENT
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {evt.name}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {JSON.stringify(evt.properties)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspect Event Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
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
              <div className="text-xs font-semibold text-slate-500 mb-1">Timestamp:</div>
              <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                {selectedEvent.timestamp}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1">Payload Properties:</div>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto max-h-60 border border-slate-800">
                {JSON.stringify(selectedEvent.properties, null, 2)}
              </pre>
            </div>

            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
