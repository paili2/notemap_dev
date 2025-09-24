"use client";

import { cn } from "@/lib/cn";

type DefaultLayoutProps = {
  children: React.ReactNode;
  className?: string;
  maxWidthClassName?: string;
};

export function DefaultLayout({
  children,
  className,
  maxWidthClassName = "max-w-7xl",
}: DefaultLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div
        className={cn("mx-auto px-4 sm:px-6 lg:px-8 py-10", maxWidthClassName)}
      >
        {children}
      </div>
    </div>
  );
}
