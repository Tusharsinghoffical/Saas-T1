/**
 * Pure Domain Entities: UserProfile & TeamMember
 * ZERO framework or database imports.
 */

export interface UserProfile {
  id: string;
  orgId: string | null;
  fullName: string | null;
  role: "admin" | "manager" | "employee";
  avatarUrl?: string | null;
  email?: string;
  notificationPreferences?: Record<string, boolean> | null;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  openTaskCount?: number;
  skills?: string[];
}
