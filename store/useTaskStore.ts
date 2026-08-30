import { create } from "zustand";
import { type KanbanTaskItem } from "@/components/tasks/TaskCard";

export interface TaskState {
  tasks: KanbanTaskItem[];
  isLoading: boolean;
  isConnected: boolean;
  lastSyncedAt: string | null;
  activeFilter: string | null;

  // Actions
  setTasks: (tasks: KanbanTaskItem[]) => void;
  upsertTask: (task: KanbanTaskItem) => void;
  removeTask: (taskId: string) => void;
  updateTaskStatusOptimistic: (taskId: string, status: KanbanTaskItem["status"]) => void;
  setConnectionStatus: (isConnected: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setActiveFilter: (filter: string | null) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: false,
  isConnected: true,
  lastSyncedAt: null,
  activeFilter: null,

  setTasks: (tasks) =>
    set({
      tasks,
      lastSyncedAt: new Date().toISOString(),
      isLoading: false,
    }),

  // Handles both INSERT and UPDATE from Supabase Realtime & API calls
  upsertTask: (task) =>
    set((state) => {
      const existingIndex = state.tasks.findIndex((t) => t.id === task.id);

      if (existingIndex >= 0) {
        const existing = state.tasks[existingIndex];
        // Preserve optimistic subtasks/assignees if incoming payload is partial
        const merged: KanbanTaskItem = {
          ...existing,
          ...task,
          assignees: task.assignees || existing.assignees,
          subtasks: task.subtasks || existing.subtasks,
          tags: task.tags || existing.tags,
        };

        const updatedTasks = [...state.tasks];
        updatedTasks[existingIndex] = merged;
        return { tasks: updatedTasks, lastSyncedAt: new Date().toISOString() };
      }

      // New task insertion
      return {
        tasks: [task, ...state.tasks],
        lastSyncedAt: new Date().toISOString(),
      };
    }),

  // Handles DELETE from Realtime
  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      lastSyncedAt: new Date().toISOString(),
    })),

  // Optimistic status update on card drag & drop
  updateTaskStatusOptimistic: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    })),

  setConnectionStatus: (isConnected) => set({ isConnected }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),
}));
