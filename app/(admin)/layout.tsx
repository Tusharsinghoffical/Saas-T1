"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  LogOut,
  Shield,
  Building2,
  Crown,
  ChevronRight,
  BarChart3,
  Layers,
  Bell,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Logo } from "@/components/ui/Logo";

interface AdminProfile {
  fullName: string;
  email: string;
  orgName: string;
  role: string;
  avatarUrl?: string | null;
  employeeCode?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/v1/dashboard/admin");
        const json = await res.json();
        if (json.success && json.data?.adminProfile) {
          setProfile(json.data.adminProfile);
        } else {
          // Fallback: try org members endpoint to get current user
          const meRes = await fetch("/api/v1/dashboard/me").catch(() => null);
          if (meRes && meRes.ok) {
            const meJson = await meRes.json();
            if (meJson.success && meJson.data?.profile) {
              const p = meJson.data.profile;
              setProfile({
                fullName: p.fullName || "Admin User",
                email: p.email || "",
                orgName: p.orgName || "Organization",
                role: "admin",
                avatarUrl: p.avatarUrl,
                employeeCode: p.employeeCode,
              });
            }
          }
        }
      } catch {
        // Non-blocking
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    { name: "Team & Access", href: "/admin/team", icon: Users, badge: null },
    {
      name: "Activity Log",
      href: "/admin/activity",
      icon: Activity,
      badge: null,
    },
    {
      name: "Analytics",
      href: "/admin/analytics-debug",
      icon: BarChart3,
      badge: "Beta",
    },
    { name: "Settings", href: "/admin/settings", icon: Settings, badge: null },
  ];

  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Sidebar ── */}
      <aside className="sticky top-0 z-30 flex hidden h-screen w-[260px] flex-shrink-0 flex-col overflow-y-auto border-r border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex">
        {/* Brand Header */}
        <div className="flex h-[68px] items-center border-b border-slate-100 bg-white px-5 dark:border-slate-800 dark:bg-slate-900">
          <Logo size="md" href="/admin/dashboard" />
        </div>

        {/* Admin Identity Card */}
        <div className="mx-4 mb-2 mt-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3.5 dark:border-primary/20">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-sm font-extrabold text-white shadow-md shadow-primary/30">
                {isLoadingProfile ? "…" : initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              {isLoadingProfile ? (
                <>
                  <div className="mb-1.5 h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                </>
              ) : (
                <>
                  <div className="truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-white">
                    {profile?.fullName || "Admin User"}
                  </div>
                  <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {profile?.email || "admin@workspace.com"}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Role & Org Row */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
              <Crown className="h-2.5 w-2.5" />
              Admin
            </span>
            <span className="inline-flex items-center gap-1 truncate text-[10px] text-slate-500 dark:text-slate-400">
              <Building2 className="h-2.5 w-2.5 flex-shrink-0 text-slate-400" />
              <span className="truncate">
                {isLoadingProfile ? "…" : profile?.orgName || "Organization"}
              </span>
            </span>
          </div>

          {/* Employee Code (if present) */}
          {!isLoadingProfile && profile?.employeeCode && (
            <div className="mt-2 font-mono text-[10px] text-slate-400">
              ID: {profile.employeeCode}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm shadow-primary/10"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : "group-hover:text-slate-700 dark:group-hover:text-slate-200"}`}
                />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="h-3 w-3 text-primary/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <Link
            href="/login"
            className="group flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[12px] font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-bold text-slate-800 dark:text-white">
                <span>Workspace Management</span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  Active
                </span>
              </div>
              {!isLoadingProfile && profile?.orgName && (
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {profile.orgName} · Admin Console
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            {/* Mobile User Pill */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-600 text-[11px] font-bold text-white">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-slate-50/50 p-6 dark:bg-slate-950/50">
          {children}
        </main>
      </div>
    </div>
  );
}
