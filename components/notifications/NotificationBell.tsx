"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  Check,
  Clock,
  AlertTriangle,
  AtSign,
  UserPlus,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/infrastructure/supabase/supabaseClient";
import { captureEvent } from "@/lib/analytics/posthog";

export interface NotificationItem {
  id: string;
  user_id: string;
  type:
    | "task.assigned"
    | "task.mentioned"
    | "task.due_soon"
    | "task.overdue"
    | string;
  payload?: {
    task_id?: string;
    task_title?: string;
    actor_name?: string;
    message?: string;
  } | null;
  read_at?: string | null;
  created_at: string;
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
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
  const [activeUserId, setActiveUserId] = useState<string | undefined>(propUserId);

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
          if (!n.read_at && !seenNotifIdsRef.current.has(n.id)) {
            if (!isFirstLoadRef.current) {
              hasNewUnread = true;
            }
          }
          seenNotifIdsRef.current.add(n.id);
        });

        isFirstLoadRef.current = false;
        setNotifications(items);
        const unread = items.filter((n) => !n.read_at).length;
        setUnreadCount(unread);

        if (hasNewUnread) {
          triggerAlertFeedback();
        }
      }
    } catch {
      // Ignore network errors gracefully
    }
  }, [triggerAlertFeedback]);

  // Real-time Subscriptions & Polling
  useEffect(() => {
    fetchNotifications();

    // 1. Gentle background polling fallback
    const interval = setInterval(fetchNotifications, 12000);

    // 2. Cross-tab BroadcastChannel listener
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

    // 3. Supabase Realtime subscription
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
              setNotifications((prev) => [newNotif, ...prev.filter((x) => x.id !== newNotif.id)]);
              if (!newNotif.read_at) {
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
      clearInterval(interval);
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
    if (id === "all") {
      setNotifications(
        notifications.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } else {
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task.assigned":
        return <UserPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      case "task.mentioned":
        return <AtSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case "task.due_soon":
        return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "task.overdue":
        return <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <MessageSquare className="h-4 w-4 text-teal-600 dark:text-teal-400" />;
    }
  };

  const getNotificationBg = (type: string) => {
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

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Prominent, Visible Notification Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title="Notifications"
        className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white shadow-xs backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-primary/40 dark:hover:bg-slate-800"
      >
        <Bell
          className={`h-4.5 w-4.5 text-slate-700 transition-all duration-200 group-hover:scale-110 dark:text-slate-200 ${
            isWiggling ? "animate-bounce text-primary" : ""
          }`}
        />

        {/* Unread Counter Badge with Ping Animation */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
            <span className="relative">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ── */}
      {isOpen && (
        <div className="animate-fade-in absolute right-0 z-50 mt-2.5 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900 sm:w-96">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-850/50">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary dark:text-primary-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sound Toggle Button */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleSound}
                  className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-2xs transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  title={soundEnabled ? "Notification sound enabled (Click to mute)" : "Notification sound muted (Click to unmute)"}
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="h-3 w-3 text-emerald-500" />
                      <span>Sound</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-3 w-3 text-slate-400" />
                      <span>Muted</span>
                    </>
                  )}
                </button>
                {soundEnabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playNotificationSound();
                    }}
                    className="rounded-md border border-slate-200/60 bg-slate-100 px-1.5 py-1 text-[9px] font-bold text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    title="Play test chime"
                  >
                    Test
                  </button>
                )}
              </div>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead("all")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary transition hover:text-primary-700 dark:text-primary-400"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-84 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {notifications.map((notif) => {
              const isUnread = !notif.read_at;
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    captureEvent("notification_clicked", {
                      notificationId: notif.id,
                      type: notif.type,
                      taskId: notif.payload?.task_id,
                    });
                    if (isUnread) handleMarkAsRead(notif.id);
                  }}
                  className={`flex cursor-pointer items-start gap-3 p-3.5 text-xs transition-colors ${
                    isUnread
                      ? "bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15"
                      : "opacity-80 hover:bg-slate-50 hover:opacity-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {/* High-visibility colored icon pill */}
                  <div
                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border ${getNotificationBg(
                      notif.type
                    )} shadow-2xs`}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`leading-snug ${
                        isUnread
                          ? "font-bold text-slate-900 dark:text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {notif.payload?.message || "You have a new update."}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{formatRelativeTime(notif.created_at)}</span>
                      {notif.payload?.actor_name && (
                        <>
                          <span>•</span>
                          <span>by {notif.payload.actor_name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {isUnread && (
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-500/60" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No notifications right now
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  You&apos;re completely up to date!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
