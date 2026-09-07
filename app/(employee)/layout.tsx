import React from "react";
import Link from "next/link";
import { CheckSquare, User, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Logo } from "@/components/ui/Logo";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Sticky Mobile-Friendly Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
        <Logo size="md" href="/employee/dashboard" />

        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          <Link
            href="/login"
            className="flex min-h-[36px] items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Logout"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            <span>Logout</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-20 sm:p-6 sm:pb-8 lg:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:hidden">
        <Link
          href="/employee/dashboard"
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center font-semibold text-primary"
        >
          <CheckSquare className="h-5 w-5" />
          <span className="mt-0.5 text-[10px]">My Tasks</span>
        </Link>
        <Link
          href="/employee/dashboard"
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <User className="h-5 w-5" />
          <span className="mt-0.5 text-[10px] font-medium">Workspace</span>
        </Link>
      </nav>
    </div>
  );
}
