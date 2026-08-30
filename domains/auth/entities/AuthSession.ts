/**
 * Pure Domain Entity: AuthSession & UserCredentials
 * ZERO framework or database imports.
 */

export interface AuthSession {
  userId: string;
  orgId: string;
  role: "admin" | "manager" | "employee";
  email: string;
}

export interface SignupCredentials {
  orgName: string;
  fullName: string;
  email: string;
  password?: string;
  timezone?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface OnboardingData {
  orgId?: string;
  orgName: string;
  timezone: string;
  invites: { email: string; role: "admin" | "manager" | "employee" }[];
  taskTitle: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
}
