"use client";

import * as React from "react";

type Props = {
  roadAddress?: string | null;
  jibunAddress?: string | null;
  propertyId?: string | null; // "__draft__" or 실제 id
  propertyTitle?: string | null; // ✅ 현재 매물명 추가
  onClose: () => void;
  onView: (id: string) => void;
  onCreate: () => void;
};

export default function ContextMenuPanel({
  roadAddress,
  jibunAddress,
  propertyId,
  propertyTitle,
  onClose,
  onView,
  onCreate,
}: Props) {
  const isDraft = !propertyId || propertyId === "__draft__";

  // ✅ 드래프트면 "선택 위치", 아니면 매물명(없으면 기존 문구)
  const headerTitle = isDraft
    ? "선택 위치"
    : propertyTitle?.trim() || "선택된 매물";

  return (
    <div className="rounded-2xl bg-white shadow-xl border border-gray-200 p-3 min-w-[260px] max-w-[320px]">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold text-base truncate">{headerTitle}</div>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="text-sm px-2 py-1 rounded-md border bg-gray-50 hover:bg-gray-100"
        >
          닫기
        </button>
      </div>

      {/* 주소 */}
      {(roadAddress || jibunAddress) && (
        <div className="mt-2 mb-3">
          {roadAddress && (
            <div className="text-[13px] leading-snug text-gray-700">
              {roadAddress}
            </div>
          )}
          {jibunAddress && (
            <div className="text-[12px] leading-snug text-gray-500 mt-0.5">
              (지번) {jibunAddress}
            </div>
          )}
        </div>
      )}

      {/* 액션 */}
      {isDraft ? (
        <button
          className="w-full h-10 text-sm font-medium rounded-md border bg-blue-600 text-white hover:bg-blue-700"
          onClick={onCreate}
        >
          이 위치로 신규 등록
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            className="w-full h-10 text-sm font-medium rounded-md border bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => propertyId && onView(String(propertyId))}
          >
            상세 보기
          </button>
        </div>
      )}
    </div>
  );
}
