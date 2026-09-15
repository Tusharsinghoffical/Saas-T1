import { z } from "zod";

// Schema for client-side environment variables (exposed to browser via NEXT_PUBLIC_)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .optional()
    .default("https://tasq-one.onrender.com"),
  NEXT_PUBLIC_ENABLE_BILLING: z.string().optional().default("false"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
    .min(1, "NEXT_PUBLIC_SUPABASE_URL is required")
    .refine(
      (val) => {
        if (process.env.NODE_ENV === "production") {
          return (
            !val.includes("your-project-ref") &&
            !val.includes("dummy") &&
            !val.includes("placeholder")
          );
        }
        return true;
      },
      {
        message:
          "NEXT_PUBLIC_SUPABASE_URL cannot contain placeholder values in production",
      }
    ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
    .refine(
      (val) => {
        if (process.env.NODE_ENV === "production") {
          return (
            !val.includes("your-supabase-anon-key") &&
            !val.includes("dummy") &&
            !val.includes("placeholder")
          );
        }
        return true;
      },
      {
        message:
          "NEXT_PUBLIC_SUPABASE_ANON_KEY cannot contain placeholder values in production",
      }
    ),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z
    .string()
    .optional()
    .default("1x00000000000000000000AA"),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_POSTHOG_HOST: z
    .string()
    .optional()
    .default("https://app.posthog.com"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url("Must be a valid URL").optional(),
});

// Schema for server-side environment variables (Edge & Node.js runtimes)
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required")
    .refine(
      (val) => {
        if (process.env.NODE_ENV === "production") {
          return (
            !val.includes("your-supabase-service-role-key") &&
            !val.includes("dummy") &&
            !val.includes("placeholder")
          );
        }
        return true;
      },
      {
        message:
          "SUPABASE_SERVICE_ROLE_KEY cannot contain placeholder values in production",
      }
    ),
  TURNSTILE_SECRET_KEY: z
    .string()
    .optional()
    .default("1x0000000000000000000000000000000AA"),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required for AI features"),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_R2_BUCKET: z.string().optional(),
  CLOUDFLARE_R2_ENDPOINT: z.string().optional(),
  RESEND_API_KEY: z
    .string()
    .min(1, "RESEND_API_KEY is required for transactional emails"),
  EMAIL_FROM: z
    .string()
    .optional()
    .default("TASQ-ONE <notifications@tasq-one.com>"),
  CRON_SECRET: z
    .string()
    .min(1, "CRON_SECRET is required for scheduled tasks & cron endpoints"),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),
  STRIPE_PRICE_ID_ENTERPRISE: z.string().optional(),
  SENTRY_DSN: z.string().url("Must be a valid URL").optional(),
});

// Combined schema
const mergedEnvSchema = clientEnvSchema.merge(serverEnvSchema);

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type Env = z.infer<typeof mergedEnvSchema>;

function formatZodErrors(issues: z.ZodIssue[]): string {
  const missing = issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  return `\n❌ Invalid or Missing Environment Variables:\n${missing}\n\nPlease check your .env.local file or refer to .env.local.example.\n`;
}

/**
 * Validates and loads environment variables at runtime.
 * Throws a formatted error if any required variables are missing or invalid.
 */
export function validateEnv(): Env {
  // Allow skipping validation during certain CI/test steps if explicitly set
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return process.env as unknown as Env;
  }

  const isServer = typeof window === "undefined";

  if (!isServer) {
    // Client-only validation
    const clientResult = clientEnvSchema.safeParse({
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_ENABLE_BILLING: process.env.NEXT_PUBLIC_ENABLE_BILLING,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY:
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });

    if (!clientResult.success) {
      console.error(formatZodErrors(clientResult.error.issues));
      throw new Error(
        "Client environment variable validation failed. See console for details."
      );
    }
    return clientResult.data as Env;
  }

  // Server-side validation (all variables)
  const serverResult = mergedEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENABLE_BILLING: process.env.NEXT_PUBLIC_ENABLE_BILLING,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY:
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    CLOUDFLARE_R2_BUCKET: process.env.CLOUDFLARE_R2_BUCKET,
    CLOUDFLARE_R2_ENDPOINT: process.env.CLOUDFLARE_R2_ENDPOINT,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    CRON_SECRET: process.env.CRON_SECRET,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID_PRO: process.env.STRIPE_PRICE_ID_PRO,
    STRIPE_PRICE_ID_ENTERPRISE: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_DSN: process.env.SENTRY_DSN,
  });

  if (!serverResult.success) {
    const errorMsg = formatZodErrors(serverResult.error.issues);
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return serverResult.data;
}

// Export lazy/cached env accessor helper
let cachedEnv: Env | null = null;
export const getEnv = (): Env => {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
};
