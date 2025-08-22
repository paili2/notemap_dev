// features/properties/components/map/PinContextMenu/PinContextMenu.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import ContextMenuPanel from "./ContextMenuPanel";
import { useOverlayPosition } from "./useOverlayPosition";
import type { PinContextMenuProps } from "./types";

export default function PinContextMenu({
  kakao,
  map,
  position,
  address,
  propertyId,
  onClose,
  onView,
  onCreate,
  offsetX = 12,
  offsetY = -12,
  zIndex = 10000,
}: PinContextMenuProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  // 지도 좌표 → 화면 좌표
  const pt = useOverlayPosition({ kakao, map, position, offsetX, offsetY });

  // ESC 닫기
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!pt) return null;

  return (
    <div
      ref={ref}
      className={cn("absolute")}
      style={{ left: pt.left, top: pt.top, zIndex }}
      role="dialog"
      aria-modal="true"
    >
      <ContextMenuPanel
        address={address}
        propertyId={propertyId}
        onClose={onClose}
        onView={onView}
        onCreate={onCreate}
      />
    </div>
  );
}
