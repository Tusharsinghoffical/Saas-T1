"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  className?: string;
  priority?: boolean;
}

export function Logo({
  size = "md",
  href = "/",
  className = "",
  priority = true,
}: LogoProps) {
  // Enhanced, prominent sizing to ensure brand logo stands out clearly
  const sizeConfig = {
    sm: { height: 48, className: "h-11 sm:h-12 w-auto max-w-[200px]" },
    md: { height: 72, className: "h-14 sm:h-16 md:h-[72px] w-auto max-w-[300px]" },
    lg: { height: 96, className: "h-18 sm:h-22 md:h-[96px] w-auto max-w-[400px]" },
    xl: { height: 120, className: "h-24 sm:h-28 md:h-[120px] w-auto max-w-[480px]" },
  }[size];

  // ONE Header .png is used for both Header and Footer
  const imageSrc = "/ONE_Header.png";
  const altText = "TASQ-ONE Logo";

  const content = (
    <div className={`inline-flex items-center select-none group transition-transform duration-200 hover:scale-[1.02] ${className}`}>
      <Image
        src={imageSrc}
        alt={altText}
        width={360}
        height={sizeConfig.height}
        className={`${sizeConfig.className} object-contain transition-all drop-shadow-xs`}
        priority={priority}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
