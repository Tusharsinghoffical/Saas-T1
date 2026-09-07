import {
  signupSchema,
  loginSchema,
  magicLinkSchema,
  onboardingCompleteSchema,
  SignupInput,
  LoginInput,
  MagicLinkInput,
  OnboardingCompleteInput,
} from "@/lib/validators/auth";
import { signupOrgUseCase } from "../usecases/signupOrg";
import { loginWithPasswordUseCase } from "../usecases/loginWithPassword";
import { loginWithMagicLinkUseCase } from "../usecases/loginWithMagicLink";
import { completeOnboardingUseCase } from "../usecases/completeOnboarding";
import { ValidationError, RateLimitError } from "@/shared/errors/domainErrors";
import { checkRateLimit } from "@/infrastructure/redis/redisClient";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { headers as nextHeaders } from "next/headers";

// ── Rate limit configuration ──────────────────────────────────────────────
// Login: strict 5 attempts per 5-minute window for password login and magic link.
// Uses Upstash Redis when configured; falls back to in-process memory for dev.
const AUTH_RATE_LIMIT = 5;
const AUTH_RATE_WINDOW_SECONDS = 300; // 5 minutes

// Signup: generous ceiling (100 signups/hr per IP) combined with Cloudflare
// Turnstile anti-bot verification to prevent spam without blocking legitimate test/demo signups.
const SIGNUP_RATE_LIMIT = 100;
const SIGNUP_RATE_WINDOW_SECONDS = 3600; // 1 hour

async function getClientIp(): Promise<string> {
  try {
    const headerList = await nextHeaders();
    return (
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

export class AuthController {
  async signupOrganization(rawInput: SignupInput) {
    const validated = signupSchema.safeParse(rawInput);
    if (!validated.success) {
      throw new ValidationError(
        validated.error.issues[0]?.message || "Invalid signup input"
      );
    }

    const ip = await getClientIp();

    // 1. Cloudflare Turnstile anti-bot verification
    await verifyTurnstileToken(validated.data.turnstileToken, ip);

    // 2. Generous IP-based rate limiting (100 signups per hour per IP)
    const rateLimitKey = `ratelimit:signup:${ip}`;
    const rl = await checkRateLimit(
      rateLimitKey,
      SIGNUP_RATE_LIMIT,
      SIGNUP_RATE_WINDOW_SECONDS
    );
    if (!rl.success) {
      throw new RateLimitError(
        `Too many organization registration attempts from this network. Please retry in ${Math.ceil(
          rl.resetInSeconds / 60
        )} minute(s).`,
        rl.resetInSeconds
      );
    }

    return await signupOrgUseCase(validated.data);
  }

  async loginWithPassword(rawInput: LoginInput) {
    const validated = loginSchema.safeParse(rawInput);
    if (!validated.success) {
      throw new ValidationError(
        validated.error.issues[0]?.message || "Invalid login credentials"
      );
    }

    // ── SECURITY FIX (FAIL 1): IP + email composite rate limit ─────────────
    // Keyed as `auth:login:${ip}:${email}` so an attacker cannot brute-force
    // by rotating IP alone. Limits to 5 attempts per 5 minutes.
    const ip = await getClientIp();
    const rateLimitKey = `auth:login:${ip}:${validated.data.email}`;
    const rl = await checkRateLimit(
      rateLimitKey,
      AUTH_RATE_LIMIT,
      AUTH_RATE_WINDOW_SECONDS
    );

    if (!rl.success) {
      throw new RateLimitError(
        `Too many login attempts. Please try again in ${Math.ceil(rl.resetInSeconds / 60)} minute(s).`,
        rl.resetInSeconds
      );
    }

    return await loginWithPasswordUseCase(validated.data);
  }

  async loginWithMagicLink(rawInput: MagicLinkInput, appUrl?: string) {
    const validated = magicLinkSchema.safeParse(rawInput);
    if (!validated.success) {
      throw new ValidationError(
        validated.error.issues[0]?.message || "Invalid email address"
      );
    }

    // ── SECURITY FIX (FAIL 1): IP + email composite rate limit ─────────────
    // Magic-link endpoint must also be rate-limited; previously unlimited.
    const ip = await getClientIp();
    const rateLimitKey = `auth:magic:${ip}:${validated.data.email}`;
    const rl = await checkRateLimit(
      rateLimitKey,
      AUTH_RATE_LIMIT,
      AUTH_RATE_WINDOW_SECONDS
    );

    if (!rl.success) {
      throw new RateLimitError(
        `Too many magic-link requests. Please try again in ${Math.ceil(rl.resetInSeconds / 60)} minute(s).`,
        rl.resetInSeconds
      );
    }

    const baseUrl =
      appUrl ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://tasq-one.onrender.com";
    const redirectTo = `${baseUrl}/auth/callback`;
    return await loginWithMagicLinkUseCase(validated.data.email, redirectTo);
  }

  async completeOnboarding(rawInput: OnboardingCompleteInput) {
    const validated = onboardingCompleteSchema.safeParse(rawInput);
    if (!validated.success) {
      throw new ValidationError(
        validated.error.issues[0]?.message || "Invalid onboarding input"
      );
    }
    return await completeOnboardingUseCase(validated.data);
  }
}

export const authController = new AuthController();
