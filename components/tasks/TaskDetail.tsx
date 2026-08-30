"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type OrgMember } from "@/components/tasks/TaskFormModal";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";
import {
  Clock,
  Send,
  Paperclip,
  FileText,
  Download,
  AlertCircle,
  Loader2,
  CheckSquare,
  AtSign,
  UploadCloud,
  X,
  Link2,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export interface CommentItem {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  };
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  };
}

export interface AttachmentItem {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type?: string;
  created_at: string;
}

export interface TaskDetailProps {
  isOpen: boolean;
  onClose: () => void;
  task: KanbanTaskItem | null;
  orgMembers?: OrgMember[];
  allTasks?: KanbanTaskItem[];
  onTaskUpdated?: (updated: KanbanTaskItem) => void;
}

export function TaskDetail({
  isOpen,
  onClose,
  task,
  orgMembers = [
    { id: "mem-1", fullName: "Jane Doe", role: "admin" },
    { id: "mem-2", fullName: "Alex Smith", role: "manager" },
    { id: "mem-3", fullName: "Rohan Patel", role: "employee" },
  ],
  allTasks = [],
  onTaskUpdated,
}: TaskDetailProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // @mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Subtasks local state
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);

  useEffect(() => {
    if (!task || !isOpen) return;

    setSubtasks(task.subtasks || []);

    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/v1/tasks/${task.id}/comments`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setComments(json.data);
        }
      } catch {
        // Ignore
      }
    };

    const fetchAttachments = async () => {
      try {
        const res = await fetch(`/api/v1/tasks/${task.id}/attachments`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAttachments(json.data);
        }
      } catch {
        // Ignore
      }
    };

    fetchComments();
    fetchAttachments();
  }, [task, isOpen]);

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

    // Look back from cursor for '@'
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
    const before = newComment.slice(0, mentionIndex);
    const after = newComment.slice(textareaRef.current?.selectionStart || mentionIndex);
    const updated = `${before}@${member.fullName} ${after}`;
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
      const res = await fetch(`/api/v1/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setComments([...comments, json.data]);
        setNewComment("");
      }
    } catch {
      // Ignore
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // File Upload via Cloudflare R2 Presigned URL
  const handleFileUpload = async (file: File) => {
    setUploadError(null);

    // 10MB limit enforcement
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds the 10MB size limit.");
      return;
    }

    setIsUploading(true);
    try {
      // Step 1: Request presigned URL from API
      const presignRes = await fetch(`/api/v1/tasks/${task.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_presigned_url",
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });
      const presignJson = await presignRes.json();

      if (!presignJson.success) {
        setUploadError(presignJson.error || "Failed to generate upload URL.");
        setIsUploading(false);
        return;
      }

      const { uploadUrl, fileUrl } = presignJson.data;

      // Step 2: Upload directly to R2 (or mock in demo mode)
      if (!uploadUrl.includes("mock-upload")) {
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
      }

      // Step 3: Save attachment record
      const saveRes = await fetch(`/api/v1/tasks/${task.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_attachment",
          fileName: file.name,
          fileUrl,
          fileSize: file.size,
          fileType: file.type,
        }),
      });

      const saveJson = await saveRes.json();
      if (saveJson.success && saveJson.data) {
        setAttachments([saveJson.data, ...attachments]);
      }
    } catch {
      setUploadError("Network error during file upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredMembers =
    mentionQuery !== null
      ? orgMembers.filter((m) =>
          m.fullName.toLowerCase().includes(mentionQuery)
        )
      : [];

  const priorityVariants: Record<string, "default" | "urgent" | "warning"> = {
    low: "default",
    medium: "default",
    high: "warning",
    urgent: "urgent",
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

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
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <Badge variant={priorityVariants[task.priority] || "default"}>
            {task.priority.toUpperCase()}
          </Badge>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
            {task.status.replace("_", " ")}
          </span>
          {task.dueDate && (
            <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
              <Clock className="w-3.5 h-3.5" />
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
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
                  className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={st.completed}
                    readOnly
                    className="rounded border-slate-300 text-primary"
                  />
                  <span className={st.completed ? "line-through text-slate-400" : ""}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Attachments (Cloudflare R2) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-primary" />
              Attachments ({attachments.length})
            </h4>
            <span className="text-[11px] text-slate-400">Max 10MB per file</span>
          </div>

          {uploadError && (
            <div className="mb-2 p-2 rounded bg-urgent/10 text-urgent text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Upload Drop Zone */}
          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-primary cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/50">
            <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isUploading ? "Uploading to Cloudflare R2..." : "Click or drag to upload files"}
            </span>
            <input
              type="file"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
          </label>

          {/* Attachment List */}
          {attachments.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {att.file_name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({formatBytes(att.file_size)})
                    </span>
                  </div>

                  <a
                    href={att.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-500 hover:text-primary transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
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
                com.profiles?.full_name || com.author?.full_name || "Team Member";
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
                      {new Date(com.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 pl-7 leading-relaxed">
                    {com.content}
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
                {filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMention(m)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition"
                  >
                    <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center font-bold">
                      {m.fullName.slice(0, 1)}
                    </div>
                    <span className="font-semibold">{m.fullName}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-start">
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
                className="h-10 px-3.5 gap-1.5"
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
