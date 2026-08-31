"use server";

import {
  type SignupInput,
  type LoginInput,
  type MagicLinkInput,
  type OnboardingCompleteInput,
} from "@/lib/validators/auth";
import { authController } from "@/domains/auth/api/authController";
import { userController } from "@/domains/users/api/userController";
import { InviteUserInput } from "@/domains/users/usecases/inviteUser";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action for signing up an organization and its primary admin user.
 */
export async function signupOrganization(
  rawInput: SignupInput
): Promise<ActionResult<{ orgId: string; orgName: string; userId: string }>> {
  try {
    const data = await authController.signupOrganization(rawInput);
    return {
      success: true,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "An unexpected error occurred during signup.",
    };
  }
}

/**
 * Server Action for completing the 3-step onboarding wizard.
 */
export async function completeOnboarding(
  rawInput: OnboardingCompleteInput
): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    const data = await authController.completeOnboarding(rawInput);
    return {
      success: true,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to complete onboarding.",
    };
  }
}

/**
 * Server Action for signing in with Email and Password.
 */
export async function loginWithPassword(
  rawInput: LoginInput
): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    const data = await authController.loginWithPassword(rawInput);
    return {
      success: true,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "An unexpected error occurred during login.",
    };
  }
}

/**
 * Server Action for sending Magic Link OTP.
 */
export async function loginWithMagicLink(
  rawInput: MagicLinkInput
): Promise<ActionResult<{ message: string }>> {
  try {
    const data = await authController.loginWithMagicLink(rawInput);
    return {
      success: true,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "An unexpected error occurred sending magic link.",
    };
  }
}

/**
 * Server Action for accepting an employee invite and setting a new password.
 */
export async function acceptInviteAction(
  password: string
): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    await userController.acceptInvite(password);
    return {
      success: true,
      data: { redirectUrl: "/employee/dashboard" },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to accept invitation.",
    };
  }
}

/**
 * Server Action for inviting an employee or manager.
 */
export async function inviteMemberAction(
  input: InviteUserInput
): Promise<ActionResult<{ message: string }>> {
  try {
    const result = await userController.inviteMember(input);
    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to dispatch invitation.",
    };
  }
}

/**
 * Server Action for deactivating/soft-deleting a team member.
 */
export async function removeMemberAction(
  targetUserId: string
): Promise<ActionResult<{ message: string }>> {
  try {
    const result = await userController.removeMember(targetUserId);
    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to deactivate team member.",
    };
  }
}
