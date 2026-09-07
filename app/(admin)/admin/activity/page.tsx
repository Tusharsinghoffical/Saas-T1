"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity,
  Download,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  FileText,
  MessageSquare,
  Paperclip,
  User,
  Users,
  Shield,
  Radio,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Building2,
  Lock,
  LogIn,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/infrastructure/supabase/supabaseClient";
import {
  useAutoRefresh,
  AutoRefreshBadge,
} from "@/components/ui/AutoRefreshControl";

interface ActivityLogRecord {
  id: string;
  orgId?: string;
  org_id?: string;
  action: string;
  entity: string;
  entityId?: string | null;
  entity_id?: string | null;
  diff?: Record<string, any> | null;
  createdAt?: string;
  created_at?: string;
  actorId?: string | null;
  actor_id?: string | null;
  actor?: {
    id?: string;
    fullName?: string | null;
    full_name?: string | null;
    avatarUrl?: string | null;
    avatar_url?: string | null;
  } | null;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspect Diff Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLogRecord | null>(
    null
  );

  const fetchLogs = useCallback(
    async (targetPage = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: targetPage.toString(),
          limit: "20",
        });
        if (entityFilter) params.set("entity", entityFilter);
        if (actionFilter) params.set("action", actionFilter);

        const res = await fetch(`/api/v1/activity?${params.toString()}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLogs(json.data);
          if (json.pagination) {
            setPage(json.pagination.page);
            setTotalPages(json.pagination.totalPages);
            setTotalCount(json.pagination.total);
          }
        }
      } catch (err) {
        console.error("Failed to fetch activity logs:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [entityFilter, actionFilter]
  );

  // Initial data load on mount
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Real-time background auto-refresh every 3 seconds
  const { isRefreshing, triggerManual } = useAutoRefresh(fetchLogs, 3, true);

  // Live Realtime Channel for Activity Logs & Task Mutations
  useEffect(() => {
    // 1. Cross-tab BroadcastChannel listener
    let bcActivity: BroadcastChannel | null = null;
    let bcTasks: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bcActivity = new BroadcastChannel("tasq-activity-channel");
        bcActivity.onmessage = () => {
          fetchLogs(1);
        };

        bcTasks = new BroadcastChannel("tasq-one-sync");
        bcTasks.onmessage = () => {
          fetchLogs(1);
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel error:", e);
    }

    // 2. Custom DOM event listener
    const handleActivityEvent = () => fetchLogs(1);
    window.addEventListener("tasq:activity_updated", handleActivityEvent);
    window.addEventListener("tasq:analytics_event", handleActivityEvent);

    // 3. Supabase Realtime Channel
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const hasSupabase =
      Boolean(supabaseUrl) && !supabaseUrl.includes("your-project-ref");

    let channel: any = null;
    if (hasSupabase) {
      try {
        const supabase = createClient();
        const channelId = `realtime:activity_feed:${Math.random().toString(36).slice(2, 8)}`;
        channel = supabase
          .channel(channelId)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "activity_logs",
            },
            () => {
              fetchLogs(1);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "tasks",
            },
            () => {
              fetchLogs(1);
            }
          )
          .subscribe((status) => {
            setIsConnected(status === "SUBSCRIBED");
          });
      } catch (e) {
        console.warn("Realtime activity subscription error:", e);
      }
    } else {
      setIsConnected(true);
    }

    return () => {
      window.removeEventListener("tasq:activity_updated", handleActivityEvent);
      window.removeEventListener("tasq:analytics_event", handleActivityEvent);
      if (bcActivity) bcActivity.close();
      if (bcTasks) bcTasks.close();
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [fetchLogs]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ format: "csv" });
      if (entityFilter) params.set("entity", entityFilter);
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetch(`/api/v1/activity?${params.toString()}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasq_activity_log_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert("Failed to export CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const getActorName = (log: ActivityLogRecord) => {
    return (
      log.actor?.fullName ||
      log.actor?.full_name ||
      (log.actorId ? `User ${log.actorId.slice(0, 6)}` : "System")
    );
  };

  const getCreatedAt = (log: ActivityLogRecord) => {
    return log.createdAt || log.created_at || new Date().toISOString();
  };

  const getActionConfig = (action: string) => {
    switch (action) {
      case "task.created":
        return {
          label: "Task Created",
          color:
            "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
        };
      case "task.updated":
        return {
          label: "Task Updated",
          color:
            "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
        };
      case "task.status_changed":
        return {
          label: "Status Changed",
          color:
            "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
        };
      case "task.deleted":
        return {
          label: "Task Deleted",
          color:
            "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
        };
      case "comment.created":
        return {
          label: "Comment Added",
          color:
            "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
        };
      case "attachment.uploaded":
        return {
          label: "Attachment Uploaded",
          color:
            "text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800",
        };
      case "member.created":
        return {
          label: "Member Added",
          color:
            "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
        };
      case "member.invited":
        return {
          label: "Member Invited",
          color:
            "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800",
        };
      case "member.role_updated":
        return {
          label: "Role Updated",
          color:
            "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
        };
      case "member.team_updated":
        return {
          label: "Team Updated",
          color:
            "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800",
        };
      case "member.removed":
        return {
          label: "Member Removed",
          color:
            "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
        };
      case "org.updated":
        return {
          label: "Org Settings",
          color:
            "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        };
      case "auth.login_success":
        return {
          label: "Login Success",
          color:
            "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
        };
      case "auth.login_failed":
        return {
          label: "Login Failed",
          color:
            "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
        };
      default:
        return {
          label: action,
          color:
            "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        };
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case "tasks":
        return <FileText className="h-3.5 w-3.5 text-primary" />;
      case "task_comments":
        return <MessageSquare className="h-3.5 w-3.5 text-amber-500" />;
      case "task_attachments":
        return <Paperclip className="h-3.5 w-3.5 text-teal-500" />;
      case "profiles":
      case "team_members":
        return <Users className="h-3.5 w-3.5 text-purple-500" />;
      case "organizations":
        return <Building2 className="h-3.5 w-3.5 text-blue-500" />;
      case "auth":
        return <LogIn className="h-3.5 w-3.5 text-emerald-500" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const actorName = getActorName(log).toLowerCase();
      const action = (log.action || "").toLowerCase();
      const entity = (log.entity || "").toLowerCase();
      const diffStr = JSON.stringify(log.diff || {}).toLowerCase();
      return (
        actorName.includes(q) ||
        action.includes(q) ||
        entity.includes(q) ||
        diffStr.includes(q)
      );
    });
  }, [logs, searchQuery]);

  // Metric aggregates
  const todayCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return logs.filter((l) => getCreatedAt(l).slice(0, 10) === todayStr).length;
  }, [logs]);

  const taskActionCount = useMemo(() => {
    return logs.filter((l) => l.entity === "tasks").length;
  }, [logs]);

  const uniqueActorsCount = useMemo(() => {
    const actors = new Set(
      logs.map((l) => getActorName(l)).filter((n) => n !== "System")
    );
    return actors.size;
  }, [logs]);

  // Helper to render human-readable status badge
  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
            Completed
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            In Progress
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
            In Review
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Pending
          </span>
        );
    }
  };

  // Helper to render human-readable priority badge
  const renderPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    switch (priority) {
      case "urgent":
      case "high":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <Flame className="h-2.5 w-2.5 text-rose-500" />
            High
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Medium
          </span>
        );
      case "low":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Low
          </span>
        );
    }
  };

  // Human-friendly details formatter (No raw JSON/curly braces)
  const renderLogDetails = (log: ActivityLogRecord) => {
    const diff = log.diff || {};
    const keys = Object.keys(diff);

    if (keys.length === 0) {
      return (
        <span className="text-[11px] italic text-slate-400">
          — No extra details —
        </span>
      );
    }

    // 1. Comments
    if (log.action === "comment.created" || log.entity === "task_comments") {
      const commentText =
        diff.body || diff.content || diff.text || "Added a comment";
      return (
        <div className="flex max-w-md items-center gap-1.5">
          <MessageSquare className="h-3 w-3 flex-shrink-0 text-amber-500" />
          <span className="truncate rounded-lg border border-slate-200/60 bg-slate-50 px-2 py-1 text-[11px] font-medium italic text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
            &ldquo;{commentText}&rdquo;
          </span>
        </div>
      );
    }

    // 2. Tasks
    if (log.action.startsWith("task.") || log.entity === "tasks") {
      const title =
        diff.title ||
        (log.entityId ? `Task #${log.entityId.slice(0, 6)}` : null);
      return (
        <div className="flex max-w-lg flex-wrap items-center gap-2">
          {title && (
            <span
              className="max-w-[240px] truncate text-[11px] font-semibold text-slate-800 dark:text-slate-200"
              title={title}
            >
              {title}
            </span>
          )}
          {diff.status && renderStatusBadge(diff.status)}
          {diff.priority && renderPriorityBadge(diff.priority)}
          {diff.assigneeIds &&
            Array.isArray(diff.assigneeIds) &&
            diff.assigneeIds.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <Users className="h-2.5 w-2.5" />
                {diff.assigneeIds.length} Assignee
                {diff.assigneeIds.length > 1 ? "s" : ""}
              </span>
            )}
        </div>
      );
    }

    // 3. Members & Profiles
    if (
      log.action.startsWith("member.") ||
      log.entity === "profiles" ||
      log.entity === "team_members"
    ) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          {diff.fullName && (
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
              {diff.fullName}
            </span>
          )}
          {diff.role && (
            <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
              <Shield className="h-2.5 w-2.5" />
              {diff.role}
            </span>
          )}
          {diff.teamName && (
            <span className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300">
              Team: {diff.teamName}
            </span>
          )}
          {diff.email && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {diff.email}
            </span>
          )}
        </div>
      );
    }

    // 4. Attachments
    if (
      log.action.startsWith("attachment.") ||
      log.entity === "task_attachments"
    ) {
      return (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
          <Paperclip className="h-3 w-3 text-teal-500" />
          <span className="font-semibold">
            {diff.file_name || diff.fileName || "File Attachment"}
          </span>
          {diff.file_size && (
            <span className="text-[10px] text-slate-400">
              ({Math.round(diff.file_size / 1024)} KB)
            </span>
          )}
        </div>
      );
    }

    // 5. Org Settings & Auth
    if (log.action.startsWith("org.") || log.entity === "organizations") {
      return (
        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
          {diff.event || diff.name || "Organization settings modified"}
        </span>
      );
    }

    if (log.action.startsWith("auth.")) {
      return (
        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          {diff.message || "User authentication event recorded"}
        </span>
      );
    }

    // 6. Generic formatted properties (NO raw curly braces)
    return (
      <div className="flex max-w-md flex-wrap items-center gap-1.5">
        {keys.map((k) => {
          const val = diff[k];
          if (val === null || val === undefined) return null;
          const displayVal =
            typeof val === "object" ? JSON.stringify(val) : String(val);
          const formattedKey = k.replace(/_/g, " ");
          return (
            <span
              key={k}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <span className="capitalize text-slate-400">{formattedKey}:</span>
              <span className="max-w-[120px] truncate font-semibold text-slate-900 dark:text-white">
                {displayVal}
              </span>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Activity & Audit Trail
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-all ${
                isConnected
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 shadow-sm shadow-emerald-500/10 dark:text-emerald-400"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              }`}
            >
              <Radio
                className={`h-3 w-3 ${isConnected ? "animate-pulse text-emerald-500" : "text-amber-500"}`}
              />
              {isConnected ? "Realtime Audit Stream" : "Connecting…"}
            </span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              {totalCount} Total Events
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Immutable, cryptographically verifiable log of all workspace
            mutations, task updates & team changes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manual Refresh */}
          <AutoRefreshBadge
            isRefreshing={isRefreshing || isLoading}
            triggerManual={triggerManual}
          />

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="dark:hover:bg-slate-750 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>{isExporting ? "Exporting CSV…" : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* ── Metric Snapshot Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Recorded
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Across all workspace entities
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/20">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Today&apos;s Activity
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {todayCount}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600/70 dark:text-emerald-500">
            Events in last 24h
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/60 p-4 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-950/20">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            Task Operations
          </div>
          <div className="mt-2 text-3xl font-extrabold text-indigo-700 dark:text-indigo-400">
            {taskActionCount}
          </div>
          <div className="mt-1 text-[11px] text-indigo-600/70 dark:text-indigo-500">
            Created, edited, completed
          </div>
        </div>

        <div className="rounded-2xl border border-purple-200/60 bg-purple-50/60 p-4 shadow-sm dark:border-purple-500/20 dark:bg-purple-950/20">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
            Active Actors
          </div>
          <div className="mt-2 text-3xl font-extrabold text-purple-700 dark:text-purple-400">
            {uniqueActorsCount}
          </div>
          <div className="mt-1 text-[11px] text-purple-600/70 dark:text-purple-500">
            Contributing members
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity by actor, action, or diff payload…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
          />
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All Entities</option>
            <option value="tasks">Tasks</option>
            <option value="task_comments">Comments</option>
            <option value="task_attachments">Attachments</option>
            <option value="profiles">Team Profiles</option>
            <option value="organizations">Organization</option>
            <option value="auth">Auth & Security</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All Actions</option>
            <option value="task.created">Task Created</option>
            <option value="task.updated">Task Updated</option>
            <option value="task.status_changed">Status Changed</option>
            <option value="task.deleted">Task Deleted</option>
            <option value="comment.created">Comment Added</option>
            <option value="attachment.uploaded">Attachment Uploaded</option>
            <option value="member.created">Member Added</option>
            <option value="member.role_updated">Role Updated</option>
            <option value="member.team_updated">Team Updated</option>
            <option value="member.removed">Member Removed</option>
            <option value="org.updated">Org Settings Updated</option>
            <option value="auth.login_success">Login Success</option>
            <option value="auth.login_failed">Login Failed</option>
          </select>
        </div>
      </div>

      {/* ── Audit Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Details & Changes</th>
                <th className="px-5 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
                    <span>Loading audit records…</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Activity className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No activity records found
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Actions like creating tasks, editing team members, and
                      updates will appear here in real-time.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actorName = getActorName(log);
                  const createdAt = getCreatedAt(log);
                  const actCfg = getActionConfig(log.action);
                  const initials = actorName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={log.id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 flex-shrink-0 text-slate-400" />
                          <span>
                            {new Date(createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/15 bg-gradient-to-br from-primary/20 to-violet-500/20 text-[10px] font-bold text-primary">
                            {initials}
                          </div>
                          <span className="text-[12px]">{actorName}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-bold ${actCfg.color}`}
                        >
                          {actCfg.label}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          {getEntityIcon(log.entity)}
                          <span className="capitalize">
                            {log.entity.replace("_", " ")}
                          </span>
                        </div>
                      </td>

                      {/* Clean Human-Readable Details (No JSON curly braces) */}
                      <td className="px-5 py-3.5">{renderLogDetails(log)}</td>

                      {/* Inspect */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-primary/10 hover:text-primary dark:bg-slate-800 dark:text-slate-300"
                          title="Inspect Event Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/20 dark:text-slate-400">
          <div>
            Showing page{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {page}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {totalPages}
            </span>{" "}
            ({totalCount} total)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(Math.max(1, page - 1))}
              disabled={page <= 1 || isLoading}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => fetchLogs(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || isLoading}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Inspect Diff Modal (Clean Visual Card Inspector) ── */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
        description="Comprehensive immutable record of this workspace mutation."
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            {/* Event Summary Grid */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Action
                </span>
                <span className="mt-0.5 block font-bold text-slate-900 dark:text-white">
                  {getActionConfig(selectedLog.action).label}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Actor
                </span>
                <span className="mt-0.5 block font-bold text-slate-900 dark:text-white">
                  {getActorName(selectedLog)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Entity
                </span>
                <span className="mt-0.5 block font-bold capitalize text-slate-900 dark:text-white">
                  {selectedLog.entity.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Timestamp
                </span>
                <span className="mt-0.5 block font-bold text-slate-900 dark:text-white">
                  {new Date(getCreatedAt(selectedLog)).toLocaleString()}
                </span>
              </div>
              {selectedLog.entityId || selectedLog.entity_id ? (
                <div className="col-span-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Entity ID
                  </span>
                  <code className="mt-0.5 inline-block break-all rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {selectedLog.entityId || selectedLog.entity_id}
                  </code>
                </div>
              ) : null}
            </div>

            {/* Structured Property Cards (Formatted, No raw JSON) */}
            <div>
              <div className="mb-2 flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>Changed Properties & Values</span>
              </div>

              {selectedLog.diff && Object.keys(selectedLog.diff).length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {Object.entries(selectedLog.diff).map(([key, val]) => {
                    const formattedKey = key.replace(/_/g, " ");
                    const isStatus = key === "status";
                    const isPriority = key === "priority";

                    return (
                      <div
                        key={key}
                        className="shadow-xs flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <span className="text-[10px] font-bold uppercase capitalize tracking-wider text-slate-400">
                          {formattedKey}
                        </span>
                        <div className="mt-1">
                          {isStatus ? (
                            renderStatusBadge(String(val))
                          ) : isPriority ? (
                            renderPriorityBadge(String(val))
                          ) : typeof val === "object" ? (
                            <pre className="whitespace-pre-wrap break-all font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {JSON.stringify(val, null, 2)}
                            </pre>
                          ) : (
                            <span className="break-words text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {String(val)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="dark:bg-slate-850 rounded-xl bg-slate-50 p-4 text-center italic text-slate-400">
                  No property mutations recorded for this event.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
