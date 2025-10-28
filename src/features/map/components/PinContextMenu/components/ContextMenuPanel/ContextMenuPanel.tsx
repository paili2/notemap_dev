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
import { getPin } from "@/shared/api/getPin";
import { pinKeys } from "@/features/pins/hooks/usePin";
import { useQueryClient } from "@tanstack/react-query";
import { useReservationVersion } from "@/features/survey-reservations/store/useReservationVersion";
import { todayYmdKST } from "@/shared/date/todayYmdKST";

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
  const qc = useQueryClient();
  const bump = useReservationVersion((s) => s.bump);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // 생성 중(POST 진행 중) 중복 클릭 방지
  const [creating, setCreating] = useState(false);

  /** 파생 상태: 예약 > 예정 > 드래프트 > 일반 */
  const { draft, reserved, planned, headerTitle } = useMemo(() => {
    const reserved = isVisitReservedPin === true;
    // 예정 여부는 propertyId와 무관
    const planned = !reserved && isPlanPin === true;
    // 둘 다 아니면 드래프트
    const isLegacyDraft = !propertyId || propertyId === "__draft__";
    const draft = !reserved && !planned && isLegacyDraft;
    const headerTitle = isLegacyDraft
      ? "선택 위치"
      : (propertyTitle ?? "").trim() || "선택된 매물";
    return { draft, reserved, planned, headerTitle };
  }, [propertyId, isVisitReservedPin, isPlanPin, propertyTitle]);

  // 상세보기 가능 여부: id가 있고 드래프트가 아닐 때만
  const canView = useMemo(() => {
    if (!propertyId) return false;
    if (propertyId === "__draft__") return false;
    const s = String(propertyId).trim();
    return s.length > 0;
  }, [propertyId]);

  /** 초기 포커스/복귀 */
  useEffect(() => {
    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement) ?? null;
    // 패널 포커스 → 스크린리더 접근성
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
    window.addEventListener("keydown", onKey); // passive 불필요
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /** 바깥 클릭 닫기 (pointerdown이 click보다 안전) */
  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!panelRef.current || !target) return;
      if (!panelRef.current.contains(target)) onClose();
    };
    // capture: true 로 등록
    document.addEventListener("pointerdown", onDocPointerDown, true);
    // 제거 시에도 동일한 capture 불리언을 전달해야 함
    return () =>
      document.removeEventListener("pointerdown", onDocPointerDown, true);
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
        // 날짜는 KST 기준으로 잘라서 사용
        dateISO: todayYmdKST(),
      };
      await onPlan?.(payload as PlanRequestPayload); // 상위에서 POST /pins 수행
      bump();
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
    ,
    bump,
  ]);

  const handleReserveClick = useCallback(() => {
    // 컨테이너에서 실제 예약 로직 처리 (insertAt/날짜 선택 등)
    const payload: ReserveRequestPayload | undefined = undefined;
    onReserve?.(payload);
    onClose();
  }, [onReserve, onClose]);

  const handleViewClick = useCallback(() => {
    if (!canView) return;
    onView?.(String(propertyId));
  }, [onView, propertyId, canView]);

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

      {/* 주소(스크린리더 설명) */}
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
            onMouseEnter={() => {
              if (!canView) return;
              const idStr = String(propertyId);
              qc.prefetchQuery({
                queryKey: pinKeys.detail(idStr),
                queryFn: () => getPin(idStr),
                staleTime: 60_000,
              });
            }}
            className="w-full"
            disabled={!canView}
          >
            상세 보기
          </Button>
        </div>
      )}
    </div>
  );
}
