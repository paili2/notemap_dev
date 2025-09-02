"use client";

import SidebarToggleButton from "./components/SidebarToggleButton";
import { ToggleSidebarProps } from "./types";

export default function ToggleSidebar({
  isSidebarOn,
  onToggleSidebar,
  offsetTopPx = 12,
}: ToggleSidebarProps) {
  return (
    <div
      className="absolute right-3"
      style={{ top: offsetTopPx, zIndex: 90, pointerEvents: "none" }}
    >
      <div className="flex items-center gap-2 pointer-events-auto">
        <SidebarToggleButton pressed={isSidebarOn} onPress={onToggleSidebar} />
      </div>
    </div>
  );
}
