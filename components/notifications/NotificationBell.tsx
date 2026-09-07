"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  Check,
  Clock,
  AlertTriangle,
  AtSign,
  UserPlus,
  UserCheck,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/infrastructure/supabase/supabaseClient";
import { captureEvent } from "@/lib/analytics/posthog";

export interface NotificationItem {
  id: string;
  user_id?: string;
  userId?: string;
  type:
    | "task.assigned"
    | "task.mentioned"
    | "task.due_soon"
    | "task.overdue"
    | string;
  payload?: {
    task_id?: string;
    taskId?: string;
    task_title?: string;
    taskTitle?: string;
    actor_name?: string;
    actorName?: string;
    message?: string;
    reason?: string | null;
    priority?: string;
  } | null;
  read_at?: string | null;
  readAt?: string | null;
  created_at?: string;
  createdAt?: string;
}

/**
 * High-quality Web Audio chime sound synthesizer.
 * Produces a crystal-clear, premium Apple/Linear style notification chime
 * with zero external file dependencies or network latency.
 */
export function playNotificationSound() {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Harmonic bell chime - Tone 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // Ramp to A5

    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.4);

    // Harmonic bell chime - Tone 2: C#6 (1108.73 Hz) sparkle
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1108.73, now + 0.08);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.16, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch {
    // Graceful fallback if audio context is blocked by browser autoplay policy
  }
}

export function NotificationBell({ userId: propUserId }: { userId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isWiggling, setIsWiggling] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | undefined>(
    propUserId
  );
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Initialize sound preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tasq_notification_sound");
      if (stored !== null) {
        setSoundEnabled(stored === "true");
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tasq_notification_sound", String(next));
      } catch {
        // Ignore
      }
      if (next) playNotificationSound();
      return next;
    });
  };

  // Fetch current user id if not provided
  useEffect(() => {
    if (propUserId) {
      setActiveUserId(propUserId);
      return;
    }
    fetch("/api/v1/dashboard/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.profile?.id) {
          setActiveUserId(json.data.profile.id);
        }
      })
      .catch(() => {});
  }, [propUserId]);

  const triggerAlertFeedback = useCallback(() => {
    if (soundEnabled) {
      playNotificationSound();
    }
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 1200);
  }, [soundEnabled]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/notifications");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const items: NotificationItem[] = json.data;

        // Check if there are brand new notifications that we haven't seen yet
        let hasNewUnread = false;
        items.forEach((n) => {
          const isUnread = !n.read_at && !n.readAt;
          if (isUnread && !seenNotifIdsRef.current.has(n.id)) {
            if (!isFirstLoadRef.current) {
              hasNewUnread = true;
            }
          }
          seenNotifIdsRef.current.add(n.id);
        });

        isFirstLoadRef.current = false;
        setNotifications(items);
        const unread = items.filter((n) => !n.read_at && !n.readAt).length;
        setUnreadCount(unread);

        if (hasNewUnread) {
          triggerAlertFeedback();
        }
      }
    } catch {
      // Ignore network errors gracefully
    }
  }, [triggerAlertFeedback]);

  // Real-time Subscriptions (BroadcastChannel & Supabase)
  useEffect(() => {
    fetchNotifications();

    // 1. Cross-tab BroadcastChannel listener
    let notifBc: BroadcastChannel | null = null;
    let activityBc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        notifBc = new BroadcastChannel("tasq-notifications-channel");
        notifBc.onmessage = () => {
          fetchNotifications();
        };

        activityBc = new BroadcastChannel("tasq-activity-channel");
        activityBc.onmessage = () => {
          fetchNotifications();
        };
      }
    } catch {
      // Ignore
    }

    // 2. Supabase Realtime subscription
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const hasSupabase =
      Boolean(supabaseUrl) && !supabaseUrl.includes("your-project-ref");

    let channel: any = null;
    if (hasSupabase) {
      try {
        const supabase = createClient();
        const channelId = `realtime:notifications:${activeUserId || "global"}:${Math.random().toString(36).slice(2, 9)}`;

        const channelConfig = activeUserId
          ? {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${activeUserId}`,
            }
          : {
              event: "*",
              schema: "public",
              table: "notifications",
            };

        channel = (supabase as any)
          .channel(channelId)
          .on("postgres_changes", channelConfig, (payload: any) => {
            const newNotif = payload.new as NotificationItem;
            if (newNotif && newNotif.id) {
              setNotifications((prev) => [
                newNotif,
                ...prev.filter((x) => x.id !== newNotif.id),
              ]);
              if (!newNotif.read_at && !newNotif.readAt) {
                setUnreadCount((prev) => prev + 1);
                triggerAlertFeedback();
              }
            } else {
              fetchNotifications();
            }
          })
          .subscribe();
      } catch (err) {
        console.warn("Notification realtime subscription error:", err);
      }
    }

    return () => {
      if (notifBc) notifBc.close();
      if (activityBc) activityBc.close();
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [activeUserId, fetchNotifications, triggerAlertFeedback]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string = "all") => {
    const nowIso = new Date().toISOString();
    if (id === "all") {
      setNotifications(
        notifications.map((n) => ({
          ...n,
          read_at: n.read_at || nowIso,
          readAt: n.readAt || nowIso,
        }))
      );
      setUnreadCount(0);
    } else {
      setNotifications(
        notifications.map((n) =>
          n.id === id
            ? { ...n, read_at: n.read_at || nowIso, readAt: n.readAt || nowIso }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Ignore
    }
  };

  const getNotificationIcon = (type: string, message?: string) => {
    if (message?.toLowerCase().includes("reassigned")) {
      return (
        <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      );
    }
    switch (type) {
      case "task.assigned":
        return (
          <UserPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        );
      case "task.mentioned":
        return <AtSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case "task.due_soon":
        return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "task.overdue":
        return (
          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        );
      default:
        return (
          <MessageSquare className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        );
    }
  };

  const getNotificationBg = (type: string, message?: string) => {
    if (message?.toLowerCase().includes("reassigned")) {
      return "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/60";
    }
    switch (type) {
      case "task.assigned":
        return "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60";
      case "task.mentioned":
        return "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60";
      case "task.due_soon":
        return "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60";
      case "task.overdue":
        return "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60";
      default:
        return "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60";
    }
  };

  const getNotificationTypeLabel = (notif: NotificationItem) => {
    const msg = notif.payload?.message?.toLowerCase() || "";
    if (msg.includes("reassigned")) return "Reassigned";
    switch (notif.type) {
      case "task.assigned":
        return "Assigned";
      case "task.mentioned":
        return "Mention";
      case "task.due_soon":
        return "Due Soon";
      case "task.overdue":
        return "Overdue";
      default:
        return "Activity";
    }
  };

  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return "Recently";
    const date = new Date(isoString);
    const timeMs = date.getTime();
    if (isNaN(timeMs)) return "Recently";

    const diffMs = Math.max(0, Date.now() - timeMs);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const displayedNotifications = notifications.filter((n) => {
    if (filterTab === "unread") {
      return !n.read_at && !n.readAt;
    }
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Notification Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title="Notifications"
        className={`group relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 ${
          isOpen
            ? "border-primary bg-primary/10 text-primary shadow-xs"
            : "border-slate-200/90 bg-white text-slate-700 shadow-xs hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-primary/40 dark:hover:bg-slate-800"
        }`}
      >
        <Bell
          className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
            isWiggling ? "animate-bounce text-primary" : ""
          }`}
        />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
            <span className="relative">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* ── Mobile Backdrop to prevent overlapping clicks ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[65] bg-slate-950/20 backdrop-blur-xs sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Dropdown Panel with High Z-Index and Non-Overlapping Layout ── */}
      {isOpen && (
        <div className="animate-fade-in fixed inset-x-2 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full z-[70] mt-2 sm:w-[420px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/98 shadow-2xl backdrop-blur-2xl dark:border-slate-800/90 dark:bg-slate-900/98 flex flex-col max-h-[min(560px,calc(100vh-5rem))]">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-850/80 flex-shrink-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary dark:text-primary-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={toggleSound}
                className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-2xs transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                title={
                  soundEnabled
                    ? "Notification sound enabled (Click to mute)"
                    : "Notification sound muted (Click to unmute)"
                }
              >
                {soundEnabled ? (
                  <Volume2 className="h-3 w-3 text-emerald-500" />
                ) : (
                  <VolumeX className="h-3 w-3 text-slate-400" />
                )}
                <span className="hidden xs:inline">
                  {soundEnabled ? "Sound" : "Muted"}
                </span>
              </button>

              {/* Mark All Read Button */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead("all")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary transition hover:text-primary-700 dark:text-primary-400"
                >
                  <Check className="h-3 w-3" />
                  <span>Mark read</span>
                </button>
              )}

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 sm:hidden"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Segment Tabs */}
          <div className="flex border-b border-slate-100 bg-white px-3 py-2 dark:border-slate-800/80 dark:bg-slate-900 flex-shrink-0">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5 text-xs font-semibold dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={`rounded-lg px-2.5 py-1 text-[11px] transition ${
                  filterTab === "all"
                    ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("unread")}
                className={`rounded-lg px-2.5 py-1 text-[11px] transition ${
                  filterTab === "unread"
                    ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 dark:divide-slate-800/60">
            {displayedNotifications.map((notif) => {
              const isUnread = !notif.read_at && !notif.readAt;
              const createdDate = notif.createdAt || notif.created_at;
              const actor =
                notif.payload?.actor_name || notif.payload?.actorName;
              const taskTitle =
                notif.payload?.task_title || notif.payload?.taskTitle;
              const reason = notif.payload?.reason;
              const message =
                notif.payload?.message || "You have a new update.";

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    captureEvent("notification_clicked", {
                      notificationId: notif.id,
                      type: notif.type,
                      taskId: notif.payload?.task_id || notif.payload?.taskId,
                    });
                    if (isUnread) handleMarkAsRead(notif.id);
                  }}
                  className={`group relative flex cursor-pointer items-start gap-3 p-3.5 transition-all duration-150 ${
                    isUnread
                      ? "bg-primary/[0.035] hover:bg-primary/[0.07] dark:bg-primary/[0.07] dark:hover:bg-primary/[0.12]"
                      : "bg-transparent hover:bg-slate-50/90 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {/* Left Column: Icon Pill */}
                  <div
                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border shadow-2xs ${getNotificationBg(
                      notif.type,
                      message
                    )}`}
                  >
                    {getNotificationIcon(notif.type, message)}
                  </div>

                  {/* Middle Column: Text & Content */}
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Top row: Type Tag + Relative Time */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isUnread
                            ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {getNotificationTypeLabel(notif)}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {formatRelativeTime(createdDate)}
                      </span>
                    </div>

                    {/* Main Message */}
                    <p
                      className={`text-xs leading-relaxed ${
                        isUnread
                          ? "font-semibold text-slate-900 dark:text-white"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {message}
                    </p>

                    {/* Optional Task Title Pill */}
                    {taskTitle && (
                      <div className="flex items-center gap-1 pt-0.5 text-[11px]">
                        <span className="truncate rounded-md bg-slate-100/90 px-1.5 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 max-w-full">
                          📌 {taskTitle}
                        </span>
                      </div>
                    )}

                    {/* Optional Reason Quote */}
                    {reason && (
                      <div className="text-[11px] italic text-slate-500 dark:text-slate-400 border-l-2 border-primary/40 pl-2">
                        &ldquo;{reason}&rdquo;
                      </div>
                    )}

                    {/* Footer: Actor Info & Quick Mark as Read */}
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      <span>{actor ? `by ${actor}` : "System event"}</span>

                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          className="flex items-center gap-0.5 text-primary opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                          title="Mark as read"
                        >
                          <Check className="h-2.5 w-2.5" />
                          <span>Mark read</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: Unread Pulse Dot */}
                  {isUnread && (
                    <span className="mt-2 flex h-2 w-2 flex-shrink-0 relative">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>
                  )}
                </div>
              );
            })}

            {/* Empty State */}
            {displayedNotifications.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500/70" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {filterTab === "unread"
                    ? "All caught up!"
                    : "No notifications right now"}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {filterTab === "unread"
                    ? "You have no unread notifications."
                    : "When tasks are assigned or updated, you'll see them here."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
