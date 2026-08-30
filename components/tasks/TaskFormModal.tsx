"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validators/task";
import {
  Sparkles,
  Plus,
  Trash2,
  CheckSquare,
  Tag,
  Calendar,
  Users,
  AlertCircle,
  Loader2,
  Undo2,
  Link2,
} from "lucide-react";
import { captureEvent } from "@/lib/analytics/posthog";

export interface OrgMember {
  id: string;
  fullName: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: {
    id?: string;
    title: string;
    description?: string | null;
    priority: "low" | "medium" | "high" | "urgent";
    status?: "pending" | "in_progress" | "in_review" | "completed";
    dueDate?: string | null;
    assigneeIds?: string[];
    dependencyTaskIds?: string[];
    tags?: string[];
    subtasks?: { id: string; title: string; completed: boolean }[];
  } | null;
  orgMembers?: OrgMember[];
  availableTasks?: { id: string; title: string; status?: string }[];
  onSuccess?: (task: any) => void;
}

export function TaskFormModal({
  isOpen,
  onClose,
  initialTask,
  orgMembers = [
    { id: "mem-1", fullName: "Jane Doe (Admin)", role: "admin" },
    { id: "mem-2", fullName: "Alex Smith (Lead)", role: "manager" },
    { id: "mem-3", fullName: "Rohan Patel (Dev)", role: "employee" },
  ],
  availableTasks = [
    { id: "task-1", title: "Set up company workspace & review OKRs", status: "in_progress" },
    { id: "task-2", title: "Implement Postgres RLS policy test suite", status: "pending" },
    { id: "task-3", title: "Set up Upstash Redis rate limiting bucket", status: "in_review" },
  ],
  onSuccess,
}: TaskFormModalProps) {
  const isEditing = Boolean(initialTask?.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [status, setStatus] = useState<"pending" | "in_progress" | "in_review" | "completed">("pending");
  const [dueDate, setDueDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState("");

  // AI Enhancement state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [previousDescription, setPreviousDescription] = useState<string | null>(null);

  // AI Assignee Workload Suggestion state
  const [isAiAssigneeLoading, setIsAiAssigneeLoading] = useState(false);
  const [suggestedAssignee, setSuggestedAssignee] = useState<{ id: string; name: string; reasoning?: string } | null>(null);
  const [aiToast, setAiToast] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Filter available tasks to prevent self-dependency
  const dependencyOptions = availableTasks.filter(
    (t) => !initialTask?.id || t.id !== initialTask.id
  );

  // AI Suggest Assignee Handler
  const fetchAiWorkloadSuggestion = async (taskName: string) => {
    setIsAiAssigneeLoading(true);
    try {
      const res = await fetch("/api/v1/ai/workload-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle: taskName || "New Task" }),
      });
      const json = await res.json();
      if (res.status === 429) {
        setAiToast(json.error || "AI rate limited (30 calls/hr).");
        setTimeout(() => setAiToast(null), 5000);
      } else if (json.success && json.data) {
        if (json.data.recommendedAssignee) {
          setSuggestedAssignee({
            id: json.data.recommendedUserId || "",
            name: json.data.recommendedAssignee,
            reasoning: json.data.reasoning,
          });
        }
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setIsAiAssigneeLoading(false);
    }
  };

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setTitle(initialTask.title || "");
        setDescription(initialTask.description || "");
        setPriority(initialTask.priority || "medium");
        setStatus(initialTask.status || "pending");
        setDueDate(initialTask.dueDate ? initialTask.dueDate.slice(0, 10) : "");
        setSelectedAssignees(initialTask.assigneeIds || []);
        setSelectedDependencies(initialTask.dependencyTaskIds || []);
        setTags(initialTask.tags || []);
        setSubtasks(initialTask.subtasks || []);
      } else {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setStatus("pending");
        setDueDate("");
        setSelectedAssignees([]);
        setSelectedDependencies([]);
        setTags([]);
        setSubtasks([]);
      }
      setErrors({});
      setServerError(null);
      setPreviousDescription(null);
      setSuggestedAssignee(null);
      setAiToast(null);

      // Trigger automatic workload suggestion on open
      fetchAiWorkloadSuggestion(initialTask?.title || "New Task");
    }
  }, [isOpen, initialTask]);

  // AI Enhance description handler
  const handleEnhanceWithAi = async () => {
    const textToEnhance = description.trim() || title.trim();
    if (!textToEnhance) {
      setErrors((prev) => ({
        ...prev,
        description: "Please enter a title or draft description first.",
      }));
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await fetch("/api/v1/ai/enhance-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToEnhance }),
      });
      const json = await res.json();

      if (res.status === 429) {
        setAiToast(json.error || "AI rate limit reached (30 calls/hr).");
        setTimeout(() => setAiToast(null), 5000);
      } else if (json.success && json.data?.enhanced) {
        setPreviousDescription(description);
        setDescription(json.data.enhanced);
        if (json.data.title && !title.trim()) {
          setTitle(json.data.title);
        }
        captureEvent("ai_enhance_used", {
          originalLength: textToEnhance.length,
          enhancedLength: json.data.enhanced.length,
        });
      } else {
        setAiToast(json.error || "AI enhancement currently unavailable.");
        setTimeout(() => setAiToast(null), 4000);
      }
    } catch {
      setAiToast("AI enhancement network timeout.");
      setTimeout(() => setAiToast(null), 4000);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUndoAi = () => {
    if (previousDescription !== null) {
      setDescription(previousDescription);
      setPreviousDescription(null);
    }
  };

  const handleAcceptSuggestedAssignee = () => {
    if (!suggestedAssignee) return;
    if (suggestedAssignee.id && !selectedAssignees.includes(suggestedAssignee.id)) {
      setSelectedAssignees([...selectedAssignees, suggestedAssignee.id]);
    } else {
      const match = orgMembers.find(
        (m) => m.fullName.toLowerCase() === suggestedAssignee.name.toLowerCase()
      );
      if (match && !selectedAssignees.includes(match.id)) {
        setSelectedAssignees([...selectedAssignees, match.id]);
      }
    }
  };

  // Tag Handlers
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentTag.trim()) {
      e.preventDefault();
      const cleaned = currentTag.trim().toLowerCase();
      if (!tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Subtask Handlers
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtask.trim()) {
      setSubtasks([
        ...subtasks,
        { id: `st-${Date.now()}`, title: newSubtask.trim(), completed: false },
      ]);
      setNewSubtask("");
    }
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  // Assignee toggle
  const handleToggleAssignee = (memberId: string) => {
    if (selectedAssignees.includes(memberId)) {
      setSelectedAssignees(selectedAssignees.filter((id) => id !== memberId));
    } else {
      setSelectedAssignees([...selectedAssignees, memberId]);
    }
  };

  // Dependency toggle
  const handleToggleDependency = (taskId: string) => {
    if (selectedDependencies.includes(taskId)) {
      setSelectedDependencies(selectedDependencies.filter((id) => id !== taskId));
    } else {
      setSelectedDependencies([...selectedDependencies, taskId]);
    }
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const payload: CreateTaskInput = {
      title,
      description: description || undefined,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      assigneeIds: selectedAssignees,
      dependencyTaskIds: selectedDependencies,
    };

    const validation = createTaskSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditing ? `/api/v1/tasks/${initialTask?.id}` : "/api/v1/tasks";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        setServerError(json.error || "Failed to save task.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      if (!isEditing) {
        captureEvent("task_created", {
          taskId: json.data?.id,
          priority: payload.priority,
          hasDueDate: Boolean(payload.dueDate),
          assigneesCount: payload.assigneeIds?.length || 0,
        });
      }
      if (onSuccess) onSuccess(json.data);
      onClose();
    } catch (err: any) {
      setServerError(err.message || "An unexpected network error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Task" : "Create New Task"}
      description={
        isEditing
          ? "Update task details, dependencies, assignees, and checklist."
          : "Assign a new task to your team with smart AI assistance and dependency blocking."
      }
      maxWidth="xl"
    >
      {aiToast && (
        <div className="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-medium animate-fade-in">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>{aiToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiToast(null)}
            className="text-amber-700 dark:text-amber-300 font-bold ml-2 hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {serverError && (
        <div className="mb-4 p-3 rounded-lg bg-urgent/10 border border-urgent/20 flex items-start gap-2 text-xs text-urgent font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Task Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Task Title *
          </label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
            }}
            placeholder="e.g., Audit customer onboarding telemetry"
            error={Boolean(errors.title)}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-urgent font-medium">{errors.title}</p>
          )}
        </div>

        {/* Description & AI Enhance Button */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Description
            </label>
            <div className="flex items-center gap-1.5">
              {previousDescription && (
                <button
                  type="button"
                  onClick={handleUndoAi}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 font-medium px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Undo</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleEnhanceWithAi}
                disabled={isAiLoading}
                className="text-xs text-primary hover:text-primary-700 dark:hover:text-primary-400 flex items-center gap-1 font-semibold px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/15 transition disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? "animate-spin" : ""}`} />
                <span>{isAiLoading ? "Enhancing..." : "Enhance with AI"}</span>
              </button>
            </div>
          </div>

          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
            }}
            rows={4}
            placeholder="Describe the task requirements, objective, or acceptance criteria..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-urgent font-medium">{errors.description}</p>
          )}
        </div>

        {/* Priority & Status & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Priority
            </label>
            <Select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "low" | "medium" | "high" | "urgent")
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Status
            </label>
            <Select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as "pending" | "in_progress" | "in_review" | "completed"
                )
              }
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Due Date
            </label>
            <div className="relative">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Assignee Multi-Select */}
        <div>
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              Assignees
            </label>

            {/* Subtle Loading Spinner or AI Suggestion Hint */}
            {isAiAssigneeLoading ? (
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-spin text-primary" />
                <span>Checking workload capacity...</span>
              </div>
            ) : suggestedAssignee ? (
              <button
                type="button"
                onClick={handleAcceptSuggestedAssignee}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded-full transition"
                title={suggestedAssignee.reasoning || "Least loaded member"}
              >
                <Sparkles className="w-3 h-3 text-primary" />
                <span>AI suggests: <strong>{suggestedAssignee.name}</strong> (least loaded)</span>
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            {orgMembers.map((member) => {
              const isSelected = selectedAssignees.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleToggleAssignee(member.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isSelected
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-primary/20 text-primary"
                    }`}
                  >
                    {member.fullName.slice(0, 1)}
                  </div>
                  <span>{member.fullName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dependencies / Depends On Picker */}
        {dependencyOptions.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-amber-500" />
              Depends On (Prerequisites to complete first)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 max-h-36 overflow-y-auto">
              {dependencyOptions.map((depTask) => {
                const isSelected = selectedDependencies.includes(depTask.id);
                return (
                  <button
                    key={depTask.id}
                    type="button"
                    onClick={() => handleToggleDependency(depTask.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? "bg-amber-500 text-white shadow-sm font-semibold"
                        : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500"
                    }`}
                  >
                    <Link2 className="w-3 h-3 opacity-80" />
                    <span className="truncate max-w-[220px]">{depTask.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            Tags (Press Enter to add)
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="gap-1 bg-white dark:bg-slate-800 py-1"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-slate-400 hover:text-urgent"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <Input
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="e.g., frontend, marketing, bug"
          />
        </div>

        {/* Checklist / Sub-tasks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-primary" />
            Checklist / Sub-tasks
          </label>

          <div className="space-y-1.5 mb-2.5">
            {subtasks.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => handleToggleSubtask(st.id)}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span
                    className={
                      st.completed
                        ? "line-through text-slate-400"
                        : "text-slate-800 dark:text-slate-200"
                    }
                  >
                    {st.title}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveSubtask(st.id)}
                  className="text-slate-400 hover:text-urgent p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add a checklist item..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubtask(e);
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddSubtask}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Task...</span>
              </>
            ) : (
              <span>{isEditing ? "Update Task" : "Create Task"}</span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
