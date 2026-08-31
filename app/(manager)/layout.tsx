"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  LogOut,
  Shield,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Logo } from "@/components/ui/Logo";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Team Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen flex bg-background-light">
      {/* Sticky Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col hidden md:flex sticky top-0 h-screen overflow-y-auto flex-shrink-0 z-30">
        {/* Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-200">
          <Logo size="md" href="/manager/dashboard" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-5 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-700 font-bold flex items-center justify-center text-xs">
              MG
            </div>
            <div className="text-xs">
              <div className="font-semibold text-slate-900">Manager View</div>
              <div className="text-[11px] text-slate-500">Team Operations</div>
            </div>
          </div>
          <Link
            href="/login"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Manager Operations Hub</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-semibold border border-emerald-500/20">
              Team Scoped
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
