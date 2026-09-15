import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/infrastructure/redis/redisClient";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { AuthController } from "@/domains/auth/api/authController";
import { ValidationError, RateLimitError } from "@/shared/errors/domainErrors";

describe("STEP 2: Signup vs. Login Rate Limiting & Anti-Abuse Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Cloudflare Turnstile Bot Verification", () => {
    it("rejects signup when Turnstile token is missing/undefined", async () => {
      await expect(
        verifyTurnstileToken(undefined, "192.168.1.1")
      ).rejects.toThrow(ValidationError);
      await expect(
        verifyTurnstileToken(undefined, "192.168.1.1")
      ).rejects.toThrow(/Bot verification required/i);
    });

    it("rejects signup when Turnstile token is an empty string", async () => {
      await expect(verifyTurnstileToken("", "192.168.1.1")).rejects.toThrow(
        ValidationError
      );
    });

    it("accepts Cloudflare test-pass dummy token (1x0000000000000000000000000000000AA)", async () => {
      const result = await verifyTurnstileToken(
        "1x0000000000000000000000000000000AA",
        "192.168.1.1"
      );
      expect(result).toBe(true);
    });

    it("accepts Cloudflare browser widget issued token in test/developer mode", async () => {
      const browserToken = "0.7h298s0192jfk.opaque-cloudflare-turnstile-token";
      const result = await verifyTurnstileToken(browserToken, "127.0.0.1");
      expect(result).toBe(true);
    });

    it("rejects bot-token simulation string", async () => {
      await expect(
        verifyTurnstileToken("bot-token", "192.168.1.1")
      ).rejects.toThrow(/Bot activity detected/i);
    });

    it("rejects Cloudflare test-fail dummy token (2x0000000000000000000000000000000AA)", async () => {
      await expect(
        verifyTurnstileToken(
          "2x0000000000000000000000000000000AA",
          "192.168.1.1"
        )
      ).rejects.toThrow(ValidationError);
      await expect(
        verifyTurnstileToken(
          "2x0000000000000000000000000000000AA",
          "192.168.1.1"
        )
      ).rejects.toThrow(/verification failed/i);
    });
  });

  describe("2. Company Signup Generous Rate Limiting (100 signups/hr ceiling per IP)", () => {
    it("allows a burst of 10 repeated signups from the same IP without rate limit block", async () => {
      const testIp = `burst-test-ip-${Date.now()}`;
      const signupRateLimitKey = `ratelimit:signup:${testIp}`;

      for (let i = 1; i <= 10; i++) {
        const rl = await checkRateLimit(signupRateLimitKey, 100, 3600);
        expect(rl.success).toBe(true);
        expect(rl.remaining).toBe(100 - i);
      }
    });

    it("blocks registration when 100 signups/hour ceiling is exceeded", async () => {
      const floodIp = `flood-ip-${Date.now()}`;
      const signupRateLimitKey = `ratelimit:signup:${floodIp}`;

      // Simulate 100 successful signups
      for (let i = 1; i <= 100; i++) {
        const rl = await checkRateLimit(signupRateLimitKey, 100, 3600);
        expect(rl.success).toBe(true);
      }

      // Attempt 101 MUST be blocked
      const blocked = await checkRateLimit(signupRateLimitKey, 100, 3600);
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.resetInSeconds).toBeGreaterThan(0);
    });
  });

  describe("3. Strict Login Rate Limiting (5 attempts / 5 minutes per IP+email)", () => {
    it("permits up to 5 login attempts, then strictly triggers rate limit at attempt 6", async () => {
      const ip = "10.0.0.99";
      const email = `victim-${Date.now()}@acme.com`;
      const loginRateLimitKey = `auth:login:${ip}:${email}`;

      // Attempts 1 through 5: allowed
      for (let attempt = 1; attempt <= 5; attempt++) {
        const rl = await checkRateLimit(loginRateLimitKey, 5, 300);
        expect(rl.success).toBe(true);
        expect(rl.remaining).toBe(5 - attempt);
      }

      // Attempt 6: strictly blocked
      const attempt6 = await checkRateLimit(loginRateLimitKey, 5, 300);
      expect(attempt6.success).toBe(false);
      expect(attempt6.remaining).toBe(0);
      expect(attempt6.resetInSeconds).toBeGreaterThan(0);
    });

    it("isolates rate limiting per email even from the same IP (composite key)", async () => {
      const ip = "10.0.0.100";
      const emailA = `user-a-${Date.now()}@acme.com`;
      const emailB = `user-b-${Date.now()}@acme.com`;

      const keyA = `auth:login:${ip}:${emailA}`;
      const keyB = `auth:login:${ip}:${emailB}`;

      // Max out attempts on emailA
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(keyA, 5, 300);
      }
      const breachA = await checkRateLimit(keyA, 5, 300);
      expect(breachA.success).toBe(false);

      // emailB from the same IP is NOT blocked
      const freshB = await checkRateLimit(keyB, 5, 300);
      expect(freshB.success).toBe(true);
      expect(freshB.remaining).toBe(4);
    });
  });

  describe("4. AuthController End-to-End Rate Limiting & Turnstile Guard", () => {
    const controller = new AuthController();

    it("signupOrganization: blocks automated signup missing Turnstile token before touching database", async () => {
      const input = {
        orgName: "Automated Bot Corp",
        fullName: "Bot Script",
        email: `bot-${Date.now()}@spam.com`,
        password: "ValidPassword123!",
        // turnstileToken omitted
      };

      await expect(controller.signupOrganization(input as any)).rejects.toThrow(
        ValidationError
      );
      await expect(controller.signupOrganization(input as any)).rejects.toThrow(
        /verification required/i
      );
    });

    it("loginWithPassword: triggers RateLimitError on 6th consecutive attempt", async () => {
      const fixedEmail = `brute-${Date.now()}@target.com`;
      const input = {
        email: fixedEmail,
        password: "WrongPassword123!",
      };

      // First 5 attempts may fail credentials in usecase, but pass rate limiter
      for (let i = 1; i <= 5; i++) {
        try {
          await controller.loginWithPassword(input);
        } catch (err: any) {
          // Expected credential or connection error, NOT RateLimitError
          expect(err.name).not.toBe("RateLimitError");
        }
      }

      // 6th attempt MUST throw RateLimitError
      await expect(controller.loginWithPassword(input)).rejects.toThrow(
        RateLimitError
      );
      await expect(controller.loginWithPassword(input)).rejects.toThrow(
        /Too many login attempts/i
      );
    });
  });
});
