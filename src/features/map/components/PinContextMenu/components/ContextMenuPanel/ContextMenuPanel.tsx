"use client";

import * as React from "react";

type Props = {
  address?: string;
  propertyId?: string; // "__draft__" or real id
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
  const isDraft = !propertyId || propertyId === "__draft__";

  return (
    <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-3 min-w-[220px] max-w-[280px]">
      <div className="flex items-start justify-between gap-3">
        <div className="font-medium text-sm">
          {isDraft ? "여기서 신규 등록" : "선택된 항목"}
        </div>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 rounded-md border bg-gray-50 hover:bg-gray-100"
        >
          닫기
        </button>
      </div>

      {address && (
        <div className="text-xs text-gray-500 mt-1 mb-2 leading-snug">
          {address}
        </div>
      )}

      {isDraft ? (
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm rounded-md border bg-blue-50 hover:bg-blue-100"
            onClick={onCreate}
          >
            등록하기
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm rounded-md border bg-blue-50 hover:bg-blue-100"
            onClick={() => propertyId && onView(String(propertyId))}
          >
            보기
          </button>
        </div>
      )}
    </div>
  );
}
