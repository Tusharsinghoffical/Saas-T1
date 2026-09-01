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
  assignees?: { id: string; fullName?: string; full_name?: string; avatar_url?: string | null }[];
  task_assignees?: { user_id: string; profiles?: { id: string; full_name: string; avatar_url?: string | null } }[];
  tags?: string[];
  subtasks?: { id: string; title: string; completed: boolean }[];
  dependencyTaskIds?: string[];
  dependencies?: { id: string; title: string; status: string }[];
  task_dependencies?: { depends_on_task_id: string; tasks?: { id: string; title: string; status: string } }[];
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
  const priorityVariants: Record<string, "default" | "urgent" | "warning" | "success"> = {
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
      className={`group relative p-4 rounded-xl bg-white dark:bg-slate-850 border transition-all duration-150 cursor-pointer touch-manipulation active:scale-[0.98] select-none ${
        isDragging
          ? "opacity-40 scale-95 border-dashed border-primary shadow-inner"
          : isBlocked
          ? "border-amber-400/60 dark:border-amber-600/40 shadow-sm"
          : "border-slate-200 dark:border-slate-800 hover:border-primary/50 shadow-sm hover:shadow-md"
      }`}
    >
      {/* Top Header: Priority Badge + Blocked Pill + Drag Handle */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant={priorityVariants[task.priority] || "default"}>
            {task.priority}
          </Badge>

          {isBlocked && (
            <span
              title="Blocked by incomplete prerequisite task(s)"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            >
              <Lock className="w-2.5 h-2.5" />
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
                <div className="inline-flex h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 items-center justify-center text-[8px] font-semibold">
                  +{assigneeList.length - 3}
                </div>
              )}
            </AvatarGroup>
          )}
          <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition opacity-0 group-hover:opacity-100" />
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {task.title}
      </h4>

      {/* Task Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Due Date, Checklist progress, Comments, Dependencies */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        {rawDueDate ? (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
              isOverdue
                ? "text-urgent font-bold"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {isOverdue ? (
              <AlertTriangle className="w-3 h-3 text-urgent" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {new Date(rawDueDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2.5 text-slate-400 text-[11px]">
          {((task.dependencies && task.dependencies.length > 0) ||
            (task.dependencyTaskIds && task.dependencyTaskIds.length > 0)) && (
            <span
              title="Has task dependencies"
              className="inline-flex items-center gap-1 text-slate-500"
            >
              <Link2 className="w-3 h-3" />
              {task.dependencies?.length || task.dependencyTaskIds?.length}
            </span>
          )}

          {totalSubtasks > 0 && (
            <span
              className={`inline-flex items-center gap-1 ${
                completedSubtasks === totalSubtasks
                  ? "text-success font-medium"
                  : ""
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}

          {(task.commentsCount || (task.comments && task.comments.length) || 0) > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {task.commentsCount || task.comments?.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
