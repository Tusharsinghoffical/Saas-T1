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

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
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

  const initials = managerInfo.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "MG";

  const navItems = [
    { name: "Team Kanban Board", href: "/manager/dashboard", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen flex bg-background-light dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Sticky Premium Sidebar */}
      <aside className="w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col hidden md:flex sticky top-0 h-screen overflow-y-auto flex-shrink-0 z-30 shadow-xs">
        {/* Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
          <Logo size="md" href="/manager/dashboard" />
        </div>

        {/* Workspace Scope Indicator */}
        <div className="px-4 pt-4 pb-2">
          <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200 truncate">
                {managerInfo.teamName}
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                Active Sprint Operations
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-3 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pb-1">
            Workspace Hub
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                  isActive
                    ? "bg-primary/10 text-primary dark:text-primary-400 font-bold border border-primary/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 text-primary" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-500 p-[1.5px] shadow-xs">
                <div className="w-full h-full rounded-[10px] bg-slate-900 text-white font-bold flex items-center justify-center text-xs tracking-wider">
                  {initials}
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>

            <div className="text-xs min-w-0 flex-1">
              <div className="font-bold text-slate-900 dark:text-white truncate">
                {managerInfo.fullName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-indigo-500" />
                <span className="capitalize">{managerInfo.role}</span>
              </div>
            </div>
          </div>

          <Link
            href="/login"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition flex-shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Manager Operations Hub</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                {managerInfo.teamName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
