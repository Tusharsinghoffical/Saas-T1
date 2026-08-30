"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  BarChart3,
  RefreshCw,
  Zap,
} from "lucide-react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { ProductivityChart, type ProductivityDay } from "@/components/dashboard/ProductivityChart";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "analytics">("kanban");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Aggregated KPI & Chart state
  const [kpis, setKpis] = useState({
    activeTasks: 24,
    overdueTasks: 2,
    completionRate: 88,
    teamVelocityDays: 3.8,
    totalTasks: 42,
    completedTasks: 24,
  });

  const [chartData, setChartData] = useState<ProductivityDay[]>([]);
  const [cacheStatus, setCacheStatus] = useState<string>("live");

  const [tasks, setTasks] = useState<any[]>([
    {
      id: "task-1",
      title: "Set up company workspace & review OKRs",
      description: "Finalize Google Stitch design tokens and responsive grid layout.",
      priority: "high",
      status: "in_progress",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      tags: ["setup", "okr"],
      subtasks: [
        { id: "st-1", title: "Review with PM", completed: true },
        { id: "st-2", title: "Assign team members", completed: false },
      ],
      assignees: [{ id: "mem-1", fullName: "Jane Doe" }],
    },
    {
      id: "task-2",
      title: "Implement Postgres RLS policy test suite",
      description: "Verify cross-tenant isolation between Org A and Org B.",
      priority: "urgent",
      status: "pending",
      dueDate: new Date(Date.now() + 172800000).toISOString(),
      tags: ["security", "supabase"],
      subtasks: [{ id: "st-3", title: "Write Vitest assertions", completed: false }],
      assignees: [{ id: "mem-2", fullName: "Alex Smith" }],
    },
    {
      id: "task-3",
      title: "Set up Upstash Redis rate limiting bucket",
      description: "Configure 100 req/min per user and 30 AI calls/hour limit.",
      priority: "medium",
      status: "in_review",
      dueDate: new Date(Date.now() + 259200000).toISOString(),
      tags: ["redis", "backend"],
      assignees: [{ id: "mem-3", fullName: "Rohan Patel" }],
    },
    {
      id: "task-4",
      title: "Configure Next.js 14 App Router layout & fonts",
      description: "Zero AWS dependencies verified with Inter typography.",
      priority: "low",
      status: "completed",
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      tags: ["nextjs"],
      subtasks: [{ id: "st-4", title: "Clean repo", completed: true }],
      assignees: [{ id: "mem-1", fullName: "Jane Doe" }],
    },
  ]);

  const fetchDashboardMetrics = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/v1/dashboard/admin");
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.kpis) setKpis(json.data.kpis);
        if (Array.isArray(json.data.productivityChart)) {
          setChartData(json.data.productivityChart);
        }
        setCacheStatus(res.headers.get("X-Cache") === "HIT" ? "redis-cache" : "live-db");
      }
    } catch {
      // Ignore network error in fallback demo mode
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const handleTaskCreated = (newTask: any) => {
    setTasks((prev) => [newTask, ...prev]);
    fetchDashboardMetrics();
  };

  const priorityBadges: Record<string, "default" | "urgent" | "warning"> = {
    low: "default",
    medium: "default",
    high: "warning",
    urgent: "urgent",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    in_review: "In Review",
    completed: "Completed",
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Admin Overview
            </h1>
            {cacheStatus === "redis-cache" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Zap className="w-2.5 h-2.5" /> Redis Cached (60s)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time multi-tenant health, team velocity, and task distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "analytics"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchDashboardMetrics}
            title="Refresh metrics"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? "animate-spin text-primary" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsTaskModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-700 text-white text-xs font-semibold shadow-sm shadow-primary/25 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Tasks</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {kpis.activeTasks}
          </div>
          <div className="mt-1 text-xs text-slate-500">In flight across workspace</div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-urgent">Overdue Tasks</span>
            <AlertTriangle className="w-4 h-4 text-urgent" />
          </div>
          <div className={`mt-3 text-3xl font-extrabold ${kpis.overdueTasks > 0 ? "text-urgent" : "text-slate-900 dark:text-white"}`}>
            {kpis.overdueTasks}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {kpis.overdueTasks > 0 ? "Requires urgent attention" : "All tasks on schedule"}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-success">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {kpis.completionRate}%
          </div>
          <div className="mt-1 text-xs text-success flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {kpis.completedTasks} completed to date
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Team Productivity</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {kpis.teamVelocityDays}d
          </div>
          <div className="mt-1 text-xs text-slate-500">Avg completion time</div>
        </div>
      </div>

      {/* 30-Day Productivity Chart */}
      <ProductivityChart
        data={chartData}
        title="30-Day Workspace Productivity"
        subtitle="Daily task completion trend cached in Upstash Redis"
      />

      {/* Main Views: Kanban Board vs Task List vs Analytics Details */}
      {viewMode === "kanban" && <KanbanBoard initialTasks={tasks} />}

      {viewMode === "list" && (
        <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Active Workspace Tasks ({tasks.length})
            </h3>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="text-xs font-semibold text-primary hover:text-primary-700"
            >
              + Quick Add
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-750">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="py-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {task.title}
                    </div>
                    {task.dueDate && (
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={priorityBadges[task.priority] || "default"}>
                    {task.priority}
                  </Badge>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    {statusLabels[task.status] || task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Creation & Edit Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        availableTasks={tasks}
        onSuccess={handleTaskCreated}
      />
    </div>
  );
}
