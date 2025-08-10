"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type DefaultLayoutProps = {
  children: React.ReactNode;
  className?: string;
  maxWidthClassName?: string; // 기본: max-w-7xl
};

export function DefaultLayout({
  children,
  className,
  maxWidthClassName = "max-w-7xl",
}: DefaultLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div
        className={cn("mx-auto px-4 sm:px-6 lg:px-8 py-6", maxWidthClassName)}
      >
        {children}
      </div>
    </div>
  );
}
