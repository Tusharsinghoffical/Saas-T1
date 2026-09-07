"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";
import { formatTaskDisplay } from "@/lib/utils/taskFormatter";
import { createClient } from "@/infrastructure/supabase/supabaseClient";
import {
  Clock,
  Send,
  Link2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  CheckSquare,
  AtSign,
  Plus,
  Trash2,
  Share2,
  Globe,
  FileCode,
  FileText,
  Video,
  Lock,
  CheckCircle2,
  Sparkles,
  UserCheck,
  ArrowRight,
  History,
  Building2,
  AlertTriangle,
} from "lucide-react";

export interface OrgMember {
  id: string;
  fullName?: string;
  full_name?: string;
  role?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
}

export interface CommentItem {
  id: string;
  task_id?: string;
  taskId?: string;
  content?: string;
  body?: string;
  created_at?: string;
  createdAt?: string;
  profiles?: {
    id?: string;
    full_name?: string;
    fullName?: string;
    avatar_url?: string | null;
    avatarUrl?: string | null;
  };
  author?: {
    id?: string;
    full_name?: string;
    fullName?: string;
    avatar_url?: string | null;
    avatarUrl?: string | null;
  };
}

export interface AttachmentItem {
  id: string;
  task_id?: string;
  taskId?: string;
  file_name?: string;
  fileName?: string;
  file_url?: string;
  fileUrl?: string;
  file_size?: number;
  fileSize?: number;
  file_type?: string;
  fileType?: string;
  created_at?: string;
  createdAt?: string;
}

export interface TaskDetailProps {
  isOpen: boolean;
  onClose: () => void;
  task: KanbanTaskItem | null;
  orgMembers?: OrgMember[];
  allTasks?: KanbanTaskItem[];
  userRole?: string;
  onTaskUpdated?: (updated: KanbanTaskItem) => void;
  onTaskDeleted?: (taskId: string) => void;
}

// Helper to identify platform type & branding
function getPlatformInfo(url: string) {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
      return {
        name: "Google Drive",
        color:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: Globe,
      };
    }
    if (host.includes("figma.com")) {
      return {
        name: "Figma",
        color:
          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        icon: Sparkles,
      };
    }
    if (host.includes("github.com") || host.includes("gitlab.com")) {
      return {
        name: "GitHub / Repo",
        color: "bg-slate-800 text-slate-200 border-slate-700",
        icon: FileCode,
      };
    }
    if (host.includes("notion.so") || host.includes("notion.site")) {
      return {
        name: "Notion",
        color:
          "bg-stone-500/10 text-stone-600 dark:text-stone-300 border-stone-500/20",
        icon: FileText,
      };
    }
    if (
      host.includes("loom.com") ||
      host.includes("youtube.com") ||
      host.includes("vimeo.com")
    ) {
      return {
        name: "Video / Loom",
        color:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        icon: Video,
      };
    }
    if (host.includes("dropbox.com") || host.includes("box.com")) {
      return {
        name: "Cloud Storage",
        color:
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        icon: Globe,
      };
    }

    return {
      name: host.replace(/^www\./, ""),
      color: "bg-primary/10 text-primary border-primary/20",
      icon: ExternalLink,
    };
  } catch {
    return {
      name: "Web Resource",
      color:
        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
      icon: Link2,
    };
  }
}

export function TaskDetail({
  isOpen,
  onClose,
  task,
  orgMembers = [
    { id: "mem-1", fullName: "Jane Doe", full_name: "Jane Doe", role: "admin" },
    {
      id: "mem-2",
      fullName: "Alex Smith",
      full_name: "Alex Smith",
      role: "manager",
    },
    {
      id: "mem-3",
      fullName: "Rohan Patel",
      full_name: "Rohan Patel",
      role: "employee",
    },
  ],
  allTasks = [],
  userRole = "admin",
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Dynamic Reallocation State
  const [targetAssigneeId, setTargetAssigneeId] = useState<string>("");
  const [targetTeamId, setTargetTeamId] = useState<string>("");
  const [reassignReason, setReassignReason] = useState<string>("");
  const [isReassigning, setIsReassigning] = useState<boolean>(false);
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [reassignSuccess, setReassignSuccess] = useState<string | null>(null);
  const [reassignmentHistory, setReassignmentHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Soft Deletion Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Link Attachment State
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copiedAttachmentId, setCopiedAttachmentId] = useState<string | null>(
    null
  );
  const [copiedTaskShare, setCopiedTaskShare] = useState(false);

  // @mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Subtasks local state
  const [subtasks, setSubtasks] = useState<
    { id: string; title: string; completed: boolean }[]
  >([]);

  const fetchComments = useCallback(async () => {
    if (!task) return;
    try {
      const sanitizedTaskId = encodeURIComponent(task.id);
      const res = await fetch(`/api/v1/tasks/${sanitizedTaskId}/comments`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setComments(json.data);
      }
    } catch {
      // Ignore
    }
  }, [task]);

  const fetchAttachments = useCallback(async () => {
    if (!task) return;
    try {
      const sanitizedTaskId = encodeURIComponent(task.id);
      const res = await fetch(`/api/v1/tasks/${sanitizedTaskId}/attachments`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAttachments(json.data);
      }
    } catch {
      // Ignore
    }
  }, [task]);

  const fetchReassignmentHistory = useCallback(async () => {
    if (!task) return;
    setIsLoadingHistory(true);
    try {
      const sanitizedTaskId = encodeURIComponent(task.id);
      const res = await fetch(`/api/v1/tasks/${sanitizedTaskId}/reassignments`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setReassignmentHistory(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingHistory(false);
    }
  }, [task]);

  useEffect(() => {
    if (!task || !isOpen) return;

    setSubtasks(task.subtasks || []);
    setTargetAssigneeId(
      task.assignees?.[0]?.id || (task as any).assigneeIds?.[0] || ""
    );
    setTargetTeamId((task as any).team_id || (task as any).teamId || "");
    setReassignError(null);
    setReassignSuccess(null);
    setReassignReason("");

    fetchComments();
    fetchAttachments();
    fetchReassignmentHistory();

    // Realtime channel for task comments, attachments & reassignments
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const hasSupabase =
      Boolean(supabaseUrl) && !supabaseUrl.includes("your-project-ref");
    if (!hasSupabase) return;

    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel(`realtime:task_room:${task.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "task_comments",
            filter: `task_id=eq.${task.id}`,
          },
          () => {
            fetchComments();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "task_attachments",
            filter: `task_id=eq.${task.id}`,
          },
          () => {
            fetchAttachments();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "task_reassignments",
            filter: `task_id=eq.${task.id}`,
          },
          () => {
            fetchReassignmentHistory();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("Realtime details channel error:", e);
    }

    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [task, isOpen, fetchComments, fetchAttachments, fetchReassignmentHistory]);

  if (!task || !isOpen) return null;

  // Resolve dependencies
  const resolvedDependencies = (task.dependencyTaskIds || [])
    .map((depId) => allTasks.find((t) => t.id === depId))
    .filter(Boolean) as KanbanTaskItem[];

  const incompleteDependencies = resolvedDependencies.filter(
    (dep) => dep.status !== "completed"
  );
  const isBlocked = incompleteDependencies.length > 0;

  // Resolve tasks that are waiting on THIS task
  const dependentTasks = allTasks.filter((t) =>
    t.dependencyTaskIds?.includes(task.id)
  );

  // Handle @mention typing detection
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    setNewComment(text);

    const lastAt = text.lastIndexOf("@", cursor - 1);
    if (lastAt !== -1 && !text.slice(lastAt, cursor).includes(" ")) {
      const query = text.slice(lastAt + 1, cursor).toLowerCase();
      setMentionQuery(query);
      setMentionIndex(lastAt);
    } else {
      setMentionQuery(null);
      setMentionIndex(-1);
    }
  };

  const handleSelectMention = (member: OrgMember) => {
    if (mentionIndex === -1) return;
    const memberName = member.fullName || member.full_name || "teammate";
    const before = newComment.slice(0, mentionIndex);
    const after = newComment.slice(
      textareaRef.current?.selectionStart || mentionIndex
    );
    const updated = `${before}@${memberName} ${after}`;
    setNewComment(updated);
    setMentionQuery(null);
    setMentionIndex(-1);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Submit comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const sanitizedTaskId = encodeURIComponent(task.id);
      const res = await fetch(`/api/v1/tasks/${sanitizedTaskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setComments((prev) => [...prev, json.data]);
        setNewComment("");
        fetchComments();
      } else {
        alert(
          json.error ||
            json.message ||
            "Failed to post comment. Please try again."
        );
      }
    } catch {
      alert("Network error posting comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Attach File URL / Resource Link
  const handleAddResourceLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);

    let cleanUrl = linkUrl.trim();
    if (!cleanUrl) {
      setLinkError("Please enter a file or document URL.");
      return;
    }

    // Smart cleanup for accidentally merged or pasted URLs (e.g. https://thttps://drive.google.com/...asq-one.onrender.com...)
    const lastHttps = cleanUrl.lastIndexOf("https://");
    const lastHttp = cleanUrl.lastIndexOf("http://");
    const bestProtocolIdx = Math.max(lastHttps, lastHttp);
    if (bestProtocolIdx > 0) {
      cleanUrl = cleanUrl.slice(bestProtocolIdx);
    }

    // Strip accidental app URL suffix if user pasted into an existing address bar link
    cleanUrl = cleanUrl
      .replace(/(?:asq-one\.onrender\.com|tasq-one\.onrender\.com|localhost:\d+).*$/i, "")
      .trim();

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setLinkError("Invalid URL format. Please enter a valid URL (e.g. https://drive.google.com/...).");
      return;
    }

    let title = linkTitle.trim();
    if (!title) {
      try {
        const u = new URL(cleanUrl);
        title =
          u.hostname.replace(/^www\./, "") +
          (u.pathname !== "/" ? u.pathname : "");
      } catch {
        title = "Attached Resource Link";
      }
    }

    setIsAddingLink(true);
    try {
      const sanitizedTaskId = encodeURIComponent(task.id);
      const res = await fetch(`/api/v1/tasks/${sanitizedTaskId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_attachment",
          fileName: title,
          fileUrl: cleanUrl,
          fileSize: 0,
          fileType: "link",
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setLinkTitle("");
        setLinkUrl("");
        await fetchAttachments();
      } else {
        const errorMsg =
          typeof json.error === "string"
            ? json.error
            : json.message || "Failed to save link to workspace database.";
        setLinkError(errorMsg);
      }
    } catch {
      setLinkError("Network error: Could not save link.");
    } finally {
      setIsAddingLink(false);
    }
  };

  // Remove Attachment Link
  const handleDeleteLink = async (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
    try {
      const sanitizedTaskId = encodeURIComponent(task.id);
      await fetch(`/api/v1/tasks/${sanitizedTaskId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_attachment",
          attachmentId: attId,
        }),
      });
      fetchAttachments();
    } catch {
      // silent
    }
  };

  // Copy Attachment URL
  const copyAttachmentUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedAttachmentId(id);
    setTimeout(() => setCopiedAttachmentId(null), 2000);
  };

  // Copy Task Share Link
  const copyTaskShareLink = () => {
    const shareUrl = `${window.location.origin}/employee/dashboard?taskId=${task.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedTaskShare(true);
    setTimeout(() => setCopiedTaskShare(false), 2000);
  };

  // Toggle Subtask Completion
  const handleToggleSubtask = async (subtaskId: string) => {
    const updatedSubtasks = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    setSubtasks(updatedSubtasks);

    try {
      const sanitizedTaskId = encodeURIComponent(task.id);
      const res = await fetch(`/api/v1/tasks/${sanitizedTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: updatedSubtasks }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        if (onTaskUpdated) {
          onTaskUpdated(json.data);
        }
      }
    } catch {
      setSubtasks(subtasks);
    }
  };

  const isPrivileged = userRole === "admin" || userRole === "manager";

  const DEPARTMENTS = [
    { id: "", name: "Unassigned / General" },
    { id: "dept-engineering", name: "Engineering & Tech" },
    { id: "dept-product", name: "Product & Design" },
    { id: "dept-qa", name: "QA & Testing" },
    { id: "dept-marketing", name: "Marketing & Growth" },
    { id: "dept-sales", name: "Sales & Enterprise Ops" },
    { id: "dept-operations", name: "Operations & HR" },
  ];

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setIsReassigning(true);
    setReassignError(null);
    setReassignSuccess(null);

    try {
      const sanitizedTaskId = encodeURIComponent(task.id);
      const res = await fetch(`/api/v1/tasks/${sanitizedTaskId}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigneeId: targetAssigneeId || null,
          teamId: targetTeamId || null,
          reason: reassignReason.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error?.message || json.message || "Failed to reassign task"
        );
      }

      setReassignSuccess("Task reassigned successfully!");
      setReassignReason("");

      // Update parent state optimistically
      const newMember = orgMembers.find((m) => m.id === targetAssigneeId);
      const updatedAssignees = newMember
        ? [
            {
              id: newMember.id,
              fullName: newMember.fullName || newMember.full_name || "Assignee",
              avatarUrl: newMember.avatarUrl || newMember.avatar_url,
            },
          ]
        : [];

      const updatedTask: KanbanTaskItem = {
        ...task,
        team_id: targetTeamId || undefined,
        assignees: updatedAssignees,
      };

      if (onTaskUpdated) {
        onTaskUpdated(updatedTask);
      }

      // Re-fetch reassignment history
      fetchReassignmentHistory();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tasq:tasks_updated"));
        window.dispatchEvent(new CustomEvent("tasq:activity_updated"));
      }
    } catch (err: any) {
      setReassignError(err.message || "Reassignment failed");
    } finally {
      setIsReassigning(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const sanitizedTaskId = encodeURIComponent(task.id);
      const res = await fetch(`/api/v1/tasks/${sanitizedTaskId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error?.message || json.message || "Failed to delete task"
        );
      }

      setIsDeleteDialogOpen(false);
      onClose();

      if (onTaskDeleted) {
        onTaskDeleted(task.id);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tasq:tasks_updated"));
        window.dispatchEvent(new CustomEvent("tasq:activity_updated"));
      }
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMembers =
    mentionQuery !== null
      ? orgMembers.filter((m) => {
          const name = m.fullName || m.full_name || "";
          return name.toLowerCase().includes(mentionQuery);
        })
      : [];

  const priorityVariants: Record<string, "default" | "urgent" | "warning"> = {
    low: "default",
    medium: "default",
    high: "warning",
    urgent: "urgent",
  };

  const dueDateStr = task.dueDate || task.due_date;
  const formatted = formatTaskDisplay(task.title, task.description);

  return (
    <>
      <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={formatted.title}
      description={`Task ID: ${task.id}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Blocked Warning Banner */}
        {isBlocked && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
            <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <div>
              <div className="font-bold text-amber-900 dark:text-amber-200">
                This task is currently BLOCKED
              </div>
              <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                It cannot be moved to &quot;In Progress&quot; or
                &quot;Completed&quot; until all prerequisite dependencies are
                Completed.
              </p>
            </div>
          </div>
        )}

        {/* Task Badges & Meta Info */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={priorityVariants[task.priority] || "default"}>
              {task.priority.toUpperCase()}
            </Badge>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-primary">
              {task.status.replace("_", " ")}
            </span>
            {formatted.isAiEnhanced && (
              <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/25 bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-300">
                <Sparkles className="h-3 w-3 text-purple-500" />
                AI Enhanced
              </span>
            )}
            {dueDateStr && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Due: {new Date(dueDateStr).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Share Task URL Button */}
            <button
              type="button"
              onClick={copyTaskShareLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              title="Copy Direct Task URL Link"
            >
              {copiedTaskShare ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              <span>{copiedTaskShare ? "Task Link Copied!" : "Share Task"}</span>
            </button>

            {/* Delete Task Button (Admin / Manager Only) */}
            {isPrivileged && (
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60"
                title="Delete this task from workspace"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Task Objective & Description */}
        <div className="space-y-3">
          {formatted.objective ? (
            <div>
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Objective
              </h4>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-medium leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                {formatted.objective}
              </div>
            </div>
          ) : (
            <div>
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Description
              </h4>
              <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                {formatted.cleanDescription || task.description || "No description provided."}
              </div>
            </div>
          )}

          {formatted.acceptanceCriteria.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Acceptance Criteria ({formatted.acceptanceCriteria.length})
                </h4>
              </div>
              <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                {formatted.acceptanceCriteria.map((criterion, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-200/60 bg-white p-2.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900"
                  >
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                      {idx + 1}
                    </span>
                    <span className="leading-snug text-slate-700 dark:text-slate-300">
                      {criterion}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Task Dependencies & Blocking Relationships */}
        {(resolvedDependencies.length > 0 || dependentTasks.length > 0) && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Link2 className="h-3.5 w-3.5 text-amber-500" />
              Dependencies & Blocker Flow
            </h4>

            {/* Blocked By */}
            {resolvedDependencies.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500">
                  Depends On (Prerequisites):
                </div>
                {resolvedDependencies.map((dep) => (
                  <div
                    key={dep.id}
                    className="dark:bg-slate-850 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      {dep.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Lock className="h-4 w-4 text-amber-500" />
                      )}
                      <span
                        className={`font-semibold ${
                          dep.status === "completed"
                            ? "text-slate-500 line-through"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {formatTaskDisplay(dep.title, dep.description).title}
                      </span>
                    </div>

                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        dep.status === "completed"
                          ? "bg-success/15 text-success"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {dep.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Blocking Others */}
            {dependentTasks.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500">
                  Blocking Following Tasks:
                </div>
                {dependentTasks.map((waiting) => (
                  <div
                    key={waiting.id}
                    className="dark:bg-slate-850 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 dark:border-slate-800 dark:text-slate-300"
                  >
                    <span>{formatTaskDisplay(waiting.title, waiting.description).title}</span>
                    <span className="text-[10px] text-slate-400">Waiting</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Checklist / Subtasks */}
        {subtasks.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <CheckSquare className="h-3.5 w-3.5 text-primary" />
              Subtasks Checklist
            </h4>
            <div className="space-y-1.5">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => handleToggleSubtask(st.id)}
                  className="dark:bg-slate-850 flex cursor-pointer select-none items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => {}}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span
                    className={`${
                      st.completed
                        ? "text-slate-400 line-through dark:text-slate-500"
                        : "font-medium text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 🔄 Dynamic Task Reallocation & Ownership (Admin / Manager Only) ── */}
        {isPrivileged && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Task Reallocation & Ownership
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Reassign task to another team member or transfer to another department
                  </p>
                </div>
              </div>
              <Badge variant="default" className="text-[10px] font-bold">
                Admin / Manager
              </Badge>
            </div>

            {/* Reassign Form */}
            <form onSubmit={handleReassign} className="mt-3 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Employee Select */}
                <div>
                  <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <UserCheck className="h-3 w-3" />
                    <span>Assignee</span>
                  </label>
                  <select
                    value={targetAssigneeId}
                    onChange={(e) => setTargetAssigneeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-900 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Unassigned</option>
                    {orgMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName || member.full_name} ({member.role || "member"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department Select */}
                <div>
                  <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <Building2 className="h-3 w-3" />
                    <span>Department / Team</span>
                  </label>
                  <select
                    value={targetTeamId}
                    onChange={(e) => setTargetTeamId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-900 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reassignment Reason */}
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Reassignment Reason / Context (Recorded in Audit Trail)
                </label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Workload balancing, specialized skill set required, sprint pivot..."
                  maxLength={500}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Status Messages */}
              {reassignError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{reassignError}</span>
                </div>
              )}
              {reassignSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{reassignSuccess}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isReassigning}
                  className="gap-1.5 font-bold"
                >
                  {isReassigning ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5" />
                  )}
                  <span>{isReassigning ? "Reassigning..." : "Apply Reassignment"}</span>
                </Button>
              </div>
            </form>

            {/* Reassignment History Timeline */}
            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="mb-2 flex items-center justify-between">
                <h5 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <History className="h-3.5 w-3.5 text-primary" />
                  <span>Reassignment Audit Stream ({reassignmentHistory.length})</span>
                </h5>
                {isLoadingHistory && (
                  <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                )}
              </div>

              <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                {reassignmentHistory.map((item) => {
                  const actorName = item.reassignedByName || "Admin / Manager";
                  const toName = item.toUserName || "Unassigned";
                  const fromName = item.fromUserName || "Unassigned";
                  const dateStr = new Date(item.createdAt).toLocaleString();

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs transition dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Reassigned by <strong className="text-primary">{actorName}</strong>
                        </span>
                        <span>{dateStr}</span>
                      </div>

                      <div className="mt-1 flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                        <span className="truncate">{fromName}</span>
                        <ArrowRight className="h-3 w-3 flex-shrink-0 text-slate-400" />
                        <span className="truncate font-bold text-primary">{toName}</span>

                        {(item.fromTeamName || item.toTeamName) && (
                          <span className="ml-auto rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            Dept: {item.toTeamName || item.fromTeamName}
                          </span>
                        )}
                      </div>

                      {item.reason && (
                        <p className="mt-1 text-[11px] italic text-slate-500 dark:text-slate-400">
                          &ldquo;{item.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}

                {reassignmentHistory.length === 0 && !isLoadingHistory && (
                  <p className="py-2 text-center text-[11px] text-slate-400">
                    No reallocation history recorded for this task.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 🔗 File URLs & Resource Links Section ── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Link2 className="h-3.5 w-3.5 text-primary" />
              Attached File URLs & Links ({attachments.length})
            </h4>
            <span className="text-[11px] text-slate-400">
              Shared with Admin, Manager & Squad
            </span>
          </div>

          {/* Form to Add / Share File URL */}
          <form
            onSubmit={handleAddResourceLink}
            className="dark:bg-slate-850/70 space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Link Title (e.g. Figma Design, Drive Doc)"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 sm:col-span-7">
                <input
                  type="text"
                  placeholder="Paste File URL (https://drive.google.com/...)"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!linkUrl.trim() || isAddingLink}
                  className="h-auto gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold"
                >
                  {isAddingLink ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  <span>Attach URL</span>
                </Button>
              </div>
            </div>

            {linkError && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-rose-500">
                <AlertCircle className="h-3 w-3" />
                <span>{linkError}</span>
              </div>
            )}
          </form>

          {/* List of Attached Links */}
          <div className="mt-3 space-y-2">
            {attachments.map((att) => {
              const fileName = att.file_name || att.fileName || "Resource Link";
              const fileUrl = att.file_url || att.fileUrl || "#";
              const platform = getPlatformInfo(fileUrl);
              const PlatformIcon = platform.icon;
              const isCopied = copiedAttachmentId === att.id;

              return (
                <div
                  key={att.id}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm transition hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <PlatformIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-bold text-slate-900 dark:text-white">
                          {fileName}
                        </span>
                        <span
                          className={`py-0.2 rounded border px-1.5 text-[10px] font-bold ${platform.color}`}
                        >
                          {platform.name}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                        {fileUrl}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Copy Link + Open in New Tab + Delete */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyAttachmentUrl(att.id, fileUrl)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      title="Copy URL"
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                      title="Open URL in new tab"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteLink(att.id)}
                      className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:hover:bg-rose-950/40"
                      title="Remove Link"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {attachments.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400 dark:border-slate-800">
                No file URLs or links attached yet. Use the form above to attach
                resources!
              </div>
            )}
          </div>
        </div>

        {/* Comment Thread & @mention Input */}
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Activity & Comments ({comments.length})
          </h4>

          {/* Comments List */}
          <div className="mb-4 max-h-56 space-y-3 overflow-y-auto pr-1">
            {comments.map((com) => {
              const authorName =
                com.profiles?.full_name ||
                com.profiles?.fullName ||
                com.author?.full_name ||
                com.author?.fullName ||
                "Team Member";
              const commentDate =
                com.created_at || com.createdAt || new Date().toISOString();
              const commentBody = com.content || com.body || "";

              return (
                <div
                  key={com.id}
                  className="dark:bg-slate-850 space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                        {authorName.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {authorName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(commentDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="pl-7 leading-relaxed text-slate-700 dark:text-slate-300">
                    {commentBody}
                  </p>
                </div>
              );
            })}

            {comments.length === 0 && (
              <div className="py-4 text-center text-xs text-slate-400">
                No comments yet. Start the discussion below!
              </div>
            )}
          </div>

          {/* New Comment Input with @mention popup */}
          <form onSubmit={handleAddComment} className="relative">
            {/* Mention Suggestions Popup */}
            {filteredMembers.length > 0 && (
              <div className="absolute bottom-full left-0 z-20 mb-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <div className="dark:bg-slate-850 border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-700">
                  Mention Teammate
                </div>
                {filteredMembers.map((m) => {
                  const mName = m.fullName || m.full_name || "Member";
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMention(m)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-primary/10 hover:text-primary"
                    >
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                        {mName.slice(0, 1)}
                      </div>
                      <span className="font-semibold">{mName}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={handleCommentChange}
                placeholder="Write a comment... (Type @ to mention teammates)"
                rows={2}
                className="flex-1 resize-none rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || isSubmittingComment}
                className="h-10 gap-1.5 px-3.5 font-bold"
              >
                {isSubmittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Send</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>

    {/* ── ⚠️ Delete Task Confirmation Dialog Modal ── */}
    {isDeleteDialogOpen && (
      <Modal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Confirm Task Deletion"
        description="Permanent workspace safety check"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
            <div>
              <p className="font-bold text-rose-900 dark:text-rose-200">
                Are you sure you want to delete this task?
              </p>
              <p className="mt-1 leading-relaxed text-rose-700 dark:text-rose-300">
                <strong>&quot;{formatted.title}&quot;</strong> will be safely soft-deleted from the workspace. Any dependent tasks blocked by this task will have their prerequisite blocker constraints automatically cleared so workflows don&apos;t get stuck.
              </p>
            </div>
          </div>

          {deleteError && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
              <AlertCircle className="h-4 w-4" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="gap-1.5 font-bold"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>{isDeleting ? "Deleting..." : "Confirm Delete"}</span>
            </Button>
          </div>
        </div>
      </Modal>
    )}
  </>
  );
}
