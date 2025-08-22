"use client";

import * as React from "react";
import { Eye, Plus, X } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";

type Props = {
  address?: string;
  propertyId?: string;
  onClose: () => void;
  onView: (id: string) => void;
  onCreate: () => void;
};

export default function ContextMenuPanel({
  address,
  propertyId,
  onClose,
  onView,
  onCreate,
}: Props) {
  return (
    <div className="relative min-w-40 rounded-xl border bg-white shadow-lg">
      {/* 닫기 */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-700 hover:text-black z-10"
      >
        <X className="h-3 w-3" />
      </button>

      {/* 주소 헤더 */}
      {address ? (
        <div className="flex items-center gap-1.5 border-b border-black/10 px-2.5 py-2 pr-8">
          <div className="truncate text-[11px] text-zinc-600">{address}</div>
        </div>
      ) : null}

      {/* 액션 */}
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
  );
}
