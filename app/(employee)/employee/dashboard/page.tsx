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
  ArrowUpDown,
  Filter,
  Radio,
  Layers,
  Flame,
  Shield,
  Tag,
} from "lucide-react";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";
import { captureEvent } from "@/lib/analytics/posthog";
import { createClient } from "@/infrastructure/supabase/supabaseClient";
import { useAutoRefresh, AutoRefreshBadge } from "@/components/ui/AutoRefreshControl";

// ─── Priority Config ────────────────────────────────────────────────
const PRIORITY_THEME: Record<string, { label: string; dot: string; bg: string; text: string; border: string; icon: any }> = {
  urgent: { label: "Urgent", dot: "bg-rose-500",    bg: "bg-rose-500/10 dark:bg-rose-500/15",    text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/30", icon: Flame },
  high:   { label: "High",   dot: "bg-amber-500",   bg: "bg-amber-500/10 dark:bg-amber-500/15",  text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30", icon: AlertTriangle },
  medium: { label: "Medium", dot: "bg-blue-500",    bg: "bg-blue-500/10 dark:bg-blue-500/15",    text: "text-blue-600 dark:text-blue-400",   border: "border-blue-500/30",   icon: Circle },
  low:    { label: "Low",    dot: "bg-slate-400",   bg: "bg-slate-500/10 dark:bg-slate-500/15",  text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/30", icon: Circle },
};

// ─── Status Config ──────────────────────────────────────────────────
const STATUS_THEME: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  pending:     { label: "To Do",       icon: Circle,       color: "text-slate-600 dark:text-slate-400",   bg: "bg-slate-100 dark:bg-slate-800",       border: "border-slate-300 dark:border-slate-700" },
  in_progress: { label: "In Progress", icon: Play,         color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/60",       border: "border-blue-200 dark:border-blue-800" },
  in_review:   { label: "In Review",   icon: Eye,          color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/60", border: "border-purple-200 dark:border-purple-800" },
  completed:   { label: "Done",        icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/60", border: "border-emerald-200 dark:border-emerald-800" },
};

// ─── Relative Date Formatter ────────────────────────────────────────
function formatDueDate(dateString: string | null | undefined): { label: string; isOverdue: boolean; isToday: boolean } {
  if (!dateString) return { label: "", isOverdue: false, isToday: false };
  const target = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isToday: false };
  if (diffDays === 0) return { label: "Due Today", isOverdue: false, isToday: true };
  if (diffDays === 1) return { label: "Due Tomorrow", isOverdue: false, isToday: false };
  if (diffDays < 7) return { label: `Due in ${diffDays}d`, isOverdue: false, isToday: false };

  return {
    label: target.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    isOverdue: false,
    isToday: false,
  };
}

// ─── Single Task Linear Row Component ──────────────────────────────
interface TaskRowProps {
  task: KanbanTaskItem;
  onOpen: () => void;
  onStatusChange: (status: "pending" | "in_progress" | "in_review" | "completed") => void;
}

function TaskLinearRow({ task, onOpen, onStatusChange }: TaskRowProps) {
  const p = PRIORITY_THEME[task.priority] || PRIORITY_THEME.medium;
  const s = STATUS_THEME[task.status] || STATUS_THEME.pending;
  const StatusIcon = s.icon;
  const isCompleted = task.status === "completed";
  const rawDate = task.dueDate || task.due_date;
  const dateInfo = formatDueDate(rawDate);
  const subtasks = task.subtasks || [];
  const doneSubtasks = subtasks.filter((st: any) => st.completed).length;

  // Blocked status check
  const isBlocked = Boolean(
    (task.dependencyTaskIds && task.dependencyTaskIds.length > 0) ||
    (task.dependencies && task.dependencies.some((d) => d.status !== "completed"))
  );

  return (
    <div
      onClick={onOpen}
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
        isCompleted
          ? "bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/60 opacity-75 hover:opacity-100"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50"
      }`}
    >
      {/* Priority subtle left indicator stripe */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${p.dot}`} />

      {/* Left side: Checkbox + Title + Metadata */}
      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0 pl-1.5">
        {/* Quick Checkbox Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(isCompleted ? "in_progress" : "completed");
          }}
          className={`flex-shrink-0 mt-0.5 sm:mt-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
              : "border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/10 text-transparent"
          }`}
          title={isCompleted ? "Mark as in progress" : "Mark as completed"}
        >
          <Check className={`w-3.5 h-3.5 stroke-[3] ${isCompleted ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
        </button>

        {/* Task Details Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority Badge */}
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${p.bg} ${p.text} ${p.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
              {p.label}
            </span>

            {/* Blocked Pill */}
            {isBlocked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Lock className="w-2.5 h-2.5" />
                Blocked
              </span>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && task.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h4
            className={`text-sm sm:text-base font-bold leading-snug transition-colors line-clamp-2 ${
              isCompleted
                ? "line-through text-slate-400 dark:text-slate-500"
                : "text-slate-900 dark:text-white group-hover:text-primary"
            }`}
          >
            {task.title}
          </h4>

          {/* Description Preview (if present) */}
          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {task.description}
            </p>
          )}

          {/* Micro Meta: Subtasks + Due Date */}
          <div className="flex items-center gap-3 pt-0.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            {/* Due Date Indicator */}
            {rawDate && (
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold ${
                  dateInfo.isOverdue && !isCompleted
                    ? "text-rose-600 dark:text-rose-400"
                    : dateInfo.isToday && !isCompleted
                    ? "text-amber-600 dark:text-amber-400 font-bold"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{dateInfo.label}</span>
              </div>
            )}

            {/* Subtasks Progress */}
            {subtasks.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{doneSubtasks}/{subtasks.length} subtasks</span>
              </div>
            )}

            {/* Comments Count */}
            {(task.commentsCount || (task.comments && task.comments.length) || 0) > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{task.commentsCount || task.comments?.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Interactive Status Control & Detail CTA */}
      <div
        className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pl-9 sm:pl-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as any)}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer transition shadow-sm ${s.bg} ${s.color} ${s.border}`}
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
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Open Task Details"
        >
          <ChevronRight className="w-4 h-4" />
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
  const [activeTab, setActiveTab] = useState<"all" | "active" | "due_soon" | "completed">("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"due_date" | "priority" | "newest">("due_date");

  // Profile
  const [employeeProfile, setEmployeeProfile] = useState({
    id: "",
    employeeCode: "EMP-0001",
    fullName: "Employee",
    email: "employee@workspace.com",
    role: "employee",
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
  const [greeting, setGreeting] = useState<{ text: string; icon: any; color: string }>({
    text: "Welcome",
    icon: Sparkles,
    color: "text-amber-400",
  });

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting({ text: "Good Morning", icon: Sun, color: "text-amber-400" });
    else if (h < 18) setGreeting({ text: "Good Afternoon", icon: Sunset, color: "text-orange-400" });
    else setGreeting({ text: "Good Evening", icon: Moon, color: "text-indigo-300" });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Fetch live assigned tasks from API
  const fetchMyTasks = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  const { isRefreshing, triggerManual } = useAutoRefresh(fetchMyTasks);

  // 2. Realtime Postgres connection
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!url || url.includes("your-project-ref")) {
      setIsConnected(true);
      return;
    }
    let channel: any = null;
    try {
      const sb = createClient();
      channel = sb
        .channel(`rt:emp:${Math.random().toString(36).slice(2, 8)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
          fetchMyTasks();
        })
        .subscribe((s: any) => setIsConnected(s === "SUBSCRIBED"));
    } catch {
      // silent
    }
    return () => {
      if (channel) createClient().removeChannel(channel);
    };
  }, [fetchMyTasks]);

  // Combined flat list of all assigned tasks
  const allTasks = useMemo(() => {
    const map = new Map<string, KanbanTaskItem>();
    [...buckets.dueToday, ...buckets.upcoming, ...buckets.recentlyCompleted].forEach((t) => {
      map.set(t.id, t);
    });
    return Array.from(map.values());
  }, [buckets]);

  // KPI Calculations
  const totalTasksCount = allTasks.length;
  const completedTasksCount = allTasks.filter((t) => t.status === "completed").length;
  const inProgressCount = allTasks.filter((t) => t.status === "in_progress").length;
  const inReviewCount = allTasks.filter((t) => t.status === "in_review").length;
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const twoDaysLater = today + 3 * 86400000;
    return allTasks.filter((t) => {
      if (t.status === "completed") return false;
      const d = t.dueDate || t.due_date;
      if (!d) return false;
      const tTime = new Date(d).getTime();
      return tTime <= twoDaysLater;
    }).length;
  }, [allTasks]);

  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // 3. Status Change Handler
  const handleStatusChange = async (
    task: KanbanTaskItem,
    newStatus: "pending" | "in_progress" | "in_review" | "completed"
  ) => {
    if (task.status === newStatus) return;

    // Dependency Blocking Validation
    if (newStatus === "in_progress" || newStatus === "completed") {
      const blockers = allTasks.filter(
        (t) => (task.dependencyTaskIds || []).includes(t.id) && t.status !== "completed"
      );
      if (blockers.length > 0) {
        showToast(`⚠️ Blocked by prerequisite task: "${blockers[0]?.title}"`);
        return;
      }
    }

    const updatedTask = { ...task, status: newStatus };

    // Optimistically update local buckets
    setBuckets((prev) => {
      const filterOut = (list: KanbanTaskItem[]) => list.filter((t) => t.id !== task.id);
      const dt = filterOut(prev.dueToday);
      const up = filterOut(prev.upcoming);
      const rc = filterOut(prev.recentlyCompleted);

      if (newStatus === "completed") {
        return { dueToday: dt, upcoming: up, recentlyCompleted: [updatedTask, ...rc] };
      }

      const due = task.dueDate || task.due_date;
      const isToday = due && new Date(due).toDateString() === new Date().toDateString();

      return isToday
        ? { dueToday: [updatedTask, ...dt], upcoming: up, recentlyCompleted: rc }
        : { dueToday: dt, upcoming: [updatedTask, ...up], recentlyCompleted: rc };
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
        showToast(j.error || "Update failed.");
        fetchMyTasks();
      }
    } catch {
      showToast("Network error: Status update failed.");
      fetchMyTasks();
    }
  };

  // Filtered and Sorted Tasks for Display
  const filteredTasks = useMemo(() => {
    return allTasks
      .filter((task) => {
        // Tab Filter
        if (activeTab === "active" && task.status === "completed") return false;
        if (activeTab === "completed" && task.status !== "completed") return false;
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
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = (task.description || "").toLowerCase().includes(q);
          const matchTag = task.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchTag) return false;
        }

        // Priority Filter
        if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "due_date") {
          const dateA = a.dueDate || a.due_date ? new Date(a.dueDate || a.due_date!).getTime() : Infinity;
          const dateB = b.dueDate || b.due_date ? new Date(b.dueDate || b.due_date!).getTime() : Infinity;
          return dateA - dateB;
        }
        if (sortBy === "priority") {
          const rank: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (rank[b.priority] || 0) - (rank[a.priority] || 0);
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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-600 dark:text-rose-400 flex items-center justify-between shadow-sm">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="font-bold text-base hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* ── 🚀 Executive Employee Command Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 shadow-2xl border border-indigo-800/40">
        {/* Glow Spheres */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Profile Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar with Live Indicator */}
            <div className="relative flex-shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-teal-400 p-[2px] shadow-lg shadow-indigo-500/25">
                <div className="h-full w-full rounded-[14px] bg-slate-900 flex items-center justify-center font-extrabold text-xl sm:text-2xl tracking-wider text-white">
                  {initials}
                </div>
              </div>
              <span
                title="Realtime Active"
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow"
              >
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              </span>
            </div>

            {/* Employee Meta */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Timezone Greeting */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-indigo-200 backdrop-blur-md border border-white/10">
                  <GreetingIcon className={`w-3.5 h-3.5 ${greeting.color}`} />
                  <span>{greeting.text}</span>
                </span>

                {/* Role Pill */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  Workspace Member
                </span>

                {/* Live Realtime Pill */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md transition-colors ${
                    isConnected
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  <Radio className={`w-3 h-3 ${isConnected ? "animate-pulse text-emerald-400" : "text-amber-400"}`} />
                  <span>{isConnected ? "Live Sync Active" : "Connecting..."}</span>
                </span>
              </div>

              {/* Full Name & Headline */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  {employeeProfile.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-indigo-200/80 mt-0.5 flex items-center gap-2">
                  <span>My Assigned Tasks & Sprint Execution</span>
                  <span className="text-indigo-400">•</span>
                  <span>{completedTasksCount} of {totalTasksCount} completed ({completionRate}%)</span>
                </p>
              </div>

              {/* Identity Chips */}
              <div className="flex items-center gap-2.5 flex-wrap pt-1 text-xs">
                {/* Copy ID Button */}
                <button
                  type="button"
                  onClick={copyEmployeeCode}
                  title="Click to copy Employee ID"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-indigo-200 hover:text-white border border-white/10 transition group font-mono text-[11px] font-bold"
                >
                  <Hash className="w-3 h-3 text-indigo-400" />
                  <span>ID: {employeeProfile.employeeCode}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-indigo-300 group-hover:text-white transition opacity-70" />
                  )}
                </button>

                {/* Team Tag */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-indigo-200 border border-white/10 text-[11px] font-semibold">
                  <Briefcase className="w-3 h-3 text-amber-400" />
                  <span>{employeeProfile.teamName || "General Squad"}</span>
                </span>

                {/* Email Tag */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-indigo-200 border border-white/10 text-[11px]">
                  <span>{employeeProfile.email}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Refresh & Progress Bar */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 flex-shrink-0">
            <AutoRefreshBadge isRefreshing={isRefreshing || isLoading} triggerManual={triggerManual} />

            {/* Quick Completion Progress Bar */}
            <div className="w-full sm:w-56 space-y-1.5 bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-200">
                <span>Sprint Progress</span>
                <span className="text-white font-bold">{completionRate}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Assigned Tasks</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{totalTasksCount}</div>
          <div className="text-[11px] text-slate-500 font-medium">In your queue</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>In Progress</span>
            <Play className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{inProgressCount}</div>
          <div className="text-[11px] text-slate-500 font-medium">Actively working</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Due Soon / Overdue</span>
            <AlertTriangle className={`w-4 h-4 ${overdueCount > 0 ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-black ${overdueCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
            {overdueCount > 0 ? overdueCount : dueSoonCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {overdueCount > 0 ? "Requires urgent attention" : "Next 72 hours"}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{completedTasksCount}</div>
          <div className="text-[11px] text-slate-500 font-medium">{completionRate}% completion</div>
        </div>
      </div>

      {/* ── Filter Toolbar & View Switcher ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        {/* Top Row: Tabs + View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          {/* Segmented Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
            {[
              { id: "all", label: "All Tasks", count: totalTasksCount },
              { id: "active", label: "To Do / In Progress", count: activeCount },
              { id: "due_soon", label: "Due Soon", count: dueSoonCount },
              { id: "completed", label: "Completed", count: completedTasksCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* View Mode Toggle: List vs Board */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === "board"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Search + Priority Filter + Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search your tasks by title, tag or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-semibold">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer font-medium"
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
              <span className="text-slate-500 text-[11px] font-semibold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer font-medium"
              >
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>

            {/* Reset Filters if active */}
            {(searchQuery || priorityFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPriorityFilter("all");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Task View Content ── */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
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
            <div className="py-12 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeTab === "completed"
                  ? "No completed tasks yet"
                  : activeTab === "due_soon"
                  ? "No tasks due soon"
                  : "All clear! No tasks found"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {[
            { id: "pending", title: "To Do", badgeColor: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300" },
            { id: "in_progress", title: "In Progress", badgeColor: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" },
            { id: "in_review", title: "In Review", badgeColor: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300" },
            { id: "completed", title: "Done", badgeColor: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" },
          ].map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="rounded-2xl p-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 min-h-[480px] flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    {col.title}
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => {
                    const p = PRIORITY_THEME[task.priority] || PRIORITY_THEME.medium;
                    const isDone = task.status === "completed";

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailOpen(true);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md space-y-2.5 ${
                          isDone
                            ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75"
                            : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${p.bg} ${p.text} ${p.border}`}>
                            {p.label}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>

                        <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${isDone ? "line-through text-slate-400" : "text-slate-900 dark:text-white"}`}>
                          {task.title}
                        </h4>

                        {/* Move Status Controls */}
                        <div
                          className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task, e.target.value as any)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
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
                    <div className="flex flex-col items-center justify-center h-28 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
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
        onTaskUpdated={() => fetchMyTasks()}
      />
    </div>
  );
}
