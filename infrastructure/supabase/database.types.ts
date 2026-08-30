export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "manager" | "employee";
export type TaskStatus = "pending" | "in_progress" | "in_review" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          timezone: string;
          slack_webhook_url?: string | null;
          slack_notifications_enabled?: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          timezone?: string;
          slack_webhook_url?: string | null;
          slack_notifications_enabled?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          timezone?: string;
          slack_webhook_url?: string | null;
          slack_notifications_enabled?: boolean | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          full_name: string | null;
          role: UserRole;
          avatar_url: string | null;
          notification_preferences?: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          notification_preferences?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          notification_preferences?: Json | null;
          created_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          manager_id: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          manager_id?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          manager_id?: string | null;
        };
      };
      team_members: {
        Row: {
          team_id: string;
          user_id: string;
        };
        Insert: {
          team_id: string;
          user_id: string;
        };
        Update: {
          team_id?: string;
          user_id?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          org_id: string;
          team_id: string | null;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          due_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          team_id?: string | null;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          team_id?: string | null;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_assignees: {
        Row: {
          task_id: string;
          user_id: string;
        };
        Insert: {
          task_id: string;
          user_id: string;
        };
        Update: {
          task_id?: string;
          user_id?: string;
        };
      };
      task_dependencies: {
        Row: {
          task_id: string;
          depends_on_task_id: string;
        };
        Insert: {
          task_id: string;
          depends_on_task_id: string;
        };
        Update: {
          task_id?: string;
          depends_on_task_id?: string;
        };
      };
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          user_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id?: string | null;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string | null;
          body?: string;
          created_at?: string;
        };
      };
      task_attachments: {
        Row: {
          id: string;
          task_id: string;
          file_url: string;
          file_name: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          file_url: string;
          file_name?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          file_url?: string;
          file_name?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          payload: Json | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          payload?: Json | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          payload?: Json | null;
          read_at?: string | null;
          created_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          org_id: string;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          diff: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          actor_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          diff?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          actor_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          diff?: Json | null;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          org_id: string;
          plan: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          cancel_at_period_end?: boolean | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          updated_at: string;
        };
        Insert: {
          org_id: string;
          plan: string;
          status: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          cancel_at_period_end?: boolean | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          updated_at?: string;
        };
        Update: {
          org_id?: string;
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          cancel_at_period_end?: boolean | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
