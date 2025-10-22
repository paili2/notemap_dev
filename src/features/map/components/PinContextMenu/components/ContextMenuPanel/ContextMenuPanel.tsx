"use client";

import { Button } from "@/components/atoms/Button/Button";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ContextMenuPanelProps } from "./types";
import { Plus } from "lucide-react";
import type {
  PlanRequestPayload,
  ReserveRequestPayload,
} from "../PinContextMenu/types";

export default function ContextMenuPanel({
  roadAddress,
  jibunAddress,
  propertyId,
  propertyTitle,
  isPlanPin,
  isVisitReservedPin,
  showFav,
  onAddFav,
  onClose,
  onView,
  onCreate,
  onPlan,
  onReserve,
}: ContextMenuPanelProps) {
  const headingId = useId();
  const descId = useId();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // 생성 중(POST 진행 중) 중복 클릭 방지
  const [creating, setCreating] = useState(false);

  /** 파생 상태: 예약 > 예정 > 드래프트 > 일반 */
  const { draft, reserved, planned, headerTitle } = useMemo(() => {
    const draft = propertyId === "__draft__";
    const reserved = isVisitReservedPin === true;
    const planned =
      !reserved && isPlanPin === true && propertyId !== "__draft__";
    const headerTitle = draft
      ? "선택 위치"
      : (propertyTitle ?? "").trim() || "선택된 매물";
    return { draft, reserved, planned, headerTitle };
  }, [propertyId, isVisitReservedPin, isPlanPin, propertyTitle]);

  /** 초기 포커스/복귀 */
  useEffect(() => {
    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement) ?? null;
    // 패널이 먼저 포커스되면 스크린리더가 제목을 즉시 읽음
    panelRef.current?.focus();
    // 첫 인터랙션 요소로 자연 포커스 이동
    firstFocusableRef.current?.focus?.();
    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, []);

  /** ESC 닫기 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey, { passive: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /** 바깥 클릭 닫기 (pointerdown이 click보다 안전) */
  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!panelRef.current || !target) return;
      if (!panelRef.current.contains(target)) onClose();
    };
    document.addEventListener("pointerdown", onDocPointerDown, {
      capture: true,
    });
    return () =>
      document.removeEventListener("pointerdown", onDocPointerDown, {
        capture: true,
      } as any);
  }, [onClose]);

  /** 패널 내부 포인터 이벤트는 바깥 클릭 닫기 방지 */
  const stopPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  // ✅ 답사예정: 생성(POST) 완료까지 기다린 뒤 패널 닫기
  const handlePlanClick = useCallback(async () => {
    if (creating) return; // 중복 클릭 방지
    setCreating(true);
    try {
      const payload: Partial<PlanRequestPayload> = {
        roadAddress: roadAddress ?? null,
        jibunAddress: jibunAddress ?? null,
        propertyId: propertyId ?? null,
        propertyTitle: propertyTitle ?? null,
        dateISO: new Date().toISOString().slice(0, 10),
      };
      await onPlan?.(payload as PlanRequestPayload); // ※ 상위에서 POST /pins 수행
      onClose();
    } finally {
      setCreating(false);
    }
  }, [
    creating,
    roadAddress,
    jibunAddress,
    propertyId,
    propertyTitle,
    onPlan,
    onClose,
  ]);

  const handleReserveClick = useCallback(() => {
    // 컨테이너에서 실제 예약 로직 처리
    const payload: ReserveRequestPayload | undefined = undefined;
    onReserve?.(payload);
    onClose();
  }, [onReserve, onClose]);

  const handleViewClick = useCallback(() => {
    if (!propertyId) return;
    onView?.(String(propertyId));
  }, [onView, propertyId]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descId}
      tabIndex={-1}
      onPointerDown={stopPointerDown}
      className="rounded-2xl bg-white shadow-xl border border-gray-200 p-3 min-w-[260px] max-w-[320px] outline-none"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
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
              ref={firstFocusableRef}
            >
              즐겨찾기
              <Plus aria-hidden="true" />
            </Button>
          )}
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
      </div>

      {/* 주소 */}
      <div id={descId} className="sr-only">
        {roadAddress || jibunAddress
          ? "선택된 위치의 주소가 표시됩니다."
          : "선택된 위치의 주소 정보가 없습니다."}
      </div>

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

      {/* 액션 (우선순위: 예약 > 예정 > 드래프트 > 일반) */}
      {reserved ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={onCreate}
            className="w-full"
          >
            매물 정보 입력
          </Button>
        </div>
      ) : planned ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={handleReserveClick}
            className="w-full"
          >
            답사지 예약
          </Button>
        </div>
      ) : draft ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={handlePlanClick}
            disabled={creating}
          >
            {creating ? "생성 중..." : "답사예정"}
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
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={handleViewClick}
            className="w-full"
          >
            상세 보기
          </Button>
        </div>
      )}
    </div>
  );
}
