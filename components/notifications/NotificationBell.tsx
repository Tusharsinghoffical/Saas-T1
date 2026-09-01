"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  Clock,
  AlertTriangle,
  AtSign,
  UserPlus,
  CheckCircle2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { captureEvent } from "@/lib/analytics/posthog";

export interface NotificationItem {
  id: string;
  user_id: string;
  type: "task.assigned" | "task.mentioned" | "task.due_soon" | "task.overdue" | string;
  payload?: {
    task_id?: string;
    task_title?: string;
    actor_name?: string;
    message?: string;
  } | null;
  read_at?: string | null;
  created_at: string;
}

export function NotificationBell({ userId }: { userId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/v1/notifications");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
        const unread = json.data.filter((n: NotificationItem) => !n.read_at).length;
        setUnreadCount(unread);
      }
    } catch {
      // Ignore network errors gracefully
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Polling fallback every 30s
    const interval = setInterval(fetchNotifications, 30000);

    // Supabase Realtime subscription if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const hasSupabase =
      Boolean(supabaseUrl) && !supabaseUrl.includes("your-project-ref");

    if (hasSupabase && userId) {
      const supabase = createClient();
      const channelId = `realtime:notifications:${userId}:${Math.random().toString(36).slice(2, 9)}`;
      let channel: any = null;

      try {
        channel = supabase
          .channel(channelId)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              const newNotif = payload.new as NotificationItem;
              setNotifications((prev) => [newNotif, ...prev]);
              setUnreadCount((prev) => prev + 1);
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Notification realtime subscription error:", err);
      }

      return () => {
        clearInterval(interval);
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }

    return () => clearInterval(interval);
  }, [userId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string = "all") => {
    // Optimistic update
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
        return <UserPlus className="w-3.5 h-3.5 text-primary" />;
      case "task.mentioned":
        return <AtSign className="w-3.5 h-3.5 text-amber-500" />;
      case "task.due_soon":
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
      case "task.overdue":
        return <AlertTriangle className="w-3.5 h-3.5 text-urgent" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-slate-400" />;
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
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-urgent text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => handleMarkAsRead("all")}
                className="text-[11px] font-semibold text-primary hover:text-primary-700 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
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
                  className={`p-3.5 flex items-start gap-3 transition cursor-pointer text-xs ${
                    isUnread
                      ? "bg-primary/[0.03] dark:bg-primary/[0.06] hover:bg-slate-50 dark:hover:bg-slate-850"
                      : "hover:bg-slate-50 dark:hover:bg-slate-850 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`leading-snug ${
                        isUnread
                          ? "font-semibold text-slate-900 dark:text-white"
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
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                No notifications right now. You&apos;re all caught up!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
