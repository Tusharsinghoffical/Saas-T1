import React from "react";
import Link from "next/link";
import { CheckSquare, User, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Logo } from "@/components/ui/Logo";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sticky Mobile-Friendly Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <Logo size="md" href="/employee/dashboard" />

        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          <Link
            href="/login"
            className="text-xs font-semibold px-3 py-1.5 min-h-[36px] flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            <span>Logout</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-40 px-2 shadow-lg">
        <Link
          href="/employee/dashboard"
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] text-primary font-semibold"
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">My Tasks</span>
        </Link>
        <Link
          href="/employee/dashboard"
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Workspace</span>
        </Link>
      </nav>
    </div>
  );
}
