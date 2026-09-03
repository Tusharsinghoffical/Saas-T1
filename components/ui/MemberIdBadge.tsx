"use client";

import React, { useState } from "react";
import { Copy, Check, Hash, Shield, Briefcase, UserCheck } from "lucide-react";
import { formatMemberCode, getShortId, MemberRole } from "@/lib/memberId";

interface MemberIdBadgeProps {
  id: string;
  role?: MemberRole;
  showIcon?: boolean;
  copyMode?: "full" | "code";
  className?: string;
  size?: "sm" | "md";
}

export function MemberIdBadge({
  id,
  role = "employee",
  showIcon = true,
  copyMode = "full",
  className = "",
  size = "sm",
}: MemberIdBadgeProps) {
  const [copied, setCopied] = useState(false);

  const memberCode = formatMemberCode(id, role);
  const shortId = getShortId(id);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = copyMode === "full" ? id : memberCode;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleStyles =
    role === "admin"
      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25 hover:border-purple-500/40"
      : role === "manager"
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25 hover:border-blue-500/40"
      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:border-emerald-500/40";

  const sizeStyles =
    size === "sm"
      ? "text-[10px] py-0.5 px-2 gap-1 rounded-md"
      : "text-xs py-1 px-2.5 gap-1.5 rounded-lg";

  return (
    <div
      onClick={handleCopy}
      title={`Click to copy ${copyMode === "full" ? "Full UUID" : "Member Code"}: ${id}`}
      className={`inline-flex items-center border font-mono font-bold cursor-pointer transition-all select-none group ${roleStyles} ${sizeStyles} ${className}`}
    >
      {showIcon && (
        <span className="opacity-70">
          {role === "admin" ? (
            <Shield className="w-2.5 h-2.5" />
          ) : role === "manager" ? (
            <Briefcase className="w-2.5 h-2.5" />
          ) : (
            <Hash className="w-2.5 h-2.5" />
          )}
        </span>
      )}
      <span>{memberCode}</span>
      <span className="opacity-40 text-[9px] hidden sm:inline font-sans font-normal">
        ({shortId})
      </span>

      <span className="ml-0.5 p-0.5 rounded opacity-60 group-hover:opacity-100 transition-opacity">
        {copied ? (
          <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in" />
        ) : (
          <Copy className="w-2.5 h-2.5" />
        )}
      </span>

      {copied && (
        <span className="text-[9px] font-sans font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
          Copied!
        </span>
      )}
    </div>
  );
}
