/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // In production, NEXT_PUBLIC_APP_URL MUST be set. Log an explicit error if missing.
    if (isProd && !appUrl) {
      console.error(
        "[next.config] CRITICAL: NEXT_PUBLIC_APP_URL is not set in production. " +
        "CORS will block all cross-origin API calls. Set this variable in your deployment environment."
      );
    }

    const corsOrigin = appUrl || (isProd ? "" : "http://localhost:3000");

    const cspHeader = `
      default-src 'self';
      script-src 'self' ${isProd ? "" : "'unsafe-eval'"} 'unsafe-inline' https://app.posthog.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://*.supabase.co https://*.r2.cloudflarestorage.com;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co https://app.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://api.resend.com https://api.groq.com https://*.r2.cloudflarestorage.com;
      frame-ancestors 'none';
      form-action 'self';
      base-uri 'self';
      object-src 'none';
    `.replace(/\s{2,}/g, " ").trim();

    const corsHeaders = corsOrigin
      ? [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: corsOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      : [];

    return [
      {
        source: "/api/:path*",
        headers: corsHeaders,
      },
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
