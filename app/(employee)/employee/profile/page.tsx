import React from "react";
import { ProfileSettingsView } from "@/components/profile/ProfileSettingsView";

export const metadata = {
  title: "Employee Profile & Personal Details | TASQ-ONE",
  description: "Update personal details, position, and contact info.",
};

export default function EmployeeProfilePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Profile &amp; Personal Details
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
          Update your personal details, current position, phone number, and contact info. Your position will be visible to your team and manager.
        </p>
      </div>

      <ProfileSettingsView role="employee" />
    </div>
  );
}
