"use server";

import {
  type SignupInput,
  type LoginInput,
  type MagicLinkInput,
  type OnboardingCompleteInput,
} from "@/lib/validators/auth";
import { authController } from "@/domains/auth/api/authController";

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
