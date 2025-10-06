"use client";

import { Button } from "@/components/atoms/Button/Button";
import { useEffect, useId, useRef } from "react";
import { ContextMenuPanelProps } from "./types";
import { Plus } from "lucide-react";

export default function ContextMenuPanel({
  roadAddress,
  jibunAddress,
  propertyId,
  propertyTitle,
  isDraftPin,
  isPlanPin, // 예정(추가 전)
  isVisitReservedPin, // 예약(추가 완료)
  showFav,
  favActive, // 시그니처 유지
  onAddFav,
  onClose,
  onView,
  onCreate,
  onPlan,
}: ContextMenuPanelProps) {
  // ---------------------------
  // 상태 계산 (우선순위: 예정 > 예약 > 드래프트 > 일반)
  // ---------------------------
  const planned = isPlanPin === true;

  // 레거시 접두어까지 포함한 '원시' 예약 감지
  const reservedRaw =
    isVisitReservedPin === true ||
    (typeof propertyId === "string" && propertyId.startsWith("__visit__"));

  // ✅ 예정이 우선이므로, 예정이면 예약으로 취급하지 않음
  const reserved = !planned && reservedRaw;

  // 드래프트: 예정/예약이 모두 아닐 때만
  const draft =
    !planned &&
    !reserved &&
    (isDraftPin === true || propertyId === "__draft__");

  const headerTitle = draft
    ? "선택 위치"
    : (propertyTitle ?? "").trim() || "선택된 매물";

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
          {showFav && (
            <Button
              type="button"
              onClick={onAddFav}
              aria-label="즐겨찾기"
              variant="outline"
              size="sm"
              ref={closeBtnRef}
            >
              즐겨찾기
              <Plus />
            </Button>
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

      {/* 액션 (우선순위: 예정 → 예약 → 드래프트 → 일반) */}
      {planned ? (
        // 1) 답사 '예정'(추가 전): 답사지 예약
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={() => {
              onPlan?.(); // 예약 실행
              onClose();
            }}
            className="w-full"
          >
            답사지 예약
          </Button>
        </div>
      ) : reserved ? (
        // 2) 답사지 '예약'(추가 완료): 매물 정보 입력
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={() => {
              onCreate(); // 신규 등록(정보 입력) 플로우
              onClose();
            }}
            className="w-full"
          >
            매물 정보 입력
          </Button>
        </div>
      ) : draft ? (
        // 3) 드래프트: 답사예정 / 신규등록
        <DraftActions onCreate={onCreate} onClose={onClose} onPlan={onPlan} />
      ) : (
        // 4) 일반 매물: 상세 보기
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
