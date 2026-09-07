"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  TrendingUp,
  Users,
  LogOut,
  Shield,
  Briefcase,
  Radio,
  Sparkles,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Logo } from "@/components/ui/Logo";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [managerInfo, setManagerInfo] = useState<{
    fullName: string;
    email: string;
    teamName: string;
    role: string;
  }>({
    fullName: "Lead Manager",
    email: "manager@workspace.com",
    teamName: "Team Operations",
    role: "manager",
  });

  useEffect(() => {
    fetch("/api/v1/dashboard/manager")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.managerProfile) {
          setManagerInfo({
            fullName: json.data.managerProfile.fullName || "Lead Manager",
            email: json.data.managerProfile.email || "manager@workspace.com",
            teamName: json.data.managerProfile.teamName || "Team Operations",
            role: json.data.managerProfile.role || "manager",
          });
        }
      })
      .catch(() => {});
  }, []);

  const initials =
    managerInfo.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "MG";

  const navItems = [
    {
      name: "Team Kanban Board",
      href: "/manager/dashboard",
      icon: LayoutDashboard,
    },
    { name: "My Team", href: "/manager/team", icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-background-light text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* Sticky Premium Sidebar */}
      <aside className="shadow-xs sticky top-0 z-30 flex hidden h-screen w-64 flex-shrink-0 flex-col overflow-y-auto border-r border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 md:flex">
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-200/80 px-5 dark:border-slate-800">
          <Logo size="md" href="/manager/dashboard" />
        </div>

        {/* Workspace Scope Indicator */}
        <div className="px-4 pb-2 pt-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/80 p-2.5 dark:border-indigo-900/50 dark:bg-indigo-950/40">
            <div className="shadow-xs flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
                {managerInfo.teamName}
              </div>
              <div className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                Active Sprint Operations
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-3">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Workspace Hub
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "border border-primary/20 bg-primary/10 font-bold text-primary dark:text-primary-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4 text-primary" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="dark:bg-slate-850/50 flex items-center justify-between gap-2 border-t border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative flex-shrink-0">
              <div className="shadow-xs h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-500 p-[1.5px]">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-900 text-xs font-bold tracking-wider text-white">
                  {initials}
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
            </div>

            <div className="min-w-0 flex-1 text-xs">
              <div className="truncate font-bold text-slate-900 dark:text-white">
                {managerInfo.fullName}
              </div>
              <div className="flex items-center gap-1 truncate text-[10px] text-slate-500 dark:text-slate-400">
                <Shield className="h-2.5 w-2.5 text-indigo-500" />
                <span className="capitalize">{managerInfo.role}</span>
              </div>
            </div>
          </div>

          <Link
            href="/login"
            className="flex-shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-600"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Top Header */}
        <header className="shadow-xs sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <span>Manager Operations Hub</span>
              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {managerInfo.teamName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
