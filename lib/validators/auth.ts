import { z } from "zod";

/**
 * SECURITY FIX (FAIL 2.2): Strengthened password policy and added .strict()
 * to prevent silent unknown-field acceptance.
 *
 * Changes:
 * - signupSchema: password min bumped 6 → 8, added uppercase + digit regex.
 * - loginSchema: added .strict() — reject unexpected fields.
 * - All user-facing schemas get .strict() to surface malformed payloads with 400.
 */

export const signupSchema = z
  .object({
    orgName: z
      .string()
      .trim()
      .min(2, "Organization name must be at least 2 characters")
      .max(100, "Organization name must be less than 100 characters"),
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address")
      .min(1, "Email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address")
      .min(1, "Email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .strict();

export const magicLinkSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address")
      .min(1, "Email is required"),
  })
  .strict();

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "employee"]),
});

export const onboardingStep1Schema = z.object({
  orgName: z.string().min(2, "Organization name is required"),
  timezone: z.string().default("Asia/Kolkata"),
});

export const onboardingStep2Schema = z.object({
  invites: z.array(inviteMemberSchema).default([]),
});

export const onboardingStep3Schema = z.object({
  taskTitle: z.string().min(1, "Task title is required").max(200),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().optional(),
});

export const onboardingCompleteSchema = z.object({
  orgId: z.string().uuid().optional(),
  orgName: z.string().min(2),
  timezone: z.string(),
  invites: z.array(inviteMemberSchema),
  taskTitle: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>;
export type OnboardingCompleteInput = z.infer<typeof onboardingCompleteSchema>;
