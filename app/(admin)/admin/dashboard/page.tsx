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
import { Badge } from "@/components/ui/badge";
import { useTaskStore } from "@/store/useTaskStore";
import { useRealtimeTasks } from "@/lib/supabase/useRealtimeTasks";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";
import {
  useAutoRefresh,
  AutoRefreshBadge,
} from "@/components/ui/AutoRefreshControl";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-700",
    dot: "bg-slate-400",
  },
  in_progress: {
    label: "In Progress",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    dot: "bg-indigo-500",
  },
  in_review: {
    label: "In Review",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    dot: "bg-emerald-500",
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  low: {
    label: "Low",
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800",
  },
  medium: {
    label: "Medium",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  high: {
    label: "High",
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/40",
  },
  urgent: {
    label: "Urgent",
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/40",
  },
};

// Mini Avatar component
function MiniAvatar({
  name,
  color = "primary",
}: {
  name?: string;
  color?: string;
}) {
  const initial = (name || "U")[0]?.toUpperCase();
  return (
    <span
      title={name}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary/15 text-[10px] font-bold text-primary ring-1 ring-primary/10 dark:border-slate-800"
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
          <UserCheck className="h-3 w-3 flex-shrink-0 text-primary" />
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
  const [greeting, setGreeting] = useState<string>("Welcome");

  const { tasks, setTasks, upsertTask, isConnected } = useTaskStore();
  useRealtimeTasks(orgId || undefined);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, membersRes, dashboardRes] = await Promise.all([
        fetch("/api/v1/tasks").catch(() => null),
        fetch("/api/v1/org/members").catch(() => null),
        fetch("/api/v1/dashboard/admin").catch(() => null),
      ]);

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
  }, [setTasks]);

  // Initial data load on mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const { isRefreshing, triggerManual } = useAutoRefresh(fetchAllData);

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

  const kpiCards = [
    {
      label: "Active Tasks",
      value: liveKpis.activeTasks,
      sub: "In flight across workspace",
      icon: Clock,
      color: "text-primary",
      bg: "from-primary/10 to-primary/5",
      border: "border-primary/15",
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
      color: liveKpis.overdueTasks > 0 ? "text-red-500" : "text-slate-400",
      bg:
        liveKpis.overdueTasks > 0
          ? "from-red-500/10 to-red-500/5"
          : "from-slate-100/80 to-slate-50",
      border:
        liveKpis.overdueTasks > 0
          ? "border-red-500/20"
          : "border-slate-200 dark:border-slate-700",
      valueColor:
        liveKpis.overdueTasks > 0
          ? "text-red-600 dark:text-red-400"
          : "text-slate-900 dark:text-white",
    },
    {
      label: "Completion Rate",
      value: `${liveKpis.completionRate}%`,
      sub: `${liveKpis.completedTasks} completed to date`,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "from-emerald-500/10 to-emerald-500/5",
      border: "border-emerald-500/15",
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
      color: "text-violet-500",
      bg: "from-violet-500/10 to-violet-500/5",
      border: "border-violet-500/15",
      valueColor: "text-slate-900 dark:text-white",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Admin Overview
            </h1>
            {/* Live Status Pill */}
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
              {isConnected ? "Realtime Sync Active" : "Syncing…"}
            </span>
            {cacheStatus === "redis-cache" && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400">
                <Zap className="h-2.5 w-2.5" /> Redis
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time visibility across all managers, employees & tasks
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
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
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    viewMode === mode
                      ? "bg-white text-primary shadow-sm ring-1 ring-primary/10 dark:bg-slate-900"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {labels[mode]}
                </button>
              );
            })}
          </div>

          {/* Manual Refresh */}
          <AutoRefreshBadge
            isRefreshing={isRefreshing || isLoading}
            triggerManual={triggerManual}
          />

          <Link
            href="/admin/team"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Users className="h-3.5 w-3.5 text-primary" />
            Team ({orgMembers.length})
          </Link>

          <button
            type="button"
            onClick={() => setIsTaskModalOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/25 transition-all hover:scale-[1.02] hover:from-primary/90 hover:to-violet-600/90 hover:shadow-lg hover:shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 ${card.bg} border ${card.border} shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50 dark:bg-none`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                  <div
                    className={`mt-2 text-3xl font-extrabold ${card.valueColor}`}
                  >
                    {isLoading ? (
                      <div className="h-8 w-12 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                    ) : (
                      card.value
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {card.sub}
                  </p>
                </div>
                <div
                  className={`rounded-xl bg-white/60 p-2.5 dark:bg-slate-800/60 ${card.color}`}
                >
                  <Icon className="w-4.5 h-4.5 h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 30-Day Chart ── */}
      <ProductivityChart
        data={chartData}
        title="30-Day Workspace Productivity"
        subtitle="Daily task creation & completion velocity trend"
      />

      {/* ── Task Stats Row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["pending", "in_progress", "in_review", "completed"].map((status) => {
          const cfg = STATUS_CONFIG[status];
          const count = tasks.filter((t) => t.status === status).length;
          return (
            <div
              key={status}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 ${
                status === "completed"
                  ? "border-emerald-200/50 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-950/20"
                  : "border-slate-200/80 bg-white dark:border-slate-700/50 dark:bg-slate-800/60"
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
      {viewMode === "kanban" && (
        <KanbanBoard
          initialTasks={tasks}
          orgMembers={orgMembers}
          orgId={orgId}
        />
      )}

      {/* ── Enhanced List View ── */}
      {viewMode === "list" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* List Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
            <div className="flex items-center gap-2.5">
              <List className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                All Workspace Tasks
              </h3>
              <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                {tasks.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition hover:text-primary/80"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </button>
          </div>

          {/* Task Rows */}
          {tasks.length === 0 ? (
            <div className="py-20 text-center">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
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

                return (
                  <div
                    key={task.id}
                    className="group flex flex-col gap-4 px-6 py-4 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40 sm:flex-row sm:items-start"
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
                      <div className="flex flex-wrap items-start gap-2">
                        <p className="text-[13px] font-bold leading-snug text-slate-900 dark:text-white">
                          {task.title}
                        </p>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-0.5 rounded-md border border-red-200/60 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500 dark:border-red-500/20 dark:bg-red-950/30">
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
                            className={`flex items-center gap-1 ${isOverdue ? "font-semibold text-red-500" : ""}`}
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
                          <span className="flex items-center gap-0.5 text-primary/80">
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
                className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
              >
                View Team <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Analytics Placeholder ── */}
      {viewMode === "analytics" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-white">
            Advanced Analytics
          </h3>
          <p className="mx-auto mb-4 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Deep-dive charts, burndown reports, and per-member velocity metrics.
          </p>
          <Link
            href="/admin/analytics-debug"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-primary/90"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Open Analytics <ArrowRight className="h-3 w-3" />
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
