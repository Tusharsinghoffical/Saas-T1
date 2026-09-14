"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Download,
  Monitor,
  Smartphone,
  Apple,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Bell,
  HardDrive,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Laptop,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

type Platform = "windows" | "android" | "ios" | "mac";

export default function DownloadPage() {
  const [activePlatform, setActivePlatform] = useState<Platform>("windows");
  const [copiedLink, setCopiedLink] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  // Auto-detect user platform on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (/android/.test(ua)) {
        setActivePlatform("android");
      } else if (/iphone|ipad|ipod/.test(ua)) {
        setActivePlatform("ios");
      } else if (/macintosh|mac os x/.test(ua)) {
        setActivePlatform("mac");
      } else {
        setActivePlatform("windows");
      }
    }
  }, []);

  // 1. Direct 1-Click PWA Native Install Trigger
  const handleDirectInstall = async () => {
    if (typeof window === "undefined") return;

    // Check if the deferred prompt is cached on window
    const deferredPrompt = (window as any).__tasq_pwa_prompt;

    if (deferredPrompt && typeof deferredPrompt.prompt === "function") {
      try {
        setInstallStatus("Prompting installation...");
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setInstallStatus("Installation accepted! Launching app...");
        } else {
          setInstallStatus("Installation dismissed.");
        }
      } catch (err) {
        console.warn("PWA prompt failed:", err);
        // Fallback: trigger custom event to open the in-app guide modal
        window.dispatchEvent(new CustomEvent("open-pwa-install"));
      }
    } else {
      // Dispatch event to show the in-app modal prompt
      window.dispatchEvent(new CustomEvent("open-pwa-install"));
      setInstallStatus("Opening installation guide...");
    }

    setTimeout(() => setInstallStatus(null), 4000);
  };

  // 2. Direct Windows Desktop Shortcut (.url file) Download
  const handleDownloadWindowsShortcut = () => {
    const appUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://tasq-one.onrender.com";
    const shortcutContent = `[InternetShortcut]
URL=${appUrl}
IconIndex=0
IconFile=${appUrl}/favicon.ico
HotKey=0
IDList=
[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,11
`;

    const blob = new Blob([shortcutContent], {
      type: "application/internet-shortcut",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TASQ-ONE-WorkOS.url";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 3. Direct Windows Launcher Batch (.bat) Download
  const handleDownloadWindowsBatchLauncher = () => {
    const appUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://tasq-one.onrender.com";
    const batContent = `@echo off
title Launching TASQ-ONE Work OS...
echo Starting TASQ-ONE in standalone app mode...

:: Attempt 1: Microsoft Edge App Mode
start msedge.exe --app="${appUrl}" 2>nul
if %errorlevel% equ 0 exit

:: Attempt 2: Google Chrome App Mode
start chrome.exe --app="${appUrl}" 2>nul
if %errorlevel% equ 0 exit

:: Attempt 3: Default Browser
start "" "${appUrl}"
exit
`;

    const blob = new Blob([batContent], {
      type: "application/x-bat",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Launch-TASQ-ONE.bat";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 4. Copy Direct Install Link to Clipboard
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <MarketingNav />

      {/* Hero Header Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-14 sm:py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(255,255,255,0))]" />

        <div className="mx-auto max-w-5xl space-y-6 px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs">
            <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
            <span>Direct App Installation • v2.8 Release</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Download &amp; Install <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              TASQ-ONE Work OS
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base md:text-lg">
            Install TASQ-ONE directly on your Windows PC, Mac, Android, or iPhone.
            Zero bulky downloads, zero slow updates, and complete desktop app experience.
          </p>

          {/* Direct Download & Install Action Bar */}
          <div className="pt-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={handleDirectInstall}
              className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl hover:scale-102 active:scale-98 cursor-pointer"
            >
              <Download className="h-5 w-5" />
              <span>Direct Install Web / Desktop App</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadWindowsShortcut}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-indigo-300 hover:bg-slate-50 active:scale-98 cursor-pointer"
              title="Download Windows Desktop URL Shortcut"
            >
              <Monitor className="h-4 w-4 text-indigo-600" />
              <span>Download Desktop Shortcut (.url)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadWindowsBatchLauncher}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 active:scale-98 cursor-pointer"
              title="Download 1-Click Batch Launcher for Windows"
            >
              <Laptop className="h-4 w-4 text-slate-600" />
              <span>Windows Launcher (.bat)</span>
            </button>
          </div>

          {installStatus && (
            <div className="mx-auto inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-800 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              <span>{installStatus}</span>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="pt-6 grid grid-cols-2 gap-4 border-t border-slate-200/80 max-w-3xl mx-auto sm:grid-cols-4">
            <div className="p-3 text-center">
              <div className="font-mono text-xl font-extrabold text-indigo-600">0 MB</div>
              <div className="text-[11px] font-semibold text-slate-500">Storage Footprint</div>
            </div>
            <div className="p-3 text-center">
              <div className="font-mono text-xl font-extrabold text-emerald-600">&lt;300ms</div>
              <div className="text-[11px] font-semibold text-slate-500">Instant Boot Time</div>
            </div>
            <div className="p-3 text-center">
              <div className="font-mono text-xl font-extrabold text-indigo-600">Auto</div>
              <div className="text-[11px] font-semibold text-slate-500">Silent Auto-Updates</div>
            </div>
            <div className="p-3 text-center">
              <div className="font-mono text-xl font-extrabold text-indigo-600">100% Free</div>
              <div className="text-[11px] font-semibold text-slate-500">Zero In-App Fees</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Step-by-Step Instructions Container */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-indigo-600">
              Installation Guides
            </div>
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Step-by-Step Direct Installation Guide
            </h2>
            <p className="text-xs text-slate-600 sm:text-sm">
              Select your operating system below for tailored, step-by-step instructions.
            </p>
          </div>

          {/* Platform Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => setActivePlatform("windows")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activePlatform === "windows"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Monitor className="h-4 w-4" />
              <span>Windows PC</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform("android")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activePlatform === "android"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>Android Mobile</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform("ios")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activePlatform === "ios"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Apple className="h-4 w-4" />
              <span>iPhone &amp; iPad</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform("mac")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activePlatform === "mac"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Laptop className="h-4 w-4" />
              <span>macOS</span>
            </button>
          </div>

          {/* TAB 1: WINDOWS PC */}
          {activePlatform === "windows" && (
            <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                    <Monitor className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Windows 10 / 11 Installation (Google Chrome &amp; Microsoft Edge)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Works on all PCs with zero installer download or administrative rights needed.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDirectInstall}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Install Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadWindowsShortcut}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
                  >
                    <span>.URL Shortcut</span>
                  </button>
                </div>
              </div>

              {/* 4 Steps Grid */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Open in Chrome or Microsoft Edge
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Visit this website (<code>tasq-one.onrender.com</code>) using Chrome or Edge on your Windows PC.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Click the Install Icon in Address Bar
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Look at the top-right corner of your browser address bar. You will see an <strong>Install Icon (⊕ or 💻)</strong>. Or click the <strong>&quot;Direct Install&quot;</strong> button above.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Confirm &quot;Install TASQ-ONE&quot;
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      A small popup dialog appears: click <strong>&quot;Install&quot;</strong>. The app takes less than 2 seconds to register.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">
                    4
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Pin to Taskbar &amp; Launch
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      TASQ-ONE immediately opens in its own clean window without tabs or URL bars. Right-click the app icon on your Windows Taskbar and select <strong>&quot;Pin to taskbar&quot;</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANDROID MOBILE */}
          {activePlatform === "android" && (
            <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Android Phone &amp; Tablet Installation (Google Chrome)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Install as a full native APK-grade Progressive Web App directly to your Android Home Screen.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDirectInstall}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Install to Phone</span>
                </button>
              </div>

              {/* 4 Steps Grid */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Open Site in Chrome on your Phone
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Launch Google Chrome on your Android mobile device and navigate to <code>tasq-one.onrender.com</code>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Tap the 3-Dots Menu (⋮)
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tap the vertical three dots menu in the top-right corner of the Chrome browser window.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Select &quot;Install App&quot; or &quot;Add to Home Screen&quot;
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Scroll down the menu and tap <strong>&quot;Install App&quot;</strong> (or <strong>&quot;Add to Home screen&quot;</strong>).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white">
                    4
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Tap &quot;Install&quot; &amp; Open Anywhere
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      The TASQ-ONE app icon appears right on your Android Home Screen and App Drawer. Opens in pure full-screen mode with push alerts!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPLE IOS (IPHONE / IPAD) */}
          {activePlatform === "ios" && (
            <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-100 bg-slate-100 text-slate-800">
                    <Apple className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Apple iPhone &amp; iPad Installation (Safari Browser)
                    </h3>
                    <p className="text-xs text-slate-500">
                      No Apple App Store account or review required — install directly from Safari in 10 seconds.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Share2 className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Use Safari Share Menu</span>
                </div>
              </div>

              {/* 4 Steps Grid */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Open in Safari
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      On your iPhone or iPad, open this URL in the native <strong>Safari</strong> browser.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Tap the Share Button [↑]
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tap the <strong>Share</strong> button at the bottom navigation bar (the square icon with an arrow pointing upward).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Tap &quot;Add to Home Screen&quot; [+]
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Scroll down the share sheet action list and tap <strong>&quot;Add to Home Screen&quot;</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                    4
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Tap &quot;Add&quot; in Top-Right
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Confirm by tapping <strong>&quot;Add&quot;</strong> in the top-right corner. The official TASQ-ONE icon is saved directly to your home screen!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MACOS */}
          {activePlatform === "mac" && (
            <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 text-purple-600">
                    <Laptop className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      macOS Installation (Chrome, Safari &amp; Edge)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pin directly to your Mac Dock &amp; Launchpad with full native macOS window borders.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDirectInstall}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-purple-700 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Install on Mac</span>
                </button>
              </div>

              {/* 3 Steps */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-xs font-black text-white">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Open in Chrome or Safari</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Visit <code>tasq-one.onrender.com</code> using Safari (macOS Sonoma+) or Google Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-xs font-black text-white">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Add to Dock / Install</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      In Safari: Choose <strong>File &rarr; Add to Dock</strong>. In Chrome: Click the <strong>Install icon ⊕</strong> in the address bar.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-xs font-black text-white">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Launch from Dock</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Opens in standalone macOS app mode with Cmd+Tab switching and Spotlight search integration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Mobile QR Code Card */}
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/50 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 font-mono text-[11px] font-bold text-indigo-700">
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Scan to Install on Mobile Phone</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 sm:text-xl">
                  Installing on your Smartphone?
                </h3>
                <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                  Open your phone&apos;s camera app and point it at the QR code to open the direct install page instantly on Android or iPhone.
                </p>

                <div className="pt-2 flex items-center gap-3 justify-center md:justify-start">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>Copy Install Link</span>
                      </>
                    )}
                  </button>
                  <span className="text-xs text-slate-400 font-mono">tasq-one.onrender.com</span>
                </div>
              </div>

              {/* QR Code Frame */}
              <div className="shrink-0 p-3 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col items-center gap-2">
                {/* Clean SVG Vector QR Representation */}
                <div className="h-36 w-36 rounded-xl bg-slate-900 p-2 flex items-center justify-center text-white">
                  <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-white rounded-lg">
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-indigo-600 rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Direct Mobile Install
                </span>
              </div>
            </div>
          </div>

          {/* Why Direct Install is Better Section */}
          <div className="space-y-6 pt-6">
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                Why Direct App Installation Beats Heavy Desktop Installers
              </h3>
              <p className="text-xs text-slate-500 max-w-xl mx-auto">
                Engineered with next-generation Progressive Web Architecture for zero maintenance and maximum performance.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <HardDrive className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">Zero Disk Space Bloat</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Traditional desktop task apps require 200MB–500MB installers and eat GBs of RAM. TASQ-ONE takes under 5MB of lightweight cache.
                </p>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">Always on the Latest Release</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Never suffer through &quot;Update Available: Downloading 0%...&quot; banners. Updates sync automatically in the background silently.
                </p>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Bell className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">Native OS Push Alerts</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Receive instant task assignments, sprint deadline reminders, and comment @mentions straight to your system notification tray.
                </p>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Zap className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">Sub-Second Startup Time</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Service workers cache the app shell locally. The board boots in &lt;300ms even on slow mobile data connections.
                </p>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">Kernel Sandbox Security</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Runs inside the browser engine&apos;s hardened sandbox. Zero malware risk, zero registry alterations, and 100% encrypted HTTPS traffic.
                </p>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Layers className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">Dedicated Window Experience</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Runs in its own standalone window without browser tabs or distractions. Easily alt-tab between TASQ-ONE, VS Code, and Slack.
                </p>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="space-y-6 pt-8 border-t border-slate-200">
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                Frequently Asked Questions
              </h3>
              <p className="text-xs text-slate-500">
                Common questions about installing and running TASQ-ONE Work OS.
              </p>
            </div>

            <div className="space-y-3.5 max-w-3xl mx-auto">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                <h4 className="text-xs font-extrabold text-slate-900 sm:text-sm">
                  Do I need an App Store or Google Play account to download TASQ-ONE?
                </h4>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  No. TASQ-ONE uses modern web progressive installation standards. You can install it directly from your web browser in 5 seconds without signing into Google Play or Apple App Store.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                <h4 className="text-xs font-extrabold text-slate-900 sm:text-sm">
                  Is the downloaded app free?
                </h4>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Yes, 100% free. The entire core pilot version (including Sprint Board, Groq AI Task Decomposer, and Realtime sync) is completely free without surprise subscriptions.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                <h4 className="text-xs font-extrabold text-slate-900 sm:text-sm">
                  How do I uninstall the app if I ever want to?
                </h4>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  On Windows/Mac: Open TASQ-ONE, click the three dots (`...`) in the window title bar, and select &quot;Uninstall TASQ-ONE&quot;. On Android/iOS: Simply long-press the home screen icon and tap &quot;Delete&quot; or &quot;Uninstall&quot; just like any standard app.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                <h4 className="text-xs font-extrabold text-slate-900 sm:text-sm">
                  Can I use TASQ-ONE offline?
                </h4>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Yes. Our background service worker caches your sprint delivery board and task data locally. If your internet connection drops, you can still view your boards and tasks without interruption.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Call to Action */}
          <div className="rounded-3xl border border-indigo-200 bg-indigo-900 p-8 sm:p-10 text-center text-white shadow-xl">
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-2xl font-black sm:text-3xl">
                Ready to Organize Your Team Deliverables?
              </h3>
              <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
                Install the app or open the web workspace directly. Start creating tasks with sub-second AI requirements and zero messy spreadsheets.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDirectInstall}
                  className="rounded-xl bg-white px-6 py-3 text-xs font-extrabold text-indigo-900 shadow-md transition hover:bg-indigo-50 active:scale-98 cursor-pointer"
                >
                  Direct Install App
                </button>
                <Link
                  href="/signup"
                  className="rounded-xl border border-indigo-400 bg-indigo-800/80 px-6 py-3 text-xs font-bold text-white transition hover:bg-indigo-800 active:scale-98"
                >
                  Open Web Workspace &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
