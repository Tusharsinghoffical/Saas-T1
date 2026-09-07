"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import {
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckSquare,
  GripVertical,
  Link2,
  Lock,
} from "lucide-react";

export interface KanbanTaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: "pending" | "in_progress" | "in_review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string | null;
  due_date?: string | null;
  commentsCount?: number;
  comments?: any[];
  assignees?: {
    id: string;
    fullName?: string;
    full_name?: string;
    avatar_url?: string | null;
  }[];
  task_assignees?: {
    user_id: string;
    profiles?: { id: string; full_name: string; avatar_url?: string | null };
  }[];
  tags?: string[];
  subtasks?: { id: string; title: string; completed: boolean }[];
  dependencyTaskIds?: string[];
  dependencies?: { id: string; title: string; status: string }[];
  task_dependencies?: {
    depends_on_task_id: string;
    tasks?: { id: string; title: string; status: string };
  }[];
  createdBy?: string | null;
  created_by?: string | null;
  org_id?: string | null;
}

export interface TaskCardProps {
  task: KanbanTaskItem;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

export function TaskCard({
  task,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
}: TaskCardProps) {
  const priorityVariants: Record<
    string,
    "default" | "urgent" | "warning" | "success"
  > = {
    low: "default",
    medium: "default",
    high: "warning",
    urgent: "urgent",
  };

  const rawDueDate = task.dueDate || task.due_date;
  const isOverdue =
    rawDueDate &&
    task.status !== "completed" &&
    new Date(rawDueDate).getTime() < Date.now();

  // Check if blocked by any incomplete dependency
  const isBlocked = Boolean(
    task.dependencies?.some((d) => d.status !== "completed") ||
    task.task_dependencies?.some(
      (td) => td.tasks && td.tasks.status !== "completed"
    )
  );

  // Extract assignees
  const assigneeList =
    task.assignees ||
    task.task_assignees?.map((a) => ({
      id: a.user_id,
      fullName: a.profiles?.full_name || "Member",
    })) ||
    [];

  const completedSubtasks =
    task.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`dark:bg-slate-850 group relative cursor-pointer touch-manipulation select-none rounded-xl border bg-white p-4 transition-all duration-150 active:scale-[0.98] ${
        isDragging
          ? "scale-95 border-dashed border-primary opacity-40 shadow-inner"
          : isBlocked
            ? "border-amber-400/60 shadow-sm dark:border-amber-600/40"
            : "border-slate-200 shadow-sm hover:border-primary/50 hover:shadow-md dark:border-slate-800"
      }`}
    >
      {/* Top Header: Priority Badge + Blocked Pill + Drag Handle */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={priorityVariants[task.priority] || "default"}>
            {task.priority}
          </Badge>

          {isBlocked && (
            <span
              title="Blocked by incomplete prerequisite task(s)"
              className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400"
            >
              <Lock className="h-2.5 w-2.5" />
              Blocked
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {assigneeList.length > 0 && (
            <AvatarGroup>
              {assigneeList.slice(0, 3).map((a, i) => (
                <Avatar
                  key={a.id || i}
                  name={a.fullName || "Member"}
                  size="xs"
                />
              ))}
              {assigneeList.length > 3 && (
                <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[8px] font-semibold text-slate-600 ring-2 ring-white dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-900">
                  +{assigneeList.length - 3}
                </div>
              )}
            </AvatarGroup>
          )}
          <GripVertical className="h-3.5 w-3.5 text-slate-300 opacity-0 transition group-hover:text-slate-500 group-hover:opacity-100" />
        </div>
      </div>

      {/* Task Title */}
      <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-primary dark:text-slate-100">
        {task.title}
      </h4>

      {/* Task Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((t) => (
            <span
              key={t}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Due Date, Checklist progress, Comments, Dependencies */}
      <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
        {rawDueDate ? (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
              isOverdue
                ? "font-bold text-urgent"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {isOverdue ? (
              <AlertTriangle className="h-3 w-3 text-urgent" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {new Date(rawDueDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
          {((task.dependencies && task.dependencies.length > 0) ||
            (task.dependencyTaskIds && task.dependencyTaskIds.length > 0)) && (
            <span
              title="Has task dependencies"
              className="inline-flex items-center gap-1 text-slate-500"
            >
              <Link2 className="h-3 w-3" />
              {task.dependencies?.length || task.dependencyTaskIds?.length}
            </span>
          )}

          {totalSubtasks > 0 && (
            <span
              className={`inline-flex items-center gap-1 ${
                completedSubtasks === totalSubtasks
                  ? "font-medium text-success"
                  : ""
              }`}
            >
              <CheckSquare className="h-3 w-3" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}

          {(task.commentsCount ||
            (task.comments && task.comments.length) ||
            0) > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.commentsCount || task.comments?.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
