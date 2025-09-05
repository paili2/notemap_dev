"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import ContextMenuPanel from "./components/ContextMenuPanel/ContextMenuPanel";
import { useOverlayPosition } from "./useOverlayPosition";
import { useEscapeToClose } from "./useEscapeToClose";
import type { PinContextMenuProps } from "./types";

export default function PinContextMenuContainer({
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
  useEscapeToClose(onClose);

  if (!pt) return null;

  return (
    <div
      ref={ref}
      className={cn("absolute")}
      style={{ left: pt.left, top: pt.top, zIndex, pointerEvents: "auto" }}
      role="dialog"
      aria-modal
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
