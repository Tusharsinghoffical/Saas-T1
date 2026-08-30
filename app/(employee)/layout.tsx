import React from "react";
import Link from "next/link";
import { CheckSquare, User, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Logo } from "@/components/ui/Logo";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      {/* Sticky Mobile-Friendly Header */}
      <header className="h-20 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <Logo size="md" href="/employee/dashboard" />

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/admin/dashboard"
            className="text-xs font-semibold px-3 py-1.5 min-h-[36px] flex items-center rounded-lg bg-slate-100 text-slate-700 hover:bg-primary/10 hover:text-primary transition"
          >
            ← Admin View
          </Link>
          <NotificationBell />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-20 sm:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-40 px-2 shadow-lg">
        <Link
          href="/employee/dashboard"
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] text-primary"
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Tasks</span>
        </Link>
        <Link
          href="/employee/dashboard"
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] text-slate-500 hover:text-slate-900"
        >
          <span className="text-[10px] font-medium">Alerts</span>
        </Link>
        <Link
          href="/employee/dashboard"
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] text-slate-500 hover:text-slate-900"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
