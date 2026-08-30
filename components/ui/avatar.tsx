/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
}

export function Avatar({ name = "User", src, size = "md", className, ...props }: AvatarProps) {
  const sizeStyles = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  };

  const getInitials = (n: string) => {
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  if (src) {
    return (
      <div
        className={cn(
          "relative rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-slate-900",
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <img src={src} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-slate-900 select-none",
        sizeStyles[size],
        className
      )}
      title={name}
      {...props}
    >
      {getInitials(name)}
    </div>
  );
}

export function AvatarGroup({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center -space-x-2 overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}
