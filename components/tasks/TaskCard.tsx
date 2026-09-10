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
  Sparkles,
  Paperclip,
} from "lucide-react";
import { formatTaskDisplay } from "@/lib/utils/taskFormatter";

export interface KanbanTaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: "pending" | "in_progress" | "in_review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string | null;
  due_date?: string | null;
  updatedAt?: string;
  updated_at?: string;
  commentsCount?: number;
  comments?: any[];
  attachments?: any[];
  attachmentsCount?: number;
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
  createdAt?: string | null;
  created_at?: string | null;
  org_id?: string | null;
  team_id?: string | null;
  teamId?: string | null;
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

  const { title: cleanTitle, isAiEnhanced } = formatTaskDisplay(
    task.title,
    task.description
  );

  const priorityBorder = {
    urgent: "before:bg-rose-500",
    high: "before:bg-amber-500",
    medium: "before:bg-blue-500",
    low: "before:bg-slate-300 dark:before:bg-slate-600",
  }[task.priority] || "before:bg-slate-300";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group relative cursor-pointer touch-manipulation select-none rounded-xl border bg-white p-3.5 pl-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:rounded-l-xl ${priorityBorder} dark:bg-slate-900/90 ${
        isDragging
          ? "scale-95 border-dashed border-indigo-500 opacity-40 shadow-inner"
          : isBlocked
            ? "border-amber-400/60 shadow-sm hover:border-amber-500/80 hover:shadow-md dark:border-amber-600/40"
            : "border-slate-200/90 shadow-sm hover:border-indigo-500/40 hover:shadow-md dark:border-slate-800/80 dark:hover:border-indigo-500/40"
      }`}
    >
      {/* Top Header: Priority Badge + Blocked Pill + Drag Handle */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={priorityVariants[task.priority] || "default"}>
            {task.priority}
          </Badge>

          {isAiEnhanced && (
            <span
              title="AI Enhanced Task"
              className="inline-flex items-center gap-0.5 rounded border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400"
            >
              <Sparkles className="h-2.5 w-2.5" />
              AI
            </span>
          )}

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
      <h4 className="line-clamp-2 text-[13px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
        {cleanTitle}
      </h4>

      {/* Subtasks Progress Bar (if task has subtasks) */}
      {totalSubtasks > 0 && (
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <CheckSquare className="h-2.5 w-2.5 text-indigo-500" />
              Subtasks
            </span>
            <span className="font-bold">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                completedSubtasks === totalSubtasks
                  ? "bg-emerald-500"
                  : "bg-indigo-500"
              }`}
              style={{
                width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Task Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((t) => (
            <span
              key={t}
              className="rounded-md border border-slate-200/60 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Due Date, Checklist progress, Comments, Attachments */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800/80">
        {rawDueDate ? (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
              isOverdue
                ? "border border-rose-500/20 bg-rose-500/10 font-bold text-rose-600 dark:text-rose-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {isOverdue ? (
              <AlertTriangle className="h-2.5 w-2.5 text-rose-500" />
            ) : (
              <Clock className="h-2.5 w-2.5" />
            )}
            {new Date(rawDueDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          {((task.dependencies && task.dependencies.length > 0) ||
            (task.dependencyTaskIds && task.dependencyTaskIds.length > 0)) && (
            <span
              title="Has task dependencies"
              className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            >
              <Link2 className="h-2.5 w-2.5" />
              {task.dependencies?.length || task.dependencyTaskIds?.length}
            </span>
          )}

          {(task.commentsCount ||
            (task.comments && task.comments.length) ||
            0) > 0 && (
            <span
              title={`${task.commentsCount || task.comments?.length} comment(s)`}
              className="inline-flex items-center gap-1 rounded-md border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400"
            >
              <MessageSquare className="h-2.5 w-2.5" />
              {task.commentsCount || task.comments?.length}
            </span>
          )}

          {((task.attachmentsCount && task.attachmentsCount > 0) ||
            (task.attachments && task.attachments.length > 0)) && (
            <span
              title={`${task.attachmentsCount || task.attachments?.length} attached resource link(s)`}
              className="inline-flex items-center gap-1 rounded-md border border-teal-500/20 bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400"
            >
              <Paperclip className="h-2.5 w-2.5" />
              {task.attachmentsCount || task.attachments?.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
