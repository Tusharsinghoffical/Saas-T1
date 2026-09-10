"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  BarChart3,
  RefreshCw,
  Zap,
  Radio,
  Users,
  ArrowRight,
  UserCheck,
  UserCircle,
  Calendar,
  Hash,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Briefcase,
  Play,
  Eye,
  Layers,
} from "lucide-react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import {
  TaskFormModal,
  type OrgMember,
} from "@/components/tasks/TaskFormModal";
import {
  ProductivityChart,
  type ProductivityDay,
} from "@/components/dashboard/ProductivityChart";
import { useTaskStore } from "@/store/useTaskStore";
import { useRealtimeTasks } from "@/lib/supabase/useRealtimeTasks";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";
import {
  useAutoRefresh,
  AutoRefreshBadge,
} from "@/components/ui/AutoRefreshControl";
import { formatTaskDisplay } from "@/lib/utils/taskFormatter";
import {
  KanbanBoardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800",
    dot: "bg-slate-400",
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    dot: "bg-blue-500",
  },
  in_review: {
    label: "In Review",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    dot: "bg-purple-500",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    dot: "bg-emerald-500",
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  low: {
    label: "Low",
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800",
    dot: "bg-slate-400",
  },
  medium: {
    label: "Medium",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    dot: "bg-blue-500",
  },
  high: {
    label: "High",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    dot: "bg-amber-500",
  },
  urgent: {
    label: "Urgent",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    dot: "bg-rose-500",
  },
};

// Mini Avatar component
function MiniAvatar({
  name,
}: {
  name?: string;
}) {
  const initial = (name || "U")[0]?.toUpperCase();
  return (
    <span
      title={name}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-indigo-500/20 text-[10px] font-bold text-indigo-600 ring-1 ring-indigo-500/10 dark:border-slate-800 dark:bg-indigo-500/30 dark:text-indigo-300"
    >
      {initial}
    </span>
  );
}

// Assignee + Creator attribution row
function TaskAttribution({
  assignees,
  createdBy,
  orgMembers,
}: {
  assignees?: any[];
  createdBy?: string;
  orgMembers: OrgMember[];
}) {
  const creatorMember = orgMembers.find((m) => m.id === createdBy);
  const creatorName =
    creatorMember?.fullName ||
    (createdBy ? `User ${createdBy.slice(0, 6)}` : null);

  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px]">
      {/* Assignees */}
      {assignees && assignees.length > 0 ? (
        <div className="flex items-center gap-1.5">
          <UserCheck className="h-3 w-3 flex-shrink-0 text-indigo-500" />
          <div className="flex -space-x-1.5">
            {assignees.slice(0, 4).map((a: any, idx: number) => (
              <MiniAvatar key={a.id || idx} name={a.fullName || a.full_name} />
            ))}
          </div>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {assignees.length === 1
              ? assignees[0].fullName || assignees[0].full_name || "Assignee"
              : `${assignees.length} assignees`}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-slate-400">
          <UserCheck className="h-3 w-3" />
          <span>Unassigned</span>
        </div>
      )}

      {/* Creator / Given by */}
      {creatorName && (
        <>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <UserCircle className="h-3 w-3 flex-shrink-0" />
            <span>
              by{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {creatorName}
              </span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "analytics">(
    "kanban"
  );
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [chartData, setChartData] = useState<ProductivityDay[]>([]);
  const [cacheStatus, setCacheStatus] = useState<string>("live");
  const [copiedId, setCopiedId] = useState(false);
  const [adminCode, setAdminCode] = useState("EMP-96973D");

  const { tasks, setTasks, upsertTask, isConnected } = useTaskStore();
  useRealtimeTasks(orgId || undefined);

  const [greeting, setGreeting] = useState<{
    text: string;
    sub: string;
  }>({
    text: "Good Afternoon",
    sub: "Organization Administrator",
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12)
      setGreeting({ text: "Good Morning", sub: "Organization Administrator" });
    else if (hour < 17)
      setGreeting({ text: "Good Afternoon", sub: "Organization Administrator" });
    else
      setGreeting({ text: "Good Evening", sub: "Organization Administrator" });
  }, []);

  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent && tasks.length === 0) {
      setIsLoading(true);
    }
    try {
      const [tasksRes, membersRes, dashboardRes, profileRes] = await Promise.all([
        fetch("/api/v1/tasks").catch(() => null),
        fetch("/api/v1/org/members").catch(() => null),
        fetch("/api/v1/dashboard/admin").catch(() => null),
        fetch("/api/v1/user/profile").catch(() => null),
      ]);

      if (profileRes && profileRes.ok) {
        const profJson = await profileRes.json();
        if (profJson.success && profJson.data?.employeeCode) {
          setAdminCode(profJson.data.employeeCode);
        }
      }

      if (tasksRes && tasksRes.ok) {
        const tasksJson = await tasksRes.json();
        if (tasksJson.success && Array.isArray(tasksJson.data)) {
          const formattedTasks: KanbanTaskItem[] = tasksJson.data.map(
            (t: any) => ({
              id: t.id,
              title: t.title,
              description: t.description || "",
              status: t.status || "pending",
              priority: t.priority || "medium",
              dueDate: t.due_date || t.dueDate,
              due_date: t.due_date,
              tags: t.tags || [],
              subtasks: t.subtasks || [],
              assignees: t.assignees || [],
              createdBy: t.createdBy || t.created_by,
              org_id: t.org_id,
            })
          );
          setTasks(formattedTasks);
          if (tasksJson.data[0]?.org_id) setOrgId(tasksJson.data[0].org_id);
        }
      }

      if (membersRes && membersRes.ok) {
        const membersJson = await membersRes.json();
        if (membersJson.success && Array.isArray(membersJson.data)) {
          const mappedMembers: OrgMember[] = membersJson.data.map((m: any) => ({
            id: m.id || m.user_id,
            fullName: m.full_name || m.name || m.email || "Team Member",
            role: m.role || "employee",
            avatarUrl: m.avatar_url || null,
          }));
          setOrgMembers(mappedMembers);
        }
      }

      if (dashboardRes && dashboardRes.ok) {
        const dashJson = await dashboardRes.json();
        if (dashJson.success && dashJson.data) {
          if (Array.isArray(dashJson.data.productivityChart)) {
            setChartData(dashJson.data.productivityChart);
          }
          setCacheStatus(
            dashboardRes.headers.get("X-Cache") === "HIT"
              ? "redis-cache"
              : "live-db"
          );
        }
      }
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, [setTasks, tasks.length]);

  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  const { isRefreshing, triggerManual } = useAutoRefresh(() =>
    fetchAllData(false)
  );

  const nowMs = Date.now();
  const liveKpis = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter((t) =>
      ["pending", "in_progress", "in_review"].includes(t.status)
    ).length;
    const overdue = tasks.filter((t) => {
      if (t.status === "completed") return false;
      const due = t.due_date || t.dueDate;
      return due ? new Date(due).getTime() < nowMs : false;
    }).length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      activeTasks: active,
      overdueTasks: overdue,
      completedTasks: completed,
      totalTasks: total,
      completionRate: rate,
      teamVelocityDays: completed > 0 ? 2.4 : 0,
    };
  }, [tasks, nowMs]);

  const handleTaskCreated = (newTask: any) => upsertTask(newTask);

  const copyAdminCode = () => {
    navigator.clipboard.writeText(adminCode);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const kpiCards = [
    {
      label: "Active Tasks",
      value: liveKpis.activeTasks,
      sub: "In flight across workspace",
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-500/10 dark:bg-blue-500/15",
      border: "border-blue-500/20",
      valueColor: "text-slate-900 dark:text-white",
    },
    {
      label: "Overdue Tasks",
      value: liveKpis.overdueTasks,
      sub:
        liveKpis.overdueTasks > 0
          ? "Requires urgent attention"
          : "All tasks on schedule",
      icon: AlertTriangle,
      color: liveKpis.overdueTasks > 0 ? "text-rose-500" : "text-slate-400",
      bg:
        liveKpis.overdueTasks > 0
          ? "bg-rose-500/15"
          : "bg-slate-100 dark:bg-slate-800/80",
      border:
        liveKpis.overdueTasks > 0
          ? "border-rose-500/40"
          : "border-slate-200 dark:border-slate-800",
      valueColor:
        liveKpis.overdueTasks > 0
          ? "text-rose-600 dark:text-rose-400"
          : "text-slate-900 dark:text-white",
    },
    {
      label: "Completion Rate",
      value: `${liveKpis.completionRate}%`,
      sub: `${liveKpis.completedTasks} completed to date`,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      border: "border-emerald-500/20",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Team Velocity",
      value:
        liveKpis.teamVelocityDays > 0 ? `${liveKpis.teamVelocityDays}d` : "N/A",
      sub:
        liveKpis.completedTasks > 0
          ? "Avg completion velocity"
          : "Awaiting first task",
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-500/10 dark:bg-purple-500/15",
      border: "border-purple-500/20",
      valueColor: "text-slate-900 dark:text-white",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ── 🚀 Executive Admin Command Banner ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-7">
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          {/* Left Title & Identity */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-indigo-200 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>{greeting.text}</span>
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                <ShieldCheck className="h-3 w-3" />
                Organization Admin
              </span>

              {/* Realtime Status Beacon */}
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
                  {isConnected ? "Realtime Sync Active" : "Connecting..."}
                </span>
              </span>

              {cacheStatus === "redis-cache" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  <Zap className="h-2.5 w-2.5" /> Redis Cached
                </span>
              )}
            </div>

            {/* Main Headline */}
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Admin Overview
              </h1>
              <p className="mt-0.5 text-xs text-indigo-200/80 sm:text-sm">
                Real-time visibility across all managers, employees, and sprint
                executions
              </p>
            </div>

            {/* Quick Identifier Chips */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              <button
                type="button"
                onClick={copyAdminCode}
                title="Click to copy Admin ID"
                className="group inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 font-mono text-[11px] font-bold text-indigo-200 transition hover:bg-white/15 hover:text-white"
              >
                <Hash className="h-3 w-3 text-indigo-400" />
                <span>ID: {adminCode}</span>
                {copiedId ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-indigo-300 opacity-70 transition group-hover:text-white" />
                )}
              </button>

              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-200">
                <Briefcase className="h-3 w-3 text-amber-400" />
                <span>Workspace Scope: Global</span>
              </span>
            </div>
          </div>

          {/* Right Controls: View Mode + AutoRefresh + Actions */}
          <div className="flex flex-wrap items-center gap-2.5 lg:flex-col lg:items-end">
            {/* Top row: View switcher */}
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs font-semibold backdrop-blur-md">
              {(["kanban", "list", "analytics"] as const).map((mode) => {
                const icons = {
                  kanban: LayoutGrid,
                  list: List,
                  analytics: BarChart3,
                };
                const labels = {
                  kanban: "Kanban",
                  list: "List",
                  analytics: "Analytics",
                };
                const Icon = icons[mode];
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                      viewMode === mode
                        ? "bg-white font-bold text-slate-900 shadow-md"
                        : "text-indigo-200 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{labels[mode]}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom row: AutoRefresh + Team + New Task */}
            <div className="flex flex-wrap items-center gap-2">
              <AutoRefreshBadge
                isRefreshing={isRefreshing || isLoading}
                triggerManual={triggerManual}
              />

              <Link
                href="/admin/team"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-white/15 hover:text-white"
              >
                <Users className="h-3.5 w-3.5 text-indigo-400" />
                <span>Team ({orgMembers.length})</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsTaskModalOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-400 hover:to-indigo-500"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>New Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`group space-y-1 rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                card.border
              } ${card.label === "Overdue Tasks" && liveKpis.overdueTasks > 0 ? "bg-rose-500/5 dark:bg-rose-500/10" : "bg-white dark:bg-slate-900/90"}`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>{card.label}</span>
                <div className={`rounded-lg p-1.5 ${card.bg} ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className={`text-2xl font-black sm:text-3xl ${card.valueColor}`}>
                {isLoading ? (
                  <div className="h-8 w-12 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                ) : (
                  card.value
                )}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 30-Day Workspace Productivity Trend Chart ── */}
      {isLoading && chartData.length === 0 ? (
        <ChartSkeleton title="30-Day Workspace Productivity" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <ProductivityChart
            data={chartData}
            title="30-Day Workspace Productivity"
            subtitle="Daily task creation & completion velocity trend"
          />
        </div>
      )}

      {/* ── Task Status Swimlane Summary Bar ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["pending", "in_progress", "in_review", "completed"].map((status) => {
          const cfg = STATUS_CONFIG[status];
          const count = tasks.filter((t) => t.status === status).length;
          return (
            <div
              key={status}
              className={`flex items-center gap-3 rounded-2xl border p-3.5 shadow-sm ${
                status === "completed"
                  ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${cfg.dot}`}
              />
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {count}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {cfg.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Kanban View ── */}
      {viewMode === "kanban" &&
        (isLoading && tasks.length === 0 ? (
          <KanbanBoardSkeleton />
        ) : (
          <KanbanBoard
            initialTasks={tasks}
            orgMembers={orgMembers}
            orgId={orgId}
          />
        ))}

      {/* ── Enhanced Linear List View ── */}
      {viewMode === "list" &&
        (isLoading && tasks.length === 0 ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          {/* List Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
            <div className="flex items-center gap-2.5">
              <List className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                All Workspace Tasks
              </h3>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                {tasks.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </button>
          </div>

          {/* Task Rows */}
          {tasks.length === 0 ? (
            <div className="py-20 text-center">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-400">
                No tasks yet. Create the first one!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map((task, idx) => {
                const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                const pc =
                  PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const dueDate = task.due_date || task.dueDate;
                const isOverdue =
                  dueDate &&
                  task.status !== "completed" &&
                  new Date(dueDate).getTime() < nowMs;

                const { title: cleanTitle, isAiEnhanced } = formatTaskDisplay(
                  task.title,
                  task.description
                );

                return (
                  <div
                    key={task.id}
                    className="group flex flex-col gap-4 px-6 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/40 sm:flex-row sm:items-start"
                  >
                    {/* Row Index + Status Dot */}
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <span className="w-5 text-right font-mono text-[11px] text-slate-300 dark:text-slate-600">
                        {idx + 1}
                      </span>
                      <span
                        className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${sc.dot}`}
                      />
                    </div>

                    {/* Task Body */}
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Title */}
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-bold leading-snug text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                          {cleanTitle}
                        </p>
                        {isAiEnhanced && (
                          <span className="inline-flex items-center gap-1 rounded border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                            <Sparkles className="h-2.5 w-2.5" /> AI
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-0.5 rounded-md border border-rose-200/60 bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-500 dark:border-rose-500/20 dark:bg-rose-950/30">
                            <AlertTriangle className="h-2.5 w-2.5" /> Overdue
                          </span>
                        )}
                      </div>

                      {/* Assignee + Creator Attribution */}
                      <TaskAttribution
                        assignees={(task as any).assignees}
                        createdBy={
                          (task as any).createdBy || (task as any).created_by
                        }
                        orgMembers={orgMembers}
                      />

                      {/* Meta Row */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                        {dueDate && (
                          <span
                            className={`flex items-center gap-1 ${
                              isOverdue ? "font-semibold text-rose-500" : ""
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            Due{" "}
                            {new Date(dueDate).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <span className="flex items-center gap-0.5 text-indigo-500">
                            <Hash className="h-2.5 w-2.5" />
                            {task.tags.join(" · ")}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-300 dark:text-slate-700">
                          {task.id?.slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    {/* Right Badges */}
                    <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap">
                      {/* Priority */}
                      <span
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${pc.color} ${pc.bg}`}
                      >
                        {pc.label}
                      </span>
                      {/* Status */}
                      <span
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${sc.color} ${sc.bg}`}
                      >
                        {sc.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {tasks.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/20">
              <span className="text-[11px] text-slate-400">
                Showing all {tasks.length} tasks · {liveKpis.completedTasks}{" "}
                completed
              </span>
              <Link
                href="/admin/team"
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View Team <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      ))}

      {/* ── Advanced Analytics View ── */}
      {viewMode === "analytics" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-white">
            Advanced Analytics & Observability
          </h3>
          <p className="mx-auto mb-5 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Deep-dive into live event streams, burndown reports, and PostHog
            client-side telemetry.
          </p>
          <Link
            href="/admin/analytics-debug"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Open PostHog Analytics Debugger <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Task Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        availableTasks={tasks}
        orgMembers={orgMembers}
        onSuccess={handleTaskCreated}
      />
    </div>
  );
}
