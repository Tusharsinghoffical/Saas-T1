"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";
import { createClient } from "@/lib/supabase/client";
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
  onTaskUpdated?: (updated: KanbanTaskItem) => void;
}

// Helper to identify platform type & branding
function getPlatformInfo(url: string) {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
      return { name: "Google Drive", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: Globe };
    }
    if (host.includes("figma.com")) {
      return { name: "Figma", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: Sparkles };
    }
    if (host.includes("github.com") || host.includes("gitlab.com")) {
      return { name: "GitHub / Repo", color: "bg-slate-800 text-slate-200 border-slate-700", icon: FileCode };
    }
    if (host.includes("notion.so") || host.includes("notion.site")) {
      return { name: "Notion", color: "bg-stone-500/10 text-stone-600 dark:text-stone-300 border-stone-500/20", icon: FileText };
    }
    if (host.includes("loom.com") || host.includes("youtube.com") || host.includes("vimeo.com")) {
      return { name: "Video / Loom", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", icon: Video };
    }
    if (host.includes("dropbox.com") || host.includes("box.com")) {
      return { name: "Cloud Storage", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: Globe };
    }

    return { name: host.replace(/^www\./, ""), color: "bg-primary/10 text-primary border-primary/20", icon: ExternalLink };
  } catch {
    return { name: "Web Resource", color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", icon: Link2 };
  }
}

export function TaskDetail({
  isOpen,
  onClose,
  task,
  orgMembers = [
    { id: "mem-1", fullName: "Jane Doe", full_name: "Jane Doe", role: "admin" },
    { id: "mem-2", fullName: "Alex Smith", full_name: "Alex Smith", role: "manager" },
    { id: "mem-3", fullName: "Rohan Patel", full_name: "Rohan Patel", role: "employee" },
  ],
  allTasks = [],
  onTaskUpdated,
}: TaskDetailProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Link Attachment State
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copiedAttachmentId, setCopiedAttachmentId] = useState<string | null>(null);
  const [copiedTaskShare, setCopiedTaskShare] = useState(false);

  // @mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Subtasks local state
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);

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

  useEffect(() => {
    if (!task || !isOpen) return;

    setSubtasks(task.subtasks || []);
    fetchComments();
    fetchAttachments();

    // Realtime channel for task comments & attachments
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const hasSupabase = Boolean(supabaseUrl) && !supabaseUrl.includes("your-project-ref");
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
  }, [task, isOpen, fetchComments, fetchAttachments]);

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
    const after = newComment.slice(textareaRef.current?.selectionStart || mentionIndex);
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
        alert(json.error || json.message || "Failed to post comment. Please try again.");
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

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let title = linkTitle.trim();
    if (!title) {
      try {
        const u = new URL(cleanUrl);
        title = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
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
        setLinkError(json.error || "Failed to save link to workspace database.");
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      description={`Task ID: ${task.id}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Blocked Warning Banner */}
        {isBlocked && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
            <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900 dark:text-amber-200">
                This task is currently BLOCKED
              </div>
              <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                It cannot be moved to &quot;In Progress&quot; or &quot;Completed&quot; until all prerequisite dependencies are Completed.
              </p>
            </div>
          </div>
        )}

        {/* Task Badges & Meta Info */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={priorityVariants[task.priority] || "default"}>
              {task.priority.toUpperCase()}
            </Badge>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
              {task.status.replace("_", " ")}
            </span>
            {dueDateStr && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Due: {new Date(dueDateStr).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Quick Share Task URL Button */}
          <button
            type="button"
            onClick={copyTaskShareLink}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary transition border border-slate-200 dark:border-slate-700"
            title="Copy Direct Task URL Link"
          >
            {copiedTaskShare ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedTaskShare ? "Task Link Copied!" : "Share Task"}</span>
          </button>
        </div>

        {/* Task Description */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Description
          </h4>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
            {task.description || "No description provided."}
          </div>
        </div>

        {/* Task Dependencies & Blocking Relationships */}
        {(resolvedDependencies.length > 0 || dependentTasks.length > 0) && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-amber-500" />
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
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {dep.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-500" />
                      )}
                      <span
                        className={`font-semibold ${
                          dep.status === "completed"
                            ? "text-slate-500 line-through"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {dep.title}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <span>{waiting.title}</span>
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-primary" />
              Subtasks Checklist
            </h4>
            <div className="space-y-1.5">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => handleToggleSubtask(st.id)}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs select-none"
                >
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => {}}
                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                  <span
                    className={`${
                      st.completed
                        ? "line-through text-slate-400 dark:text-slate-500"
                        : "text-slate-800 dark:text-slate-200 font-medium"
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 🔗 File URLs & Resource Links Section ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-primary" />
              Attached File URLs & Links ({attachments.length})
            </h4>
            <span className="text-[11px] text-slate-400">
              Shared with Admin, Manager & Squad
            </span>
          </div>

          {/* Form to Add / Share File URL */}
          <form
            onSubmit={handleAddResourceLink}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200 dark:border-slate-800 space-y-2.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Link Title (e.g. Figma Design, Drive Doc)"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="sm:col-span-7 flex gap-2">
                <input
                  type="text"
                  placeholder="Paste File URL (https://drive.google.com/...)"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!linkUrl.trim() || isAddingLink}
                  className="gap-1 px-3 whitespace-nowrap text-xs font-bold h-auto py-2 rounded-xl"
                >
                  {isAddingLink ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Attach URL</span>
                </Button>
              </div>
            </div>

            {linkError && (
              <div className="text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
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
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm hover:border-primary/40 transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-400">
                      <PlatformIcon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {fileName}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${platform.color}`}>
                          {platform.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                        {fileUrl}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Copy Link + Open in New Tab + Delete */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => copyAttachmentUrl(att.id, fileUrl)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Copy URL"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs bg-primary/10 text-primary hover:bg-primary hover:text-white transition"
                      title="Open URL in new tab"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteLink(att.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition opacity-0 group-hover:opacity-100"
                      title="Remove Link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {attachments.length === 0 && (
              <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No file URLs or links attached yet. Use the form above to attach resources!
              </div>
            )}
          </div>
        </div>

        {/* Comment Thread & @mention Input */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Activity & Comments ({comments.length})
          </h4>

          {/* Comments List */}
          <div className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
            {comments.map((com) => {
              const authorName =
                com.profiles?.full_name ||
                com.profiles?.fullName ||
                com.author?.full_name ||
                com.author?.fullName ||
                "Team Member";
              const commentDate = com.created_at || com.createdAt || new Date().toISOString();
              const commentBody = com.content || com.body || "";

              return (
                <div
                  key={com.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
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

                  <p className="text-slate-700 dark:text-slate-300 pl-7 leading-relaxed">
                    {commentBody}
                  </p>
                </div>
              );
            })}

            {comments.length === 0 && (
              <div className="text-center py-4 text-xs text-slate-400">
                No comments yet. Start the discussion below!
              </div>
            )}
          </div>

          {/* New Comment Input with @mention popup */}
          <form onSubmit={handleAddComment} className="relative">
            {/* Mention Suggestions Popup */}
            {filteredMembers.length > 0 && (
              <div className="absolute bottom-full mb-1 left-0 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700">
                  Mention Teammate
                </div>
                {filteredMembers.map((m) => {
                  const mName = m.fullName || m.full_name || "Member";
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMention(m)}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition"
                    >
                      <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center font-bold">
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
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition resize-none"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || isSubmittingComment}
                className="h-10 px-3.5 gap-1.5 font-bold"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
