"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, User } from "lucide-react";
import {
  DashboardSidebar,
  type NavGroup,
  type UserProfileInfo,
} from "@/components/navigation/DashboardSidebar";
import { DashboardHeader } from "@/components/navigation/DashboardHeader";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [managerInfo, setManagerInfo] = useState<UserProfileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Hydrate collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tasq_manager_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tasq_manager_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/v1/dashboard/manager")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.managerProfile) {
          const p = json.data.managerProfile;
          setManagerInfo({
            id: p.id,
            fullName: p.fullName || "Lead Manager",
            email: p.email || "manager@workspace.com",
            teamName: p.teamName || "Team Operations",
            role: p.role || "manager",
            position: p.position || null,
            phoneNumber: p.phoneNumber || null,
            employeeCode: p.managerCode,
            avatarUrl: p.avatarUrl,
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Real-time synchronization of personal profile details
  useEffect(() => {
    const handleProfileUpdated = (e: any) => {
      const updated = e.detail || e.data?.profile;
      if (updated) {
        setManagerInfo((prev) =>
          prev
            ? {
                ...prev,
                fullName: updated.fullName || prev.fullName,
                position:
                  updated.position !== undefined
                    ? updated.position
                    : prev.position,
                phoneNumber:
                  updated.phoneNumber !== undefined
                    ? updated.phoneNumber
                    : prev.phoneNumber,
                avatarUrl:
                  updated.avatarUrl !== undefined
                    ? updated.avatarUrl
                    : prev.avatarUrl,
              }
            : null
        );
      }
    };

    window.addEventListener("tasq:profile_updated", handleProfileUpdated);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("tasq-profile-channel");
        bc.onmessage = (event) => {
          if (event.data?.profile) {
            handleProfileUpdated({ detail: event.data.profile });
          }
        };
      }
    } catch {}

    return () => {
      window.removeEventListener("tasq:profile_updated", handleProfileUpdated);
      if (bc) bc.close();
    };
  }, []);

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        title: "Sprint Hub",
        items: [
          {
            name: "Team Kanban Board",
            href: "/manager/dashboard",
            icon: LayoutDashboard,
          },
        ],
      },
      {
        title: "Squad",
        items: [
          {
            name: "My Team",
            href: "/manager/team",
            icon: Users,
          },
        ],
      },
      {
        title: "Account",
        items: [
          {
            name: "My Profile",
            href: "/manager/profile",
            icon: User,
          },
        ],
      },
    ],
    []
  );

  const breadcrumbs = useMemo(() => {
    const team = managerInfo?.teamName || "Squad";
    if (pathname?.includes("/manager/team")) {
      return [{ label: team }, { label: "Manager" }, { label: "My Team" }];
    }
    return [{ label: team }, { label: "Manager" }, { label: "Kanban Board" }];
  }, [pathname, managerInfo?.teamName]);

  const initials = managerInfo?.fullName
    ? managerInfo.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "MG";

  return (
    <div className="flex min-h-screen bg-slate-50/70 dark:bg-slate-950">
      {/* ── Redesigned Modern Sidebar ── */}
      <DashboardSidebar
        role="manager"
        user={managerInfo}
        isLoadingUser={isLoading}
        navGroups={navGroups}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        homeHref="/manager/dashboard"
      />

      {/* ── Main Interface Area ── */}
      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300">
        <DashboardHeader
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          breadcrumbs={breadcrumbs}
          isRealtimeConnected={true}
          userInitials={initials}
          userId={managerInfo?.id}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
