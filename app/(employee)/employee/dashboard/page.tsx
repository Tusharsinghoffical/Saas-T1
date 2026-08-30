"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";
import { captureEvent } from "@/lib/analytics/posthog";

export default function EmployeeDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<KanbanTaskItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [buckets, setBuckets] = useState<{
    dueToday: KanbanTaskItem[];
    upcoming: KanbanTaskItem[];
    recentlyCompleted: KanbanTaskItem[];
  }>({
    dueToday: [],
    upcoming: [],
    recentlyCompleted: [],
  });

  const fetchMyTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/dashboard/me");
      const json = await res.json();
      if (json.success && json.data) {
        setBuckets(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  // Quick Status Update on Card
  const handleQuickStatusUpdate = async (
    task: KanbanTaskItem,
    newStatus: "pending" | "in_progress" | "in_review" | "completed"
  ) => {
    if (task.status === newStatus) return;

    // Check dependency blocker
    if (newStatus === "in_progress" || newStatus === "completed") {
      const depIds = task.dependencyTaskIds || [];
      // Combine all tasks to check prerequisites
      const allList = [
        ...buckets.dueToday,
        ...buckets.upcoming,
        ...buckets.recentlyCompleted,
      ];
      const blockers = allList.filter(
        (t) => depIds.includes(t.id) && t.status !== "completed"
      );

      if (blockers.length > 0) {
        setToastMessage(
          `⚠️ Cannot set to ${newStatus.replace("_", " ")}: Prerequisite "${blockers[0]?.title}" is not completed.`
        );
        setTimeout(() => setToastMessage(null), 6000);
        return;
      }
    }

    const previousStatus = task.status;
    const updatedTask: KanbanTaskItem = { ...task, status: newStatus };

    // Optimistic re-bucketing
    setBuckets((prev) => {
      // Remove from all buckets
      const filterOut = (list: KanbanTaskItem[]) =>
        list.filter((t) => t.id !== task.id);

      const dueToday = filterOut(prev.dueToday);
      const upcoming = filterOut(prev.upcoming);
      const recentlyCompleted = filterOut(prev.recentlyCompleted);

      if (newStatus === "completed") {
        return {
          dueToday,
          upcoming,
          recentlyCompleted: [updatedTask, ...recentlyCompleted],
        };
      } else {
        // Re-insert into dueToday or upcoming
        const dueTime = task.dueDate || task.due_date;
        const isToday =
          dueTime &&
          new Date(dueTime).toDateString() === new Date().toDateString();

        if (isToday) {
          return {
            dueToday: [updatedTask, ...dueToday],
            upcoming,
            recentlyCompleted,
          };
        } else {
          return {
            dueToday,
            upcoming: [updatedTask, ...upcoming],
            recentlyCompleted,
          };
        }
      }
    });

    // Fire analytics events
    captureEvent("task_status_changed", {
      taskId: task.id,
      oldStatus: previousStatus,
      newStatus,
    });

    if (newStatus === "completed") {
      captureEvent("task_completed", {
        taskId: task.id,
        priority: task.priority,
      });
    }

    // API PATCH call
    try {
      const res = await fetch(`/api/v1/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) {
        setToastMessage(json.error || "Failed to update status.");
        fetchMyTasks(); // rollback on error
      }
    } catch {
      setToastMessage("Network error: Status update failed.");
      fetchMyTasks();
    }
  };

  const priorityVariants: Record<string, "default" | "urgent" | "warning"> = {
    low: "default",
    medium: "default",
    high: "warning",
    urgent: "urgent",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
    in_progress: "bg-primary/10 text-primary border-primary/20",
    in_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    completed: "bg-success/10 text-success border-success/20",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    in_review: "In Review",
    completed: "Completed",
  };

  const allEmployeeTasks = [
    ...buckets.dueToday,
    ...buckets.upcoming,
    ...buckets.recentlyCompleted,
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-urgent/10 border border-urgent/20 text-xs text-urgent font-medium flex items-center justify-between animate-fade-in">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-urgent font-bold hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your personal queue organized by deadline and focus priority.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMyTasks}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Section 1: Due Today */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            <Clock className="w-4 h-4 text-primary" />
            <span>Due Today</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
              {buckets.dueToday.length}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {buckets.dueToday.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onCardClick={() => {
                setSelectedTask(task);
                setIsDetailOpen(true);
              }}
              onStatusChange={(status) => handleQuickStatusUpdate(task, status)}
              priorityVariants={priorityVariants}
              statusColors={statusColors}
              statusLabels={statusLabels}
            />
          ))}

          {buckets.dueToday.length === 0 && (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              🎉 All tasks due today are cleared! Great job.
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Upcoming (7 Days) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Upcoming (Next 7 Days)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {buckets.upcoming.length}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {buckets.upcoming.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onCardClick={() => {
                setSelectedTask(task);
                setIsDetailOpen(true);
              }}
              onStatusChange={(status) => handleQuickStatusUpdate(task, status)}
              priorityVariants={priorityVariants}
              statusColors={statusColors}
              statusLabels={statusLabels}
            />
          ))}

          {buckets.upcoming.length === 0 && (
            <div className="p-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              No upcoming tasks scheduled for the next 7 days.
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Recently Completed */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>Recently Completed</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success">
              {buckets.recentlyCompleted.length}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {buckets.recentlyCompleted.map((task) => (
            <div
              key={task.id}
              onClick={() => {
                setSelectedTask(task);
                setIsDetailOpen(true);
              }}
              className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 text-xs opacity-75 hover:opacity-100 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                <span className="line-through text-slate-500 dark:text-slate-400 font-medium">
                  {task.title}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                Completed
              </span>
            </div>
          ))}

          {buckets.recentlyCompleted.length === 0 && (
            <div className="p-4 rounded-xl text-center text-xs text-slate-400">
              No tasks completed in the last 7 days yet.
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetail
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        allTasks={allEmployeeTasks}
      />
    </div>
  );
}

interface TaskListItemProps {
  task: KanbanTaskItem;
  onCardClick: () => void;
  onStatusChange: (status: "pending" | "in_progress" | "in_review" | "completed") => void;
  priorityVariants: Record<string, "default" | "urgent" | "warning">;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
}

function TaskListItem({
  task,
  onCardClick,
  onStatusChange,
  priorityVariants,
  statusColors,
  statusLabels,
}: TaskListItemProps) {
  const rawDueDate = task.dueDate || task.due_date;
  const isOverdue =
    rawDueDate &&
    task.status !== "completed" &&
    new Date(rawDueDate).getTime() < Date.now();

  const isCompleted = task.status === "completed";

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
      {/* 1-Click Quick Complete Circle Button */}
      <div className="flex items-start sm:items-center gap-3.5 flex-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(isCompleted ? "in_progress" : "completed");
          }}
          title={isCompleted ? "Mark as in progress" : "Mark as completed"}
          className={`mt-0.5 sm:mt-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150 flex-shrink-0 active:scale-90 ${
            isCompleted
              ? "bg-success border-success text-white"
              : "border-slate-300 dark:border-slate-600 hover:border-success text-transparent hover:text-success/40"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 fill-current" />
        </button>

        {/* Task Info (Clickable for detail modal) */}
        <div
          onClick={onCardClick}
          className="flex-1 cursor-pointer space-y-1 select-none"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={priorityVariants[task.priority] || "default"}>
              {task.priority}
            </Badge>

            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-urgent bg-urgent/10 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                Overdue
              </span>
            )}

            {task.tags?.map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium"
              >
                #{t}
              </span>
            ))}
          </div>

          <h4
            className={`text-sm font-semibold transition-colors duration-150 ${
              isCompleted
                ? "line-through text-slate-400 dark:text-slate-500"
                : "text-slate-900 dark:text-slate-100 group-hover:text-primary"
            }`}
          >
            {task.title}
          </h4>

          {rawDueDate && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" />
              <span>
                Due:{" "}
                {new Date(rawDueDate).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Status Dropdown Action */}
      <div
        className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pl-9 sm:pl-0"
        onClick={(e) => e.stopPropagation()}
      >
        <select
          value={task.status}
          onChange={(e) =>
            onStatusChange(
              e.target.value as "pending" | "in_progress" | "in_review" | "completed"
            )
          }
          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer ${
            statusColors[task.status] || "bg-slate-100 text-slate-700"
          }`}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed ✓</option>
        </select>
      </div>
    </div>
  );
}
