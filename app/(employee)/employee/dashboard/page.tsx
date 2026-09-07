"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  CheckSquare,
  Search,
  Zap,
  ChevronRight,
  Sun,
  Moon,
  Sunset,
  Sparkles,
  Hash,
  Copy,
  Check,
  Briefcase,
  Circle,
  Play,
  Eye,
  RotateCcw,
  LayoutGrid,
  ListFilter,
  Lock,
  MessageSquare,
  Radio,
  Layers,
  Flame,
  Shield,
  Tag,
  X,
  BadgeCheck,
} from "lucide-react";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";
import { captureEvent } from "@/lib/analytics/posthog";
import { createClient } from "@/infrastructure/supabase/supabaseClient";
import {
  useAutoRefresh,
  AutoRefreshBadge,
} from "@/components/ui/AutoRefreshControl";

// ─── Priority Config ────────────────────────────────────────────────
const PRIORITY_THEME: Record<
  string,
  {
    label: string;
    dot: string;
    bg: string;
    text: string;
    border: string;
    icon: any;
  }
> = {
  urgent: {
    label: "Urgent",
    dot: "bg-rose-500",
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/30",
    icon: Flame,
  },
  high: {
    label: "High",
    dot: "bg-amber-500",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    icon: AlertTriangle,
  },
  medium: {
    label: "Medium",
    dot: "bg-blue-500",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    icon: Circle,
  },
  low: {
    label: "Low",
    dot: "bg-slate-400",
    bg: "bg-slate-500/10 dark:bg-slate-500/15",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/30",
    icon: Circle,
  },
};

// ─── Status Config ──────────────────────────────────────────────────
const STATUS_THEME: Record<
  string,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  pending: {
    label: "To Do",
    icon: Circle,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-300 dark:border-slate-700",
  },
  in_progress: {
    label: "In Progress",
    icon: Play,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    border: "border-blue-200 dark:border-blue-800",
  },
  in_review: {
    label: "In Review",
    icon: Eye,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/60",
    border: "border-purple-200 dark:border-purple-800",
  },
  completed: {
    label: "Done",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    border: "border-emerald-200 dark:border-emerald-800",
  },
};

// ─── Smart Task Content & Title Parser ──────────────────────────────
function formatTaskDisplay(title: string, description?: string | null) {
  let cleanTitle = title ? title.trim() : "Untitled Task";
  let isAiEnhanced = false;
  let cleanObjective = "";
  let acceptanceCriteriaCount = 0;
  let cleanDescription = description ? description.trim() : "";

  // 1. Detect if AI enhanced
  if (/^enhanced:\s*/i.test(cleanTitle)) {
    isAiEnhanced = true;
    cleanTitle = cleanTitle.replace(/^enhanced:\s*/i, "").trim();
  }

  // 2. Extract core draft text if title contains raw draft prompt boilerplate
  // Example: "Please enhance and structure the following task draft: """ website dr """ "
  const promptDraftRegex = /(?:task draft|draft):\s*["'“”«»]*(.+?)["'“”«»]*\s*$/i;
  const draftMatch = cleanTitle.match(promptDraftRegex);
  if (draftMatch && draftMatch[1]) {
    const extracted = draftMatch[1].replace(/["'“”«»]/g, "").trim();
    if (extracted.length > 0) {
      cleanTitle = extracted.charAt(0).toUpperCase() + extracted.slice(1);
    }
  }

  // 3. Process description
  if (cleanDescription) {
    // Check if description has acceptance criteria
    const criteriaMatch = cleanDescription.match(/acceptance criteria:?\s*([\s\S]*)/i);
    if (criteriaMatch && criteriaMatch[1]) {
      const bullets = criteriaMatch[1].match(/[-*•]\s+([^\n\r]+)/g);
      if (bullets) {
        acceptanceCriteriaCount = bullets.length;
      }
    }

    // Extract objective
    const objMatch = cleanDescription.match(/\*\*Objective:\*\*\s*([^\*]+?)(?=\*\*|$)/i);
    if (objMatch && objMatch[1]) {
      const rawObj = objMatch[1].trim();
      const objDraftMatch = rawObj.match(promptDraftRegex);
      if (objDraftMatch && objDraftMatch[1]) {
        cleanObjective = objDraftMatch[1].replace(/["'“”«»]/g, "").trim();
      } else {
        cleanObjective = rawObj.replace(/["'“”«»]/g, "").trim();
      }
    }

    // Clean description of raw markdown symbols for preview
    cleanDescription = cleanDescription
      .replace(/\*\*Objective:\*\*/gi, "")
      .replace(/\*\*Acceptance Criteria:\*\*/gi, "")
      .replace(/\*\*/g, "")
      .replace(/["'“”«»]{2,}/g, "")
      .replace(/#+\s/g, "")
      .replace(/-\s+/g, " • ")
      .trim();

    // If description is just repeating the prompt boilerplate, summarize it cleanly
    if (cleanDescription.toLowerCase().includes("please enhance and structure the following task draft")) {
      cleanDescription = cleanObjective
        ? `Objective: ${cleanObjective}`
        : "Structured task with verified acceptance criteria";
    }
  }

  return {
    title: cleanTitle,
    isAiEnhanced,
    objective: cleanObjective,
    acceptanceCriteriaCount,
    cleanDescription,
  };
}

// ─── Relative Date Formatter ────────────────────────────────────────
function formatDueDate(dateString: string | null | undefined): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
} {
  if (!dateString) return { label: "", isOverdue: false, isToday: false };
  const target = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  const diffDays = Math.round(
    (targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0)
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      isOverdue: true,
      isToday: false,
    };
  if (diffDays === 0)
    return { label: "Due Today", isOverdue: false, isToday: true };
  if (diffDays === 1)
    return { label: "Due Tomorrow", isOverdue: false, isToday: false };
  if (diffDays < 7)
    return { label: `Due in ${diffDays}d`, isOverdue: false, isToday: false };

  return {
    label: target.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    isOverdue: false,
    isToday: false,
  };
}

// ─── Single Task Linear Row Component ──────────────────────────────
interface TaskRowProps {
  task: KanbanTaskItem;
  onOpen: () => void;
  onStatusChange: (
    status: "pending" | "in_progress" | "in_review" | "completed"
  ) => void;
}

function TaskLinearRow({ task, onOpen, onStatusChange }: TaskRowProps) {
  const p = PRIORITY_THEME[task.priority] || PRIORITY_THEME.medium;
  const s = STATUS_THEME[task.status] || STATUS_THEME.pending;
  const isCompleted = task.status === "completed";
  const rawDate = task.dueDate || task.due_date;
  const dateInfo = formatDueDate(rawDate);
  const subtasks = task.subtasks || [];
  const doneSubtasks = subtasks.filter((st: any) => st.completed).length;

  const { title, isAiEnhanced, cleanDescription, acceptanceCriteriaCount } =
    formatTaskDisplay(task.title, task.description);

  // Blocked status check
  const isBlocked = Boolean(
    (task.dependencyTaskIds && task.dependencyTaskIds.length > 0) ||
    (task.dependencies &&
      task.dependencies.some((d) => d.status !== "completed"))
  );

  return (
    <div
      onClick={onOpen}
      className={`group relative flex cursor-pointer flex-col justify-between gap-3.5 rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md sm:flex-row sm:items-center ${
        isCompleted
          ? "border-slate-200/80 bg-slate-50/70 opacity-80 hover:opacity-100 dark:border-slate-800/60 dark:bg-slate-900/40"
          : "border-slate-200 bg-white hover:border-indigo-500/50 hover:shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-500/40"
      }`}
    >
      {/* Priority Left Indicator Bar */}
      <div
        className={`absolute bottom-3.5 left-0 top-3.5 w-1.5 rounded-r-full ${p.dot}`}
      />

      {/* Left Column: Instant Toggle Checkbox + Title + Clean Metadata */}
      <div className="flex min-w-0 flex-1 items-start gap-3.5 pl-2 sm:items-center">
        {/* Quick Checkbox Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(isCompleted ? "in_progress" : "completed");
          }}
          className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-150 sm:mt-0 ${
            isCompleted
              ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
              : "border-slate-300 text-transparent hover:border-emerald-500 hover:bg-emerald-500/10 dark:border-slate-600 dark:hover:border-emerald-400"
          }`}
          title={isCompleted ? "Mark as in progress" : "Mark as completed"}
        >
          <Check
            className={`h-3.5 w-3.5 stroke-[3] transition-opacity ${
              isCompleted ? "opacity-100" : "opacity-0 group-hover:opacity-40"
            }`}
          />
        </button>

        {/* Task Details Info */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Metadata Chips Bar */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${p.bg} ${p.text} ${p.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
              {p.label}
            </span>

            {/* AI Enhanced Tag */}
            {isAiEnhanced && (
              <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-300">
                <Sparkles className="h-2.5 w-2.5 text-purple-500" />
                AI Enhanced
              </span>
            )}

            {/* Blocked Pill */}
            {isBlocked && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                <Lock className="h-2.5 w-2.5" />
                Blocked
              </span>
            )}

            {/* Acceptance Criteria Badge */}
            {acceptanceCriteriaCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400">
                <BadgeCheck className="h-2.5 w-2.5" />
                {acceptanceCriteriaCount} criteria
              </span>
            )}

            {/* Tags */}
            {task.tags &&
              task.tags.length > 0 &&
              task.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
          </div>

          {/* Clean Title */}
          <h4
            className={`line-clamp-2 text-sm font-bold leading-snug transition-colors sm:text-base ${
              isCompleted
                ? "text-slate-400 line-through dark:text-slate-500"
                : "text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400"
            }`}
          >
            {title}
          </h4>

          {/* Clean Description Summary Preview */}
          {cleanDescription && (
            <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
              {cleanDescription}
            </p>
          )}

          {/* Micro Meta: Subtasks + Due Date + Comments */}
          <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {/* Due Date Indicator */}
            {rawDate && (
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold ${
                  dateInfo.isOverdue && !isCompleted
                    ? "font-bold text-rose-600 dark:text-rose-400"
                    : dateInfo.isToday && !isCompleted
                      ? "font-bold text-amber-600 dark:text-amber-400"
                      : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{dateInfo.label}</span>
              </div>
            )}

            {/* Subtasks Progress */}
            {subtasks.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  {doneSubtasks}/{subtasks.length} subtasks
                </span>
              </div>
            )}

            {/* Comments Count */}
            {(task.commentsCount ||
              (task.comments && task.comments.length) ||
              0) > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                <span>{task.commentsCount || task.comments?.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Inline Status Control & Open Drawer CTA */}
      <div
        className="flex items-center justify-between gap-2.5 border-t border-slate-100 pl-9 pt-2.5 dark:border-slate-800 sm:justify-end sm:border-t-0 sm:pl-0 sm:pt-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as any)}
          className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${s.bg} ${s.color} ${s.border}`}
        >
          <option value="pending">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="completed">Done ✓</option>
        </select>

        {/* Open Details Button */}
        <button
          type="button"
          onClick={onOpen}
          className="rounded-xl border border-slate-200/80 p-2 text-slate-400 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Open Task Details"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Employee Dashboard Page ──────────────────────────────────
export default function EmployeeDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTaskItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Filter & View States
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "due_soon" | "completed"
  >("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"due_date" | "priority" | "newest">(
    "due_date"
  );

  // Profile
  const [employeeProfile, setEmployeeProfile] = useState({
    id: "",
    employeeCode: "EMP-0001",
    fullName: "Employee",
    email: "employee@workspace.com",
    role: "employee",
    position: null as string | null,
    phoneNumber: null as string | null,
    teamId: null as string | null,
    teamName: "General Squad",
    avatarUrl: null as string | null,
    joinedAt: "",
  });

  // Buckets
  const [buckets, setBuckets] = useState<{
    dueToday: KanbanTaskItem[];
    upcoming: KanbanTaskItem[];
    recentlyCompleted: KanbanTaskItem[];
  }>({ dueToday: [], upcoming: [], recentlyCompleted: [] });

  // Timezone Greeting
  const [greeting, setGreeting] = useState<{
    text: string;
    icon: any;
    color: string;
  }>({
    text: "Welcome",
    icon: Sparkles,
    color: "text-amber-400",
  });

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12)
      setGreeting({ text: "Good Morning", icon: Sun, color: "text-amber-400" });
    else if (h < 18)
      setGreeting({
        text: "Good Afternoon",
        icon: Sunset,
        color: "text-orange-400",
      });
    else
      setGreeting({
        text: "Good Evening",
        icon: Moon,
        color: "text-indigo-300",
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Fetch live assigned tasks from API
  const fetchMyTasks = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/v1/dashboard/me");
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.profile) {
          setEmployeeProfile(json.data.profile);
        }
        setBuckets({
          dueToday: json.data.dueToday || [],
          upcoming: json.data.upcoming || [],
          recentlyCompleted: json.data.recentlyCompleted || [],
        });
      }
    } catch {
      // silent
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTasks(false);
  }, [fetchMyTasks]);

  const { isRefreshing, triggerManual } = useAutoRefresh(
    (silent) => fetchMyTasks(silent ?? true),
    20,
    true
  );

  // 2. Realtime Postgres connection & Cross-Tab Activity Sync
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!url || url.includes("your-project-ref")) {
      setIsConnected(true);
    } else {
      let channel: any = null;
      try {
        const sb = createClient();
        channel = sb
          .channel(`rt:emp:${Math.random().toString(36).slice(2, 8)}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "tasks" },
            () => {
              fetchMyTasks(true);
            }
          )
          .subscribe((s: any) => setIsConnected(s === "SUBSCRIBED"));
      } catch {
        // silent
      }
      return () => {
        if (channel) createClient().removeChannel(channel);
      };
    }
  }, [fetchMyTasks]);

  // Cross-tab broadcast receiver
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleWindowUpdate = () => {
      fetchMyTasks(true);
    };

    window.addEventListener("tasq:activity_updated", handleWindowUpdate);

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel("tasq-activity-channel");
      bc.onmessage = () => {
        fetchMyTasks(true);
      };
    }

    return () => {
      window.removeEventListener("tasq:activity_updated", handleWindowUpdate);
      if (bc) bc.close();
    };
  }, [fetchMyTasks]);

  const broadcastActivity = () => {
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tasq:activity_updated"));
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("tasq-activity-channel");
          bc.postMessage({
            type: "TASQ_TASK_STATUS_CHANGED",
            timestamp: Date.now(),
          });
          bc.close();
        }
      }
    } catch {
      // non-blocking
    }
  };

  // Combined flat list of all assigned tasks
  const allTasks = useMemo(() => {
    const map = new Map<string, KanbanTaskItem>();
    [
      ...buckets.dueToday,
      ...buckets.upcoming,
      ...buckets.recentlyCompleted,
    ].forEach((t) => {
      map.set(t.id, t);
    });
    return Array.from(map.values());
  }, [buckets]);

  // KPI Calculations
  const totalTasksCount = allTasks.length;
  const completedTasksCount = allTasks.filter(
    (t) => t.status === "completed"
  ).length;
  const inProgressCount = allTasks.filter(
    (t) => t.status === "in_progress"
  ).length;
  const activeCount = allTasks.filter((t) => t.status !== "completed").length;

  const overdueCount = useMemo(() => {
    const now = Date.now();
    return allTasks.filter((t) => {
      if (t.status === "completed") return false;
      const d = t.dueDate || t.due_date;
      return d ? new Date(d).getTime() < now : false;
    }).length;
  }, [allTasks]);

  const dueSoonCount = useMemo(() => {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const twoDaysLater = today + 3 * 86400000;
    return allTasks.filter((t) => {
      if (t.status === "completed") return false;
      const d = t.dueDate || t.due_date;
      if (!d) return false;
      const tTime = new Date(d).getTime();
      return tTime <= twoDaysLater;
    }).length;
  }, [allTasks]);

  const completionRate =
    totalTasksCount > 0
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0;

  // 3. Status Change Handler with instant optimistic update & live DB sync
  const handleStatusChange = async (
    task: KanbanTaskItem,
    newStatus: "pending" | "in_progress" | "in_review" | "completed"
  ) => {
    if (task.status === newStatus) return;

    // Dependency Blocking Validation
    if (newStatus === "in_progress" || newStatus === "completed") {
      const blockers = allTasks.filter(
        (t) =>
          (task.dependencyTaskIds || []).includes(t.id) &&
          t.status !== "completed"
      );
      if (blockers.length > 0) {
        showToast(`⚠️ Blocked by prerequisite task: "${blockers[0]?.title}"`);
        return;
      }
    }

    const previousBuckets = { ...buckets };
    const updatedTask = { ...task, status: newStatus };

    // Optimistically update local buckets immediately
    setBuckets((prev) => {
      const filterOut = (list: KanbanTaskItem[]) =>
        list.filter((t) => t.id !== task.id);
      const dt = filterOut(prev.dueToday);
      const up = filterOut(prev.upcoming);
      const rc = filterOut(prev.recentlyCompleted);

      if (newStatus === "completed") {
        return {
          dueToday: dt,
          upcoming: up,
          recentlyCompleted: [updatedTask, ...rc],
        };
      }

      const due = task.dueDate || task.due_date;
      const isToday =
        due && new Date(due).toDateString() === new Date().toDateString();

      return isToday
        ? {
            dueToday: [updatedTask, ...dt],
            upcoming: up,
            recentlyCompleted: rc,
          }
        : {
            dueToday: dt,
            upcoming: [updatedTask, ...up],
            recentlyCompleted: rc,
          };
    });

    captureEvent("task_status_changed", {
      taskId: task.id,
      oldStatus: task.status,
      newStatus,
    });

    try {
      const r = await fetch(`/api/v1/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const j = await r.json();
      if (!j.success) {
        showToast(j.error || "Update failed. Reverting changes.");
        setBuckets(previousBuckets);
        fetchMyTasks(true);
      } else {
        // Broadcast change so manager, admin, and other tabs reflect it
        broadcastActivity();
      }
    } catch {
      showToast("Network error: Status update failed.");
      setBuckets(previousBuckets);
      fetchMyTasks(true);
    }
  };

  // Filtered and Sorted Tasks for Display
  const filteredTasks = useMemo(() => {
    return allTasks
      .filter((task) => {
        // Tab Filter
        if (activeTab === "active" && task.status === "completed") return false;
        if (activeTab === "completed" && task.status !== "completed")
          return false;
        if (activeTab === "due_soon") {
          if (task.status === "completed") return false;
          const d = task.dueDate || task.due_date;
          if (!d) return false;
          const target = new Date(d).getTime();
          const limit = Date.now() + 3 * 86400000;
          if (target > limit) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const { title, cleanDescription, objective } = formatTaskDisplay(
            task.title,
            task.description
          );
          const matchTitle =
            task.title.toLowerCase().includes(q) ||
            title.toLowerCase().includes(q);
          const matchDesc =
            (task.description || "").toLowerCase().includes(q) ||
            cleanDescription.toLowerCase().includes(q) ||
            objective.toLowerCase().includes(q);
          const matchTag = task.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchTag) return false;
        }

        // Priority Filter
        if (priorityFilter !== "all" && task.priority !== priorityFilter)
          return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "due_date") {
          const dateA =
            a.dueDate || a.due_date
              ? new Date(a.dueDate || a.due_date!).getTime()
              : Infinity;
          const dateB =
            b.dueDate || b.due_date
              ? new Date(b.dueDate || b.due_date!).getTime()
              : Infinity;
          return dateA - dateB;
        }
        if (sortBy === "priority") {
          const rank: Record<string, number> = {
            urgent: 4,
            high: 3,
            medium: 2,
            low: 1,
          };
          return (rank[b.priority] || 0) - (rank[a.priority] || 0);
        }
        if (sortBy === "newest") {
          const timeA = new Date(a.created_at || a.dueDate || 0).getTime();
          const timeB = new Date(b.created_at || b.dueDate || 0).getTime();
          return timeB - timeA;
        }
        return 0;
      });
  }, [allTasks, activeTab, searchQuery, priorityFilter, sortBy]);

  const copyEmployeeCode = () => {
    navigator.clipboard.writeText(employeeProfile.employeeCode);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const initials =
    employeeProfile.fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EM";

  const GreetingIcon = greeting.icon;

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-600 shadow-sm dark:text-rose-400">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-base font-bold hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 🚀 Executive Employee Command Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-7">
        {/* Ambient Glow Accents */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          {/* Left Column: Profile Info */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Avatar with Glowing Ring & Presence Indicator */}
            <div className="relative flex-shrink-0">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-teal-400 p-[2px] shadow-lg shadow-indigo-500/20 sm:h-20 sm:w-20">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950 text-xl font-extrabold tracking-wider text-white sm:text-2xl">
                  {initials}
                </div>
              </div>
              <span
                title="Live Sync Connected"
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-900 bg-emerald-500 shadow"
              >
                <span className="h-2 w-2 animate-ping rounded-full bg-white" />
              </span>
            </div>

            {/* Employee Meta Details */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Timezone Greeting */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-indigo-200 backdrop-blur-md">
                  <GreetingIcon className={`h-3.5 w-3.5 ${greeting.color}`} />
                  <span>{greeting.text}</span>
                </span>

                {/* Role Pill */}
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-300">
                  <Shield className="h-3 w-3" />
                  Workspace Member
                </span>

                {/* Live Realtime Sync Beacon */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-md transition-colors ${
                    isConnected
                      ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                      : "border-amber-500/30 bg-amber-500/20 text-amber-300"
                  }`}
                >
                  <Radio
                    className={`h-3 w-3 ${
                      isConnected ? "animate-pulse text-emerald-400" : "text-amber-400"
                    }`}
                  />
                  <span>
                    {isConnected ? "Live Sync Active" : "Connecting..."}
                  </span>
                </span>
              </div>

              {/* Full Name & Position */}
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {employeeProfile.fullName}
                  </h1>
                  {employeeProfile.position && (
                    <span className="rounded-lg border border-indigo-400/30 bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-200">
                      {employeeProfile.position}
                    </span>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-2 text-xs text-indigo-200/80 sm:text-sm">
                  <span>My Assigned Tasks & Sprint Execution</span>
                  <span className="text-indigo-400">•</span>
                  <span>
                    {completedTasksCount} of {totalTasksCount} completed (
                    {completionRate}%)
                  </span>
                </p>
              </div>

              {/* Identity Chips */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                {/* Copy ID Button */}
                <button
                  type="button"
                  onClick={copyEmployeeCode}
                  title="Click to copy Employee ID"
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 font-mono text-[11px] font-bold text-indigo-200 transition hover:bg-white/15 hover:text-white"
                >
                  <Hash className="h-3 w-3 text-indigo-400" />
                  <span>ID: {employeeProfile.employeeCode}</span>
                  {copiedId ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-indigo-300 opacity-70 transition group-hover:text-white" />
                  )}
                </button>

                {/* Team Tag */}
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-200">
                  <Briefcase className="h-3 w-3 text-amber-400" />
                  <span>{employeeProfile.teamName || "General Squad"}</span>
                </span>

                {/* Email Tag */}
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] text-indigo-200">
                  <span>{employeeProfile.email}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Auto-Refresh & Progress Bar */}
          <div className="flex flex-shrink-0 flex-col items-start justify-between gap-4 sm:flex-row lg:flex-col lg:items-end">
            <AutoRefreshBadge
              isRefreshing={isRefreshing || isLoading}
              triggerManual={triggerManual}
            />

            {/* Sprint Completion Progress Bar */}
            <div className="w-full space-y-1.5 rounded-2xl border border-white/10 bg-white/5 p-3 sm:w-60">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-200">
                <span>Sprint Progress</span>
                <span className="font-bold text-white">{completionRate}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Interactive Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Card 1: Assigned Tasks */}
        <div
          onClick={() => setActiveTab("all")}
          className="group cursor-pointer space-y-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-blue-500/50"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Assigned Tasks</span>
            <div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-500 dark:bg-blue-500/20">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            {totalTasksCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400">
            In your queue →
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div
          onClick={() => setActiveTab("active")}
          className="group cursor-pointer space-y-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-amber-500/50"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>In Progress</span>
            <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-500 dark:bg-amber-500/20">
              <Play className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 sm:text-3xl">
            {inProgressCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500 group-hover:text-amber-600 dark:text-slate-400 dark:group-hover:text-amber-400">
            Actively working →
          </div>
        </div>

        {/* Card 3: Due Soon / Overdue */}
        <div
          onClick={() => setActiveTab("due_soon")}
          className={`group cursor-pointer space-y-1 rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
            overdueCount > 0
              ? "border-rose-500/40 bg-rose-500/5 hover:border-rose-500 dark:border-rose-500/30 dark:bg-rose-500/10"
              : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/90"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Due Soon / Overdue</span>
            <div
              className={`rounded-lg p-1.5 ${
                overdueCount > 0
                  ? "bg-rose-500/15 text-rose-500"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              <AlertTriangle
                className={`h-4 w-4 ${
                  overdueCount > 0 ? "animate-pulse text-rose-500" : ""
                }`}
              />
            </div>
          </div>
          <div
            className={`text-2xl font-black sm:text-3xl ${
              overdueCount > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {overdueCount > 0 ? overdueCount : dueSoonCount}
          </div>
          <div
            className={`text-[11px] font-medium ${
              overdueCount > 0
                ? "font-bold text-rose-600 dark:text-rose-400"
                : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            {overdueCount > 0 ? "Requires urgent attention →" : "Next 72 hours →"}
          </div>
        </div>

        {/* Card 4: Completed */}
        <div
          onClick={() => setActiveTab("completed")}
          className="group cursor-pointer space-y-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-emerald-500/50"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Completed</span>
            <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-500 dark:bg-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 sm:text-3xl">
            {completedTasksCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500 group-hover:text-emerald-600 dark:text-slate-400 dark:group-hover:text-emerald-400">
            {completionRate}% completion →
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar & View Switcher ── */}
      <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        {/* Top Row: Segmented Tabs + View Switcher */}
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800 sm:flex-row sm:items-center">
          {/* Segmented Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold sm:pb-0">
            {[
              { id: "all", label: "All Tasks", count: totalTasksCount },
              {
                id: "active",
                label: "To Do / In Progress",
                count: activeCount,
              },
              { id: "due_soon", label: "Due Soon", count: dueSoonCount },
              {
                id: "completed",
                label: "Completed",
                count: completedTasksCount,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* View Mode Toggle: List vs Board */}
          <div className="flex items-center self-start rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800/80 sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                viewMode === "list"
                  ? "bg-white font-bold text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                viewMode === "board"
                  ? "bg-white font-bold text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Search Box + Priority Filter + Sort */}
        <div className="flex flex-col justify-between gap-3 text-xs md:flex-row md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search your tasks by title, tag, objective or criteria..."
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

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">
                Priority:
              </span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="all">All</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Reset Filters if active */}
            {(searchQuery || priorityFilter !== "all" || sortBy !== "due_date") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPriorityFilter("all");
                  setSortBy("due_date");
                }}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Task View Content ── */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : viewMode === "list" ? (
        /* ─── Modern Linear List View ─── */
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskLinearRow
              key={task.id}
              task={task}
              onOpen={() => {
                setSelectedTask(task);
                setIsDetailOpen(true);
              }}
              onStatusChange={(status) => handleStatusChange(task, status)}
            />
          ))}

          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900/90">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeTab === "completed"
                  ? "No completed tasks yet"
                  : activeTab === "due_soon"
                    ? "No tasks due soon"
                    : "All clear! No tasks found"}
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                {searchQuery || priorityFilter !== "all"
                  ? "Try resetting your search or filter options to see more tasks."
                  : activeTab === "completed"
                    ? "Mark tasks as done using the checkbox to track your accomplishments."
                    : "You're all caught up on your workspace tasks for now."}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ─── Kanban Board View ─── */
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-4">
          {[
            {
              id: "pending",
              title: "To Do",
              badgeColor:
                "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
            },
            {
              id: "in_progress",
              title: "In Progress",
              badgeColor:
                "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
            },
            {
              id: "in_review",
              title: "In Review",
              badgeColor:
                "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
            },
            {
              id: "completed",
              title: "Done",
              badgeColor:
                "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
            },
          ].map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="flex min-h-[480px] flex-col rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/60"
              >
                {/* Column Header */}
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    {col.title}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${col.badgeColor}`}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Task Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {colTasks.map((task) => {
                    const p =
                      PRIORITY_THEME[task.priority] || PRIORITY_THEME.medium;
                    const isDone = task.status === "completed";
                    const { title, isAiEnhanced } = formatTaskDisplay(
                      task.title,
                      task.description
                    );

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailOpen(true);
                        }}
                        className={`cursor-pointer space-y-2.5 rounded-xl border p-3.5 shadow-sm transition-all hover:shadow-md ${
                          isDone
                            ? "border-slate-200 bg-slate-50 opacity-75 dark:border-slate-800 dark:bg-slate-900/40"
                            : "border-slate-200 bg-white hover:border-indigo-500/50 dark:border-slate-800 dark:bg-slate-800/80 dark:hover:border-indigo-500/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${p.bg} ${p.text} ${p.border}`}
                          >
                            {p.label}
                          </span>
                          {isAiEnhanced && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                              <Sparkles className="h-2.5 w-2.5" />
                              AI
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-[10px] font-medium text-slate-500">
                              {new Date(task.dueDate).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          )}
                        </div>

                        <h4
                          className={`line-clamp-2 text-xs font-bold leading-snug ${
                            isDone
                              ? "text-slate-400 line-through"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {title}
                        </h4>

                        {/* Move Status Controls */}
                        <div
                          className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task, e.target.value as any)
                            }
                            className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <option value="pending">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="completed">Done ✓</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 dark:border-slate-800">
                      <span>No tasks in {col.title}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Task Detail Modal ── */}
      <TaskDetail
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        allTasks={allTasks}
        onTaskUpdated={() => {
          fetchMyTasks();
          broadcastActivity();
        }}
      />
    </div>
  );
}
