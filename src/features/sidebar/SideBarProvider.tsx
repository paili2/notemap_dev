"use client";
import { createContext, useContext } from "react";
import { useSidebarState } from "./hooks/useSidebarState";

const SidebarCtx = createContext<ReturnType<typeof useSidebarState> | null>(
  null
);

export function SideBarProvider({ children }: { children: React.ReactNode }) {
  const state = useSidebarState();
  return <SidebarCtx.Provider value={state}>{children}</SidebarCtx.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
