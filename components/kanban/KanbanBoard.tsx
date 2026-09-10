"use client";

import React, { useState, useMemo, useEffect } from "react";
import { TaskCard, type KanbanTaskItem } from "@/components/tasks/TaskCard";
import {
  TaskFormModal,
  type OrgMember,
} from "@/components/tasks/TaskFormModal";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTaskStore } from "@/store/useTaskStore";
import {
  useRealtimeTasks,
  broadcastTaskChange,
} from "@/lib/supabase/useRealtimeTasks";
import { captureEvent } from "@/lib/analytics/posthog";
import {
  Plus,
  Search,
  Filter,
  RotateCcw,
  AlertCircle,
  Radio,
  X,
} from "lucide-react";

export type KanbanColumnId =
  "pending" | "in_progress" | "in_review" | "completed";

export interface KanbanColumn {
  id: KanbanColumnId;
  title: string;
  badgeColor: string;
  accentBorder: string;
  dotColor: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "pending",
    title: "Pending",
    badgeColor:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    accentBorder: "border-t-2 border-t-slate-400 dark:border-t-slate-500",
    dotColor: "bg-slate-400",
  },
  {
    id: "in_progress",
    title: "In Progress",
    badgeColor:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    accentBorder: "border-t-2 border-t-blue-500",
    dotColor: "bg-blue-500",
  },
  {
    id: "in_review",
    title: "In Review",
    badgeColor:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    accentBorder: "border-t-2 border-t-purple-500",
    dotColor: "bg-purple-500",
  },
  {
    id: "completed",
    title: "Completed",
    badgeColor:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    accentBorder: "border-t-2 border-t-emerald-500",
    dotColor: "bg-emerald-500",
  },
];

export interface KanbanBoardProps {
  initialTasks?: KanbanTaskItem[];
  orgMembers?: OrgMember[];
  orgId?: string;
  onTaskUpdated?: (task: KanbanTaskItem) => void;
}

export function KanbanBoard({
  initialTasks,
  orgMembers = [
    { id: "mem-1", fullName: "Jane Doe (Admin)", role: "admin" },
    { id: "mem-2", fullName: "Alex Smith (Lead)", role: "manager" },
    { id: "mem-3", fullName: "Rohan Patel (Dev)", role: "employee" },
  ],
  orgId = "11111111-1111-1111-1111-111111111111",
  onTaskUpdated,
}: KanbanBoardProps) {
  // Global Zustand Task Store
  const {
    tasks,
    setTasks,
    upsertTask,
    removeTask,
    updateTaskStatusOptimistic,
    isConnected,
  } = useTaskStore();

  const [membersList, setMembersList] = useState<OrgMember[]>(orgMembers || []);

  // Activate Realtime Sync
  useRealtimeTasks(orgId);

  // Initialize store when database tasks are fetched
  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      setTasks(initialTasks);
    }
  }, [initialTasks, setTasks]);

  // Dynamically load live members from database
  useEffect(() => {
    fetch("/api/v1/org/members")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setMembersList(
            json.data.map((m: any) => ({
              id: m.id || m.user_id,
              fullName:
                m.fullName || m.full_name || m.name || m.email || "Team Member",
              role: m.role || "employee",
              avatarUrl: m.avatarUrl || m.avatar_url || null,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnId | null>(
    null
  );
  const [toastError, setToastError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTaskItem | null>(null);
  const [defaultColumnForNewTask, setDefaultColumnForNewTask] =
    useState<KanbanColumnId>("pending");

  // Task Detail & Comments Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailTask, setSelectedDetailTask] =
    useState<KanbanTaskItem | null>(null);

  // Filter Bar State
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");

  // Extract all unique tags across tasks
  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags?.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [tasks]);

  // Client-side Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search across Title, Description, and Assignee Name / ID
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesAssignee =
          task.assignees?.some(
            (a: any) =>
              (a.fullName && a.fullName.toLowerCase().includes(q)) ||
              (a.full_name && a.full_name.toLowerCase().includes(q)) ||
              (a.id && a.id.toLowerCase().includes(q))
          ) ||
          task.task_assignees?.some(
            (a: any) =>
              (a.profiles?.full_name &&
                a.profiles.full_name.toLowerCase().includes(q)) ||
              (a.user_id && a.user_id.toLowerCase().includes(q))
          );
        if (!matchesTitle && !matchesDesc && !matchesAssignee) return false;
      }

      // Priority
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      // Assignee
      if (assigneeFilter !== "all") {
        const hasAssignee =
          task.assignees?.some((a) => a.id === assigneeFilter) ||
          task.task_assignees?.some((a) => a.user_id === assigneeFilter);
        if (!hasAssignee) return false;
      }

      // Tag
      if (tagFilter !== "all") {
        if (!task.tags?.includes(tagFilter)) return false;
      }

      // Due Date Range
      if (dueDateFilter !== "all") {
        const d = task.dueDate || task.due_date;
        if (!d) return false;
        const taskTime = new Date(d).getTime();
        const now = Date.now();
        const oneDay = 86400000;

        if (dueDateFilter === "overdue") {
          if (task.status === "completed" || taskTime >= now) return false;
        } else if (dueDateFilter === "today") {
          const isToday =
            new Date(d).toDateString() === new Date().toDateString();
          if (!isToday) return false;
        } else if (dueDateFilter === "week") {
          if (taskTime < now || taskTime > now + oneDay * 7) return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    priorityFilter,
    assigneeFilter,
    tagFilter,
    dueDateFilter,
  ]);

  const hasActiveFilters =
    searchQuery ||
    priorityFilter !== "all" ||
    assigneeFilter !== "all" ||
    tagFilter !== "all" ||
    dueDateFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
    setAssigneeFilter("all");
    setTagFilter("all");
    setDueDateFilter("all");
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: KanbanColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetColumn: KanbanColumnId
  ) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;

    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.status === targetColumn) return;

    // Dependency Blocking Validation: Cannot move to in_progress or completed if dependencies are incomplete
    if (targetColumn === "in_progress" || targetColumn === "completed") {
      const depIds = taskToMove.dependencyTaskIds || [];
      const incompletePrereqs = tasks.filter(
        (t) => depIds.includes(t.id) && t.status !== "completed"
      );

      if (incompletePrereqs.length > 0) {
        const blockerNames = incompletePrereqs
          .map((p) => `"${p.title}"`)
          .join(", ");
        setToastError(
          `⚠️ Move Blocked: "${taskToMove.title}" cannot be moved to ${
            targetColumn === "in_progress" ? "In Progress" : "Completed"
          } until prerequisite task(s) ${blockerNames} are Completed.`
        );
        setTimeout(() => setToastError(null), 7000);
        return;
      }
    }

    const previousStatus = taskToMove.status;

    // 1. Optimistic update in Zustand store
    updateTaskStatusOptimistic(taskId, targetColumn);
    broadcastTaskChange(orgId, "UPSERT_TASK", {
      ...taskToMove,
      status: targetColumn,
    });

    if (onTaskUpdated) {
      onTaskUpdated({ ...taskToMove, status: targetColumn });
    }

    // 2. Fire custom analytics events
    captureEvent("task_status_changed", {
      taskId,
      oldStatus: previousStatus,
      newStatus: targetColumn,
    });

    if (targetColumn === "completed") {
      captureEvent("task_completed", {
        taskId,
        priority: taskToMove.priority,
      });
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tasq:activity_updated"));
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("tasq-activity-channel");
        bc.postMessage({ type: "ACTIVITY_UPDATED" });
        bc.close();
      }
    }

    // 3. Persist to API via PATCH
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetColumn }),
      });

      const json = await res.json();
      if (!json.success) {
        // Rollback optimistic update on failure
        updateTaskStatusOptimistic(taskId, previousStatus);
        setToastError(json.error || "Failed to update task status.");
        setTimeout(() => setToastError(null), 5000);
      }
    } catch {
      // Rollback on network error
      updateTaskStatusOptimistic(taskId, previousStatus);
      setToastError("Network error: Status change could not be saved.");
      setTimeout(() => setToastError(null), 5000);
    }
  };

  const handleOpenCreateModal = (colId: KanbanColumnId = "pending") => {
    setDefaultColumnForNewTask(colId);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: KanbanTaskItem) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleTaskSaved = (savedTask: KanbanTaskItem) => {
    upsertTask(savedTask);
    broadcastTaskChange(orgId, "UPSERT_TASK", savedTask);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tasq:activity_updated"));
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("tasq-activity-channel");
        bc.postMessage({ type: "ACTIVITY_UPDATED" });
        bc.close();
      }
    }
  };

  const handleTaskDeleted = (deletedTaskId: string) => {
    removeTask(deletedTaskId);
    broadcastTaskChange(orgId, "REMOVE_TASK", { id: deletedTaskId });
    setIsDetailModalOpen(false);
    setSelectedDetailTask(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tasq:activity_updated"));
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("tasq-activity-channel");
        bc.postMessage({ type: "ACTIVITY_UPDATED" });
        bc.close();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Error Alert */}
      {toastError && (
        <div className="animate-fade-in flex items-center justify-between rounded-xl border border-urgent/20 bg-urgent/10 p-3.5 text-xs font-medium text-urgent">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{toastError}</span>
          </div>
          <button
            onClick={() => setToastError(null)}
            className="font-bold text-urgent hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar & Live Sync Status */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks by title or keywords..."
              className="h-9 pl-10 pr-8 text-xs"
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

          <div className="flex items-center gap-2">
            {/* Live Sync Status Indicator */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                isConnected
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-500"
              }`}
            >
              <Radio
                className={`h-3 w-3 ${isConnected ? "animate-pulse text-emerald-500" : "text-amber-500"}`}
              />
              <span className="text-[11px]">
                {isConnected ? "Realtime Sync" : "Connecting..."}
              </span>
            </div>

            {/* Quick Add Button */}
            <Button
              size="sm"
              onClick={() => handleOpenCreateModal("pending")}
              className="h-9 gap-1.5 whitespace-nowrap bg-indigo-600 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Filter className="h-3 w-3" />
            Filters:
          </div>

          {/* Priority Select */}
          <div className="w-32">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 py-1 text-xs"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>

          {/* Assignee Select */}
          <div className="w-36">
            <Select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="h-8 py-1 text-xs"
            >
              <option value="all">All Assignees</option>
              {membersList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </Select>
          </div>

          {/* Tag Select */}
          {allTags.length > 0 && (
            <div className="w-32">
              <Select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="h-8 py-1 text-xs"
              >
                <option value="all">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Due Date Range */}
          <div className="w-32">
            <Select
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              className="h-8 py-1 text-xs"
            >
              <option value="all">All Dates</option>
              <option value="today">Due Today</option>
              <option value="week">Due This Week</option>
              <option value="overdue">Overdue</option>
            </Select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}

          <div className="ml-auto text-xs font-medium text-slate-400">
            Showing{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {filteredTasks.length}
            </span>{" "}
            of {tasks.length} tasks
          </div>
        </div>
      </div>

      {/* 4 Kanban Columns (Horizontal Snap Scroll on Mobile, 4-Col Grid on Desktop) */}
      <div className="flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-4 md:overflow-x-visible">
        {KANBAN_COLUMNS.map((column) => {
          const columnTasks = filteredTasks.filter(
            (t) => t.status === column.id
          );
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex min-h-[520px] min-w-[280px] snap-center flex-col rounded-2xl p-3.5 transition-all duration-200 sm:min-w-[320px] md:min-w-0 ${column.accentBorder} ${
                isOver
                  ? "border-2 border-dashed border-indigo-500 bg-indigo-50/20 shadow-xl ring-4 ring-indigo-500/10 dark:bg-indigo-950/20"
                  : "border border-slate-200/80 bg-slate-50/70 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50"
              }`}
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${column.dotColor}`} />
                  <h3 className="text-xs font-bold tracking-wide text-slate-800 dark:text-slate-100">
                    {column.title}
                  </h3>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${column.badgeColor}`}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(column.id)}
                  title={`Add task to ${column.title}`}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Task Cards List */}
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isDragging={draggedTaskId === task.id}
                    onDragStart={handleDragStart}
                    onDragEnd={() => setDraggedTaskId(null)}
                    onClick={() => {
                      setSelectedDetailTask(task);
                      setIsDetailModalOpen(true);
                    }}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div
                    onClick={() => handleOpenCreateModal(column.id)}
                    className="group/empty flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200/80 bg-white/40 p-4 text-center transition-all duration-200 hover:border-indigo-500/40 hover:bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-indigo-500/40 dark:hover:bg-slate-850"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/60 bg-white text-slate-400 shadow-sm transition group-hover/empty:border-indigo-500/30 group-hover/empty:text-indigo-600 dark:border-slate-800 dark:bg-slate-800 dark:group-hover/empty:text-indigo-400">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-semibold text-slate-600 group-hover/empty:text-indigo-600 dark:text-slate-300 dark:group-hover/empty:text-indigo-400">
                        Drop card or click to add
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {column.title} column is clear
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Add Action */}
              <button
                type="button"
                onClick={() => handleOpenCreateModal(column.id)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-transparent py-2 text-xs font-semibold text-slate-500 shadow-none transition hover:border-slate-200 hover:bg-white hover:text-indigo-600 hover:shadow-sm dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Task Detail & Comments Modal */}
      <TaskDetail
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailTask(null);
        }}
        task={selectedDetailTask}
        orgMembers={membersList}
        allTasks={tasks}
        userRole="admin"
        onTaskUpdated={handleTaskSaved}
        onTaskDeleted={handleTaskDeleted}
      />

      {/* Create / Edit Task Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTask={
          editingTask
            ? editingTask
            : {
                title: "",
                priority: "medium",
                status: defaultColumnForNewTask,
              }
        }
        orgMembers={membersList}
        availableTasks={tasks}
        onSuccess={handleTaskSaved}
      />
    </div>
  );
}
