"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: (error?: any) => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: (error: any) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({
  onVerify,
  onError,
  className = "",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"; // Cloudflare always-passes testing sitekey

  useEffect(() => {
    // In test environment, automatically trigger onVerify with a mock token
    if (process.env.NODE_ENV === "test") {
      onVerify("test-turnstile-token");
      return;
    }

    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {}
      widgetIdRef.current = null;
    }

    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "auto",
        callback: (token: string) => {
          onVerify(token);
        },
        "error-callback": (err: any) => {
          if (onError) onError(err);
        },
        "expired-callback": () => {
          onVerify("");
        },
      });
      widgetIdRef.current = widgetId;
    } catch (err) {
      console.error("[Turnstile] Render error:", err);
      if (onError) onError(err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, siteKey, onVerify, onError]);

  return (
    <div
      className={`turnstile-widget-wrapper my-3 flex flex-col items-center justify-center ${className}`}
    >
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />
      <div
        ref={containerRef}
        className="flex min-h-[65px] items-center justify-center"
      />
    </div>
  );
}
