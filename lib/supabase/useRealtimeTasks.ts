"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/infrastructure/supabase/supabaseClient";
import { useTaskStore } from "@/store/useTaskStore";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";

/**
 * Custom hook that subscribes to Supabase Realtime changes for the 'tasks' table,
 * scoped strictly to the current organization's org_id.
 */
export function useRealtimeTasks(orgId: string = "11111111-1111-1111-1111-111111111111") {
  const { upsertTask, removeTask, setConnectionStatus } = useTaskStore();
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!orgId) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const hasSupabase =
      Boolean(supabaseUrl) && !supabaseUrl.includes("your-project-ref");

    if (!hasSupabase) {
      // Local Demo Mode: Set up browser BroadcastChannel for multi-tab real-time sync
      try {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const bc = new BroadcastChannel(`tasq-one-sync-${orgId}`);
          broadcastChannelRef.current = bc;

          bc.onmessage = (event) => {
            const { type, payload } = event.data || {};
            if (type === "UPSERT_TASK" && payload) {
              upsertTask(payload);
            } else if (type === "REMOVE_TASK" && payload?.id) {
              removeTask(payload.id);
            }
          };
          setConnectionStatus(true);
        }
      } catch (e) {
        console.warn("BroadcastChannel not supported in this environment.", e);
      }

      return () => {
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.close();
        }
      };
    }

    // Live Supabase Realtime Subscription
    const supabase = createClient();
    const channelName = `realtime:tasks:${orgId}:${Math.random().toString(36).slice(2, 9)}`;

    let channel: any = null;
    try {
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks",
            filter: `org_id=eq.${orgId}`,
          },
          (payload) => {
            const { eventType, new: newRow, old: oldRow } = payload;

            if (eventType === "INSERT" || eventType === "UPDATE") {
              const taskItem: KanbanTaskItem = {
                id: (newRow as any).id,
                title: (newRow as any).title,
                description: (newRow as any).description,
                status: (newRow as any).status,
                priority: (newRow as any).priority,
                dueDate: (newRow as any).due_date,
                due_date: (newRow as any).due_date,
              };
              upsertTask(taskItem);
            } else if (eventType === "DELETE") {
              if ((oldRow as any)?.id) {
                removeTask((oldRow as any).id);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnectionStatus(true);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setConnectionStatus(false);
          } else if (status === "CLOSED") {
            setConnectionStatus(false);
          }
        });
    } catch (err) {
      console.warn("Supabase realtime subscription failed:", err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [orgId, upsertTask, removeTask, setConnectionStatus]);
}

/**
 * Broadcasts a local task change to other tabs in demo mode.
 */
export function broadcastTaskChange(
  orgId: string,
  type: "UPSERT_TASK" | "REMOVE_TASK",
  payload: any
) {
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(`tasq-one-sync-${orgId}`);
      bc.postMessage({ type, payload });
      bc.close();
    }
  } catch {
    // Ignore error
  }
}
