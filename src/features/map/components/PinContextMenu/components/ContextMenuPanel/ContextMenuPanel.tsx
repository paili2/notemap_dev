"use client";

import { Button } from "@/components/atoms/Button/Button";
import StarToggleButton from "@/features/pins/components/StarToggleButton";
import { useEffect, useId, useRef } from "react";

type Props = {
  roadAddress?: string | null;
  jibunAddress?: string | null;
  /** "__draft__" 또는 실제 id(숫자/문자열) */
  propertyId?: string | null;
  /** 매물명 (선택) */
  propertyTitle?: string | null;

  /** plan(답사예정/임시) 핀인지 부모에서 판단해 넘겨줄 수 있음 */
  isPlanPin?: boolean;

  /** 즐겨찾기 버튼 노출 여부(부모에서 결정: 매물 등록된 핀에서만 true) */
  showFav?: boolean;
  /** 즐겨찾기 상태/토글 콜백 (showFav=true 이고 onToggleFav가 있을 때만 버튼 렌더) */
  favActive?: boolean;
  onToggleFav?: (next: boolean) => void;

  /** 공통 콜백들 */
  onClose: () => void;
  onView: (id: string) => void;
  onCreate: () => void;
  onPlan?: () => void;

  /** ✅ 지도 컨테이너 DOM (다른 핀 클릭시 즉시 전환용) */
  mapContainer?: HTMLElement | null;
};

export default function ContextMenuPanel({
  roadAddress,
  jibunAddress,
  propertyId,
  propertyTitle,
  isPlanPin,
  showFav,
  favActive,
  onToggleFav,
  onClose,
  onView,
  onCreate,
  onPlan,
}: Props) {
  const isDraft = !propertyId || propertyId === "__draft__";
  const isVisit = !!propertyId && propertyId.startsWith("__visit__");

  const headerTitle = isDraft
    ? "선택 위치"
    : propertyTitle?.trim() || "선택된 매물";

  const headingId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Esc로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ✅ 바깥 클릭으로 닫기 (지도 내부 클릭은 닫지 않음 → 다른 핀 한 번에 전환)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!panelRef.current || !target) return;
      if (!panelRef.current.contains(target)) onClose();
    };
    document.addEventListener("click", onDocClick); // ✅ click
    return () => document.removeEventListener("click", onDocClick);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus(); // 패널에만 포커스
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
          {/* ✅ 매물 등록된 핀에서만 즐겨찾기 버튼 노출 */}
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
        // ✅ 답사예정핀: 상세보기 대신 "답사예정지 등록"
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={() => {
              onPlan?.(); // 컨테이너에서 위치(lat,lng) 포함한 onPlan이 바인딩되어 있음
              onClose();
            }}
            className="w-full"
          >
            답사예정지 등록
          </Button>
        </div>
      ) : (
        // ✅ 매물핀: 상세 보기
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

/** 신규핀 draft 상태에서만 사용되는 액션 버튼 묶음 */
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
