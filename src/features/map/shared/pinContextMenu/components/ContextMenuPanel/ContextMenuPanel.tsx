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
import type React from "react";
import type { ContextMenuPanelProps } from "./types";
import { Plus } from "lucide-react";
import type {
  CreateMode,
  ReserveRequestPayload,
} from "../PinContextMenu/types";
import { getPinRaw } from "@/shared/api/getPin";
import { pinKeys } from "@/features/pins/hooks/usePin";
import { useQueryClient } from "@tanstack/react-query";

/** 느슨한 불리언 변환 (true/"true"/1/"1") */
const asBool = (v: any) => v === true || v === 1 || v === "1" || v === "true";

/** 서버 draftState → planned/reserved 매핑 */
function mapDraftState(s?: string | null) {
  const v = String(s ?? "")
    .trim()
    .toUpperCase();
  const planned = v === "BEFORE" || v === "PENDING" || v === "PLANNED";
  const reserved = v === "SCHEDULED" || v === "RESERVED";
  return { planned, reserved };
}

/** __visit__/__reserved__/__plan__/__planned__ 형태에서 숫자 ID 추출 */
function extractDraftIdFromPropertyId(
  propertyId?: string | number | null
): number | undefined {
  if (propertyId == null) return undefined;
  const raw = String(propertyId).trim();
  if (!raw) return undefined;

  const m = raw.match(
    /^(?:__visit__|__reserved__|__plan__|__planned__)(\d+)$/i
  );
  if (m && m[1]) {
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : undefined;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** kakao LatLng | POJO 모두 지원 */
function getLatLng(pos: ContextMenuPanelProps["position"]) {
  if (typeof (pos as any)?.getLat === "function") {
    return {
      lat: (pos as any).getLat() as number,
      lng: (pos as any).getLng() as number,
    };
  }
  return { lat: (pos as any).lat as number, lng: (pos as any).lng as number };
}

export default function ContextMenuPanel({
  roadAddress,
  jibunAddress,
  propertyId,
  propertyTitle,
  draftState,
  isPlanPin,
  isVisitReservedPin,
  showFav,
  onAddFav,
  onClose,
  onView,
  onCreate,
  onPlan, // NOTE: 현재 버튼 UI에서는 사용 안 하지만, 타입 호환 위해 props는 유지
  onReserve,
  /** ✅ 컨테이너에서 내려주는 현재 좌표 */
  position,

  /** ✅ 새로 추가: 매물 삭제 가능 여부 & 핸들러 */
  canDelete,
  onDelete,
}: ContextMenuPanelProps) {
  const headingId = useId();
  const descId = useId();
  const qc = useQueryClient();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  /** ✅ 제목 로컬 상태: 컨테이너에서 title이 없을 때 보완 */
  const [displayTitle, setDisplayTitle] = useState(
    (propertyTitle ?? "").trim()
  );

  // propertyTitle이 바뀌면 displayTitle도 맞춰줌
  useEffect(() => {
    setDisplayTitle((propertyTitle ?? "").trim());
  }, [propertyTitle]);

  /** 파생 상태: 예약 > 예정 > 드래프트 > 일반  */
  const { draft, reserved, planned } = useMemo(() => {
    const idStr = String(propertyId ?? "").trim();
    const idLow = idStr.toLowerCase();

    const byState = mapDraftState(draftState);
    const reservedByProp = asBool(isVisitReservedPin);
    const plannedByProp = asBool(isPlanPin);

    const reservedById =
      /(^|[_:. -])(visit|reserved|reserve|rsvd)([_:. -]|$)/i.test(idStr) ||
      idLow.startsWith("__visit__") ||
      idLow.startsWith("__reserved__");
    const plannedById =
      /(^|[_:. -])(plan|planned|planning|previsit)([_:. -]|$)/i.test(idStr) ||
      idLow.startsWith("__plan__") ||
      idLow.startsWith("__planned__");

    const reserved = byState.reserved || reservedByProp || reservedById;
    const planned =
      !reserved && (byState.planned || plannedByProp || plannedById);

    const isLegacyDraft = !idStr || idLow === "__draft__";
    const draft = !reserved && !planned && isLegacyDraft;

    return { draft, reserved, planned };
  }, [propertyId, draftState, isPlanPin, isVisitReservedPin]);

  // 상세보기 가능 여부
  const canView = useMemo(() => {
    const s = String(propertyId ?? "").trim();
    if (!s) return false;
    const low = s.toLowerCase();
    if (low === "__draft__") return false;
    if (
      /(^|[_:. -])(visit|reserved|reserve|rsvd|plan|planned|planning|previsit)([_:. -]|$)/i.test(
        s
      ) ||
      low.startsWith("__visit__") ||
      low.startsWith("__reserved__") ||
      low.startsWith("__plan__") ||
      low.startsWith("__planned__")
    ) {
      return false;
    }
    return true;
  }, [propertyId]);

  /** ✅ 제목이 비어 있고 조회 가능한 등록핀이라면 1회 조회 후 제목 채우기 */
  useEffect(() => {
    if (displayTitle) return;
    if (!canView) return;
    if (!propertyId) return;

    let alive = true;
    getPinRaw(String(propertyId))
      .then((pin: any) => {
        if (!alive) return;

        const name =
          pin?.property?.title ??
          pin?.title ??
          pin?.name ??
          pin?.property?.name ??
          pin?.data?.title ??
          pin?.data?.name ??
          "";

        if (name) setDisplayTitle(String(name).trim());
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [displayTitle, canView, propertyId]);

  /** 최종 헤더 타이틀: draft는 "선택 위치", 그 외엔 매물명 우선 */
  const headerTitle = useMemo(() => {
    // 1️⃣ 드래프트 핀은 항상 "선택 위치"
    if (draft) return "선택 위치";

    // 2️⃣ 매물명이 하나라도 있으면 무조건 그걸 사용
    const name = (displayTitle || propertyTitle || "").trim();
    if (name) return name;

    // 3️⃣ 임시핀인데 제목이 없으면 상태 라벨 사용
    if (reserved) return "답사지예약";
    if (planned) return "답사예정";

    // 4️⃣ 그 외는 그냥 선택 위치
    return "선택 위치";
  }, [draft, reserved, planned, displayTitle, propertyTitle]);

  /** 초기 포커스/복귀 */
  useEffect(() => {
    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement) ?? null;
    panelRef.current?.focus();
    firstFocusableRef.current?.focus?.();
    return () => previouslyFocusedRef.current?.focus?.();
  }, []);

  /** ESC 닫기 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /** 바깥 클릭 닫기 */
  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!panelRef.current || !target) return;
      if (!panelRef.current.contains(target)) onClose();
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [onClose]);

  /** 패널 내부 포인터 이벤트는 바깥 클릭 닫기 방지 */
  const stopPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  const handleReserveClick = useCallback(() => {
    const payload: ReserveRequestPayload | undefined = undefined;
    onReserve?.(payload);
    onClose();
  }, [onReserve, onClose]);

  const handleViewClick = useCallback(() => {
    if (!canView) return;
    onView?.(String(propertyId));
    Promise.resolve().then(() => onClose());
  }, [onView, onClose, propertyId, canView]);

  // ✅ 신규 등록/정보 입력 시 pinDraftId + lat/lng 함께 전달
  const handleCreateClick = useCallback(() => {
    const pinDraftId = extractDraftIdFromPropertyId(propertyId);
    const { lat, lng } = getLatLng(position);

    const createMode: CreateMode = draft
      ? "PLAN_FROM_DRAFT" // 신규핀 → 답사예정지 등록 클릭
      : reserved
      ? "FULL_PROPERTY_FROM_RESERVED" // 답사지 예약핀 → 매물 정보 입력
      : "NORMAL";

    // 🔹 기본 payload
    const basePayload = {
      latFromPin: lat,
      lngFromPin: lng,
      fromPinDraftId: pinDraftId,
      address: roadAddress ?? jibunAddress ?? null,
      roadAddress: roadAddress ?? null,
      jibunAddress: jibunAddress ?? null,
      createMode,
    };

    // 🔥 draft(검색 임시핀)일 때만 visitPlanOnly: true 추가
    const payload = draft
      ? { ...basePayload, visitPlanOnly: true }
      : basePayload;

    onCreate?.(payload);

    onClose();
  }, [
    onCreate,
    onClose,
    propertyId,
    roadAddress,
    jibunAddress,
    position,
    draft,
    reserved,
  ]);

  // ✅ Hover 시 프리페치
  const handleHoverPrefetch = useCallback(() => {
    if (!canView) return;
    const idStr = String(propertyId);
    qc.prefetchQuery({
      queryKey: pinKeys.detail(idStr),
      queryFn: () => getPinRaw(idStr),
      staleTime: 60_000,
    });
  }, [qc, propertyId, canView]);

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

          {canDelete && (
            <Button
              type="button"
              onClick={onDelete}
              aria-label="매물삭제"
              variant="destructive"
              size="sm"
            >
              삭제
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
            onClick={handleCreateClick}
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
        // ✅ 임시핀: 답사예정 버튼 제거, '이 위치로 신규 등록'만 사용
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={handleCreateClick}
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
            onClick={handleViewClick}
            onMouseEnter={handleHoverPrefetch}
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
