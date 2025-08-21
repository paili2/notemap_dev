"use client";

import * as React from "react";
import type { LatLng } from "@/features/properties/types/map";
import { Eye, Plus, X, MapPin } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";

export type PinContextMenuProps = {
  kakao: any;
  map: any;
  position: LatLng;
  address?: string;
  propertyId?: string;
  onClose: () => void;
  onView: (id: string) => void;
  onCreate: () => void;
  offsetX?: number;
  offsetY?: number;
  zIndex?: number;
};

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
  const [pt, setPt] = React.useState<{ left: number; top: number } | null>(
    null
  );

  const recalc = React.useCallback(() => {
    try {
      if (!kakao || !map) return;
      const proj = map.getProjection?.();
      if (!proj) return;
      const latlng = new kakao.maps.LatLng(position.lat, position.lng);
      const containerPt = proj.containerPointFromCoords(latlng);
      setPt({
        left: Math.round(containerPt.x + offsetX),
        top: Math.round(containerPt.y + offsetY),
      });
    } catch {}
  }, [kakao, map, position.lat, position.lng, offsetX, offsetY]);

  React.useEffect(() => {
    recalc();
    if (!kakao || !map) return;

    const listeners: Array<{ target: any; type: string; handler: () => void }> =
      [];
    const add = (type: string, handler: () => void) => {
      kakao.maps.event.addListener(map, type, handler);
      listeners.push({ target: map, type, handler });
    };

    add("center_changed", recalc);
    add("zoom_changed", recalc);
    add("bounds_changed", recalc);
    add("tileloaded", recalc);

    const handleResize = () => recalc();
    window.addEventListener("resize", handleResize);

    return () => {
      listeners.forEach(({ target, type, handler }) => {
        kakao.maps.event.removeListener(target, type, handler);
      });
      window.removeEventListener("resize", handleResize);
    };
  }, [kakao, map, recalc]);

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
      className="absolute"
      style={{ left: pt.left, top: pt.top, zIndex }}
    >
      <div className="relative min-w-40 rounded-xl border bg-white shadow-lg">
        {/* 닫기 버튼 (오른쪽 상단) */}
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-700 hover:text-black z-10"
        >
          <X className="h-3 w-3" />
        </button>

        {/* 주소 헤더: 오른쪽 공간 확보를 위해 pr-8 추가 */}
        {address ? (
          <div className="flex items-center gap-1.5 border-b border-black/10 px-2.5 py-2 pr-8">
            <div className="truncate text-[11px] text-zinc-600">{address}</div>
          </div>
        ) : null}

        <div className="py-1">
          {propertyId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onView(propertyId)}
              className="w-full justify-start px-2.5 py-2 text-left text-[12px] hover:bg-black/5"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center">
                <Eye className="h-4 w-4" />
              </span>
              <span className="truncate">매물 보기</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCreate}
            className="w-full justify-start px-2.5 py-2 text-left text-[12px] hover:bg-black/5"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center">
              <Plus className="h-4 w-4" />
            </span>
            <span className="truncate">매물 생성</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
