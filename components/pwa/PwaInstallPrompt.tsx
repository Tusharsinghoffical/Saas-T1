"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Check if already installed
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone)
    ) {
      setIsInstalled(true);
      return;
    }

    // 3. Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).__tasq_pwa_prompt = e;
      // Check if user dismissed previously in this session
      const dismissed = sessionStorage.getItem("tasq_pwa_dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    const handleCustomOpen = () => {
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("open-pwa-install", handleCustomOpen);

    // 4. Listen for appinstalled event
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("open-pwa-install", handleCustomOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent =
      deferredPrompt ||
      (typeof window !== "undefined"
        ? (window as any).__tasq_pwa_prompt
        : null);
    if (promptEvent) {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setIsVisible(false);
      setDeferredPrompt(null);
    } else {
      // Direct instruction if browser already handles PWA through address bar or standalone
      alert(
        "To install TASQ-ONE:\n• On Chrome/Edge: Click the Install icon in the browser address bar\n• On iOS Safari: Tap Share -> 'Add to Home Screen'\n• On Android: Tap menu -> 'Install app'"
      );
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("tasq_pwa_dismissed", "true");
  };

  if (!mounted || isInstalled || !isVisible) {
    return null;
  }

  return (
    <div className="animate-fade-in fixed bottom-5 right-5 z-50 mx-4 flex w-full max-w-sm items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:mx-0">
      <div className="flex h-10 w-auto flex-shrink-0 items-center justify-center">
        <Image
          src="/ONE_Header.png"
          alt="TASQ-ONE Logo"
          width={60}
          height={44}
          className="h-9 w-auto object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <span>Install TASQ-ONE</span>
            <span className="py-0.2 rounded bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
              PWA
            </span>
          </h4>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
          Install the desktop/mobile app for offline task viewing and fast
          navigation.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-700"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install App</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-[36px] rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
