"use client";

import { Eye, Plus, X } from "lucide-react";
import ContextMenuItem from "./ContextMenuItem";
import { ContextMenuPanelProps } from "./types";

export default function ContextMenuPanel({
  address,
  propertyId,
  onClose,
  onView,
  onCreate,
}: ContextMenuPanelProps) {
  return (
    <div className="relative min-w-40 rounded-xl border bg-white shadow-lg">
      {/* 닫기 버튼 */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-700 hover:text-black z-10"
      >
        <X className="h-3 w-3" />
      </button>

      {/* 주소 헤더 */}
      {address && (
        <div className="flex items-center gap-1.5 border-b border-black/10 px-2.5 py-2 pr-8">
          <div className="truncate text-[11px] text-zinc-600">{address}</div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="py-1">
        {propertyId && (
          <ContextMenuItem
            label="매물 보기"
            icon={Eye}
            onClick={() => onView(propertyId)}
          />
        )}
        <ContextMenuItem label="매물 생성" icon={Plus} onClick={onCreate} />
      </div>
    </div>
  );
}
