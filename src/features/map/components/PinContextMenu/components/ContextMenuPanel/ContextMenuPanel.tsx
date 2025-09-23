"use client";

import { Button } from "@/components/atoms/Button/Button";
import StarToggleButton from "@/features/pins/components/StarToggleButton";
import { useEffect, useId, useRef } from "react";
import { ContextMenuPanelProps } from "./types";

export default function ContextMenuPanel({
  roadAddress,
  jibunAddress,
  propertyId,
  propertyTitle,
  isDraftPin, // ✅ 추가
  isPlanPin,
  showFav,
  favActive,
  onToggleFav,
  onClose,
  onView,
  onCreate,
  onPlan,
}: ContextMenuPanelProps) {
  // ✅ 컨테이너에서 내려주면 그 값을 우선 사용, 아니면 기존 로컬 계산으로 폴백
  const isDraft = isDraftPin ?? (!propertyId || propertyId === "__draft__");
  const isVisit = !!propertyId && propertyId.startsWith("__visit__");

  const headerTitle = isDraft
    ? "선택 위치"
    : propertyTitle?.trim() || "선택된 매물";

  const headingId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!panelRef.current || !target) return;
      if (!panelRef.current.contains(target)) onClose();
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
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
      <div className="flex items-center justify-between gap-3 ">
        <div
          id={headingId}
          className="font-semibold text-base truncate min-w-0"
        >
          {headerTitle}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showFav && typeof onToggleFav === "function" && (
            <StarToggleButton
              active={!!favActive}
              onChange={onToggleFav}
              size="sm"
            />
          )}
          <Button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            variant="outline"
            size="sm"
            ref={closeBtnRef}
          >
            닫기
          </Button>
        </div>
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
        <DraftActions onCreate={onCreate} onClose={onClose} onPlan={onPlan} />
      ) : isVisit || isPlanPin ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={() => {
              onPlan?.();
              onClose();
            }}
            className="w-full"
          >
            답사예정지 등록
          </Button>
        </div>
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

function DraftActions({
  onCreate,
  onClose,
  onPlan,
}: {
  onCreate: () => void;
  onClose: () => void;
  onPlan?: () => void;
}) {
  const handleVisitPlan = () => {
    onPlan?.();
    onClose();
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={handleVisitPlan}
      >
        답사예정
      </Button>

      <Button
        type="button"
        variant="default"
        size="lg"
        onClick={onCreate}
        className="w-full"
      >
        이 위치로 신규 등록
      </Button>
    </div>
  );
}
