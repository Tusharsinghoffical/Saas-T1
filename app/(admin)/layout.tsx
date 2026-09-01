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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, badge: null },
    { name: "Team & Access", href: "/admin/team", icon: Users, badge: null },
    { name: "Activity Log", href: "/admin/activity", icon: Activity, badge: null },
    { name: "Analytics", href: "/admin/analytics-debug", icon: BarChart3, badge: "Beta" },
    { name: "Settings", href: "/admin/settings", icon: Settings, badge: null },
  ];

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* ── Sidebar ── */}
      <aside className="w-[260px] border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col hidden md:flex sticky top-0 h-screen overflow-y-auto flex-shrink-0 z-30 shadow-sm">

        {/* Brand Header */}
        <div className="h-[68px] px-5 flex items-center border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Logo size="md" href="/admin/dashboard" />
        </div>

        {/* Admin Identity Card */}
        <div className="mx-4 mt-4 mb-2 p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 dark:border-primary/20">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-sm font-extrabold shadow-md shadow-primary/30">
                {isLoadingProfile ? "…" : initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              {isLoadingProfile ? (
                <>
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1.5" />
                  <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <div className="text-[13px] font-bold text-slate-900 dark:text-white truncate leading-tight">
                    {profile?.fullName || "Admin User"}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {profile?.email || "admin@workspace.com"}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Role & Org Row */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
              <Crown className="w-2.5 h-2.5" />
              Admin
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
              <Building2 className="w-2.5 h-2.5 flex-shrink-0 text-slate-400" />
              <span className="truncate">{isLoadingProfile ? "…" : (profile?.orgName || "Organization")}</span>
            </span>
          </div>

          {/* Employee Code (if present) */}
          {!isLoadingProfile && profile?.employeeCode && (
            <div className="mt-2 text-[10px] text-slate-400 font-mono">
              ID: {profile.employeeCode}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-xl transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm shadow-primary/10"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "group-hover:text-slate-700 dark:group-hover:text-slate-200"}`} />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3 h-3 text-primary/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Org Info Footer */}
        <div className="mx-3 mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Workspace</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Organization</span>
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">
                {isLoadingProfile ? "…" : (profile?.orgName || "—")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Plan</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary">
                <Layers className="w-2.5 h-2.5" /> Pro
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/login"
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[13px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>Workspace Management</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  Active
                </span>
              </div>
              {!isLoadingProfile && profile?.orgName && (
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {profile.orgName} · Admin Console
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            {/* Mobile User Pill */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-[11px] font-bold">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-950/50">{children}</main>
      </div>
    </div>
  );
}
