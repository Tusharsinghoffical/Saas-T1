"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Copy,
  Check,
  Search,
  Filter,
  X,
  ExternalLink,
  Layers,
  Terminal,
  Send,
  CheckCircle2,
  Zap,
  Radio,
  ArrowRight,
  UserCheck,
  Bell,
  Sliders,
} from "lucide-react";

// Event color & icon theme map
const EVENT_THEMES: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  task_completed: {
    label: "Task Completed",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  task_status_changed: {
    label: "Status Changed",
    bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/30",
    icon: RefreshCw,
  },
  task_created: {
    label: "Task Created",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    icon: Layers,
  },
  ai_enhance_used: {
    label: "AI Enhanced",
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/30",
    icon: Sparkles,
  },
  notification_clicked: {
    label: "Notification Clicked",
    bg: "bg-cyan-500/10 dark:bg-cyan-500/15",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/30",
    icon: Bell,
  },
  org_signup_completed: {
    label: "Org Signup",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    icon: ShieldCheck,
  },
  task_attachment_added: {
    label: "Link / Attachment Added",
    bg: "bg-teal-500/10 dark:bg-teal-500/15",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/30",
    icon: ExternalLink,
  },
  task_comment_added: {
    label: "Comment Added",
    bg: "bg-sky-500/10 dark:bg-sky-500/15",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/30",
    icon: Send,
  },
};

export default function AnalyticsDebugPage() {
  const [events, setEvents] = useState<AnalyticsEventRecord[]>([]);
  const [isOptedOut, setIsOptedOut] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<AnalyticsEventRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [copiedPayload, setCopiedPayload] = useState(false);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Distinct Event Types
  const uniqueEventTypes = useMemo(() => {
    const types = new Set<string>();
    events.forEach((e) => types.add(e.name));
    return Array.from(types);
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (filterType !== "all" && evt.name !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = evt.name.toLowerCase().includes(q);
        const matchProps = JSON.stringify(evt.properties || {})
          .toLowerCase()
          .includes(q);
        if (!matchName && !matchProps) return false;
      }
      return true;
    });
  }, [events, filterType, searchQuery]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* ── 🚀 Executive Telemetry Command Header ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-7">
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          {/* Left Title & Status */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/25">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950 text-indigo-300">
                <Terminal className="h-6 w-6" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  PostHog Analytics Debugger
                </h1>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  QA / Internal Only
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
                  Live Event Stream
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 sm:text-sm">
                Real-time telemetry and inspection stream of client-side PostHog
                events with payload validation.
              </p>
            </div>
          </div>

          {/* Right Controls: Opt-out Toggle & Clear Log */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleOptOut}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                isOptedOut
                  ? "border-rose-500/30 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                  : "border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              }`}
            >
              {isOptedOut ? (
                <>
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <span>Tracking: Opted Out</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Tracking: Active</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => clearRecentEvents()}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-300"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Log</span>
            </button>

            <button
              type="button"
              onClick={refreshEvents}
              className="rounded-xl border border-white/10 bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"
              title="Refresh Stream"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Telemetry Metric Highlights */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-indigo-200/70">
              Captured Events
            </div>
            <div className="text-2xl font-black text-white">{events.length}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-indigo-200/70">
              Distinct Types
            </div>
            <div className="text-2xl font-black text-white">
              {uniqueEventTypes.length}
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-indigo-200/70">
              Latest Event
            </div>
            <div className="truncate text-sm font-bold text-emerald-400">
              {events[0]?.name || "None yet"}
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-indigo-200/70">
              Capture Mode
            </div>
            <div className="text-sm font-bold text-white">
              {isOptedOut ? "Disabled (Opted Out)" : "Live PostHog Dispatch"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive Test Dispatcher Console ── */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Play className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Interactive Sample Event Dispatcher</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any button to emit test telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Trigger 1: org_signup_completed */}
          <button
            type="button"
            onClick={() =>
              handleFireSampleEvent("org_signup_completed", {
                orgName: "Acme SMB Corp",
                plan: "starter",
                invitesCount: 4,
              })
            }
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left transition hover:border-amber-500/50 hover:bg-amber-500/5 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-amber-500/40"
          >
            <div>
              <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                org_signup_completed
              </div>
              <div className="text-[11px] text-slate-500">
                New workspace registration
              </div>
            </div>
            <span className="rounded-lg bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              + Emit
            </span>
          </button>

          {/* Trigger 2: task_created */}
          <button
            type="button"
            onClick={() =>
              handleFireSampleEvent("task_created", {
                taskId: `task-${Date.now().toString(36)}`,
                priority: "high",
                hasDueDate: true,
              })
            }
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left transition hover:border-blue-500/50 hover:bg-blue-500/5 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-blue-500/40"
          >
            <div>
              <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                task_created
              </div>
              <div className="text-[11px] text-slate-500">
                Task record creation
              </div>
            </div>
            <span className="rounded-lg bg-blue-500/15 px-2 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              + Emit
            </span>
          </button>

          {/* Trigger 3: task_status_changed */}
          <button
            type="button"
            onClick={() =>
              handleFireSampleEvent("task_status_changed", {
                taskId: "task-live-demo",
                oldStatus: "in_progress",
                newStatus: "in_review",
              })
            }
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left transition hover:border-indigo-500/50 hover:bg-indigo-500/5 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-indigo-500/40"
          >
            <div>
              <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                task_status_changed
              </div>
              <div className="text-[11px] text-slate-500">
                Lifecycle status transition
              </div>
            </div>
            <span className="rounded-lg bg-indigo-500/15 px-2 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              + Emit
            </span>
          </button>

          {/* Trigger 4: task_completed */}
          <button
            type="button"
            onClick={() =>
              handleFireSampleEvent("task_completed", {
                taskId: "task-live-demo",
                priority: "high",
                durationDays: 2,
              })
            }
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left transition hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-emerald-500/40"
          >
            <div>
              <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                task_completed
              </div>
              <div className="text-[11px] text-slate-500">
                Sprint completion event
              </div>
            </div>
            <span className="rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              + Emit
            </span>
          </button>

          {/* Trigger 5: ai_enhance_used */}
          <button
            type="button"
            onClick={() =>
              handleFireSampleEvent("ai_enhance_used", {
                originalLength: 42,
                enhancedLength: 260,
                model: "llama-3.3-70b-versatile",
              })
            }
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left transition hover:border-purple-500/50 hover:bg-purple-500/5 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-purple-500/40"
          >
            <div>
              <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                ai_enhance_used
              </div>
              <div className="text-[11px] text-slate-500">
                AI Task Prompts structuring
              </div>
            </div>
            <span className="rounded-lg bg-purple-500/15 px-2 py-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">
              + Emit
            </span>
          </button>

          {/* Trigger 6: notification_clicked */}
          <button
            type="button"
            onClick={() =>
              handleFireSampleEvent("notification_clicked", {
                notificationId: `notif-${Date.now().toString(36)}`,
                type: "task.assigned",
              })
            }
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left transition hover:border-cyan-500/50 hover:bg-cyan-500/5 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-cyan-500/40"
          >
            <div>
              <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                notification_clicked
              </div>
              <div className="text-[11px] text-slate-500">
                User engagement alert tap
              </div>
            </div>
            <span className="rounded-lg bg-cyan-500/15 px-2 py-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
              + Emit
            </span>
          </button>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter captured events by name or properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-900 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Events ({events.length})</option>
            {uniqueEventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Captured Events Stream Feed ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Captured Events Stream
            </h3>
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              {filteredEvents.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any row to inspect complete JSON payload
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="space-y-3 p-16 text-center text-slate-400">
            <Activity className="mx-auto h-10 w-10 animate-pulse opacity-40 text-indigo-500" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No analytics events captured yet
            </h4>
            <p className="mx-auto max-w-sm text-xs text-slate-500">
              Perform actions across the workspace or click the sample event
              buttons above to trigger live telemetry.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEvents.map((evt) => {
              const theme =
                EVENT_THEMES[evt.name] || {
                  label: evt.name,
                  bg: "bg-slate-100 dark:bg-slate-800",
                  text: "text-slate-700 dark:text-slate-300",
                  border: "border-slate-200 dark:border-slate-700",
                  icon: Activity,
                };
              const Icon = theme.icon;

              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="group flex cursor-pointer flex-col justify-between gap-3 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:flex-row sm:items-center"
                >
                  {/* Left: Event Icon + Name + Key Properties */}
                  <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${theme.bg} ${theme.text} ${theme.border}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                          {evt.name}
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${theme.bg} ${theme.text} ${theme.border}`}
                        >
                          {theme.label}
                        </span>
                      </div>

                      {/* Property highlights */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        {evt.properties?.taskId && (
                          <span className="font-mono text-[10px] text-slate-400">
                            id: {evt.properties.taskId.slice(0, 8)}...
                          </span>
                        )}
                        {evt.properties?.oldStatus && evt.properties?.newStatus && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {evt.properties.oldStatus} → {evt.properties.newStatus}
                          </span>
                        )}
                        {evt.properties?.priority && (
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            priority: {evt.properties.priority}
                          </span>
                        )}
                        {evt.properties?.url && (
                          <span className="text-slate-400">
                            {evt.properties.url}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Timestamp & Inspect action */}
                  <div className="flex flex-shrink-0 items-center justify-between gap-3 sm:justify-end">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(evt);
                      }}
                      className="rounded-lg border border-slate-200/80 px-2.5 py-1 text-[11px] font-bold text-slate-600 opacity-80 transition hover:bg-slate-100 group-hover:opacity-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Inspect →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── High-Contrast Event Payload Inspector Modal ── */}
      {selectedEvent && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-xl space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-indigo-500/20 p-2 text-indigo-400">
                  <Terminal className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-mono text-sm font-bold text-white">
                    {selectedEvent.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Event ID: {selectedEvent.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Timestamp Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Timestamp
                </div>
                <div className="mt-0.5 font-mono font-bold text-indigo-300">
                  {selectedEvent.timestamp}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Source Route
                </div>
                <div className="mt-0.5 font-mono font-bold text-white">
                  {selectedEvent.properties?.url || "/admin"}
                </div>
              </div>
            </div>

            {/* Code Payload Viewer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Payload Properties
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(selectedEvent.properties, null, 2)
                    )
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="max-h-72 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-indigo-200">
                {JSON.stringify(selectedEvent.properties, null, 2)}
              </pre>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
