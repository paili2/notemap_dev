"use client";

import { SideBarProvider } from "@/features/sidebar/SideBarProvider";

export default function SidebarProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SideBarProvider>{children}</SideBarProvider>;
}
