"use client";

import React, { useState, useEffect } from "react";
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
  Users,
} from "lucide-react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { ProductivityChart, type ProductivityDay } from "@/components/dashboard/ProductivityChart";

export default function ManagerDashboardPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "analytics">("kanban");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Aggregated KPI & Chart state
  const [kpis, setKpis] = useState({
    activeTasks: 18,
    overdueTasks: 1,
    completionRate: 92,
    teamVelocityDays: 3.2,
    totalTasks: 34,
    completedTasks: 22,
  });

  const [chartData, setChartData] = useState<ProductivityDay[]>([]);
  const [cacheStatus, setCacheStatus] = useState<string>("live");

  const [tasks, setTasks] = useState<any[]>([
    {
      id: "task-101",
      title: "Review Sprint deliverables & assign code reviews",
      description: "Ensure test coverage and QA acceptance criteria are completed.",
      priority: "high",
      status: "in_progress",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      tags: ["engineering", "review"],
      subtasks: [
        { id: "st-1", title: "Review PR #12", completed: true },
        { id: "st-2", title: "Verify Vitest suite", completed: true },
      ],
      assignees: [{ id: "mem-2", fullName: "Alex Smith (Lead)" }],
    },
    {
      id: "task-102",
      title: "Deploy Redis cluster migration & monitor latency",
      description: "Verify throughput under 500 RPS load test.",
      priority: "urgent",
      status: "pending",
      dueDate: new Date(Date.now() + 172800000).toISOString(),
      tags: ["devops", "performance"],
      subtasks: [],
      assignees: [{ id: "mem-3", fullName: "Rohan Patel (Dev)" }],
    },
    {
      id: "task-103",
      title: "Update API documentation & webhook schema",
      description: "Publish updated OpenAPI spec for client integrations.",
      priority: "medium",
      status: "completed",
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      tags: ["docs"],
      subtasks: [],
      assignees: [{ id: "mem-2", fullName: "Alex Smith (Lead)" }],
    },
  ]);

  const fetchDashboardMetrics = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/v1/dashboard/manager");
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.kpis) setKpis(json.data.kpis);
        if (Array.isArray(json.data.productivityChart)) {
          setChartData(json.data.productivityChart);
        }
        setCacheStatus(res.headers.get("X-Cache") === "HIT" ? "redis-cache" : "live-db");
      }
    } catch {
      // Graceful fallback to initial values
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const handleTaskStatusChange = (taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manager Team Operations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Scoped overview of active team sprints, task velocity, and assignees.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchDashboardMetrics}
            disabled={isLoadingStats}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStats ? "animate-spin text-primary" : ""}`} />
          </button>

          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === "kanban"
                  ? "bg-white text-primary shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === "analytics"
                  ? "bg-white text-primary shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Velocity</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsTaskModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Team Tasks</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.activeTasks}</div>
          <div className="text-[11px] text-slate-500 font-medium">In sprint execution</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Overdue Items</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{kpis.overdueTasks}</div>
          <div className="text-[11px] text-slate-500 font-medium">Require manager review</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Sprint Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{kpis.completionRate}%</div>
          <div className="text-[11px] text-slate-500 font-medium">{kpis.completedTasks} of {kpis.totalTasks} tasks done</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Team Velocity</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.teamVelocityDays}d</div>
          <div className="text-[11px] text-slate-500 font-medium">Avg cycle time</div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "kanban" && (
        <KanbanBoard initialTasks={tasks} />
      )}

      {viewMode === "analytics" && (
        <div className="space-y-6">
          <ProductivityChart data={chartData} />
        </div>
      )}

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <TaskFormModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          availableTasks={tasks}
          onSuccess={(newTask) => {
            if (newTask) setTasks((prev) => [newTask, ...prev]);
            setIsTaskModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
