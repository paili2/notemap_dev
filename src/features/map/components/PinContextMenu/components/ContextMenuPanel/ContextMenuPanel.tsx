"use client";

import { Button } from "@/components/atoms/Button/Button";
import * as React from "react";
// import { Button } from "@/components/atoms/Button/Button"; // 프로젝트 일관 스타일을 원하면 사용

type Props = {
  roadAddress?: string | null;
  jibunAddress?: string | null;
  /** "__draft__" or 실제 id */
  propertyId?: string | null;
  /** 매물명 (선택) */
  propertyTitle?: string | null;
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
  const headerTitle = isDraft
    ? "선택 위치"
    : propertyTitle?.trim() || "선택된 매물";

  // 접근성: 헤더 id를 붙여 dialog에 연결
  const headingId = React.useId();
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);

  // Esc로 닫기
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 바깥 클릭으로 닫기
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!panelRef.current || !target) return;
      if (!panelRef.current.contains(target)) onClose();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  // 최초 포커스
  React.useEffect(() => {
    // 패널에 먼저 포커스 주고(읽기), 그 다음 닫기 버튼으로 이동
    panelRef.current?.focus();
    setTimeout(() => closeBtnRef.current?.focus(), 0);
  }, []);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      tabIndex={-1}
      className="rounded-2xl bg-white shadow-xl border border-gray-200 p-3 min-w-[260px] max-w-[320px] outline-none"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div id={headingId} className="font-semibold text-base truncate">
          {headerTitle}
        </div>
        <Button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          variant="outline"
          size="sm"
        >
          닫기
        </Button>
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
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={onCreate}
          className="w-full"
        >
          이 위치로 신규 등록
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={() => propertyId && onView(String(propertyId))}
            className="w-full"
          >
            상세 보기
          </Button>
        </div>
      )}
    </div>
  );
}
