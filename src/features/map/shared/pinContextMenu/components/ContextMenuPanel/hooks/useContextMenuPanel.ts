"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type React from "react";

import type { ContextMenuPanelProps } from "../types";
import { getPinRaw } from "@/shared/api/pins/queries/getPin";
import { pinKeys } from "@/features/pins/hooks/usePin";
import { useQueryClient } from "@tanstack/react-query";
import type {
  CreateMode,
  ReserveRequestPayload,
} from "../../PinContextMenu/types";
import { getPinDraftDetailOnce } from "@/shared/api/pins";
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

export function useContextMenuPanelLogic(props: ContextMenuPanelProps) {
  const {
    roadAddress,
    jibunAddress,
    propertyId,
    propertyTitle,
    draftState,
    isPlanPin,
    isVisitReservedPin,
    onClose,
    onView,
    onCreate,
    onPlan,
    onReserve,
    position,
  } = props;

  const headingId = useId();
  const descId = useId();
  const qc = useQueryClient();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  /** 제목 로컬 상태: 컨테이너에서 title이 없을 때 보완 */
  const [displayTitle, setDisplayTitle] = useState(
    (propertyTitle ?? "").trim()
  );

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

  /** 제목이 비어 있고 조회 가능한 등록핀이라면 1회 조회 후 제목 채우기 */
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

  /** ✅ 답사예정/답사지예약(임시핀)일 때 pin-drafts 기반으로 제목 채우기 */
  useEffect(() => {
    const idStr = String(propertyId ?? "").trim();
    if (!idStr) return;

    if (!reserved && !planned) {
      return;
    }

    if (
      displayTitle &&
      displayTitle !== "답사예정" &&
      displayTitle !== "답사지예약"
    ) {
      return;
    }

    let draftId = extractDraftIdFromPropertyId(propertyId);

    if (draftId == null) {
      const n = Number(idStr);
      if (Number.isFinite(n)) {
        draftId = n;
      }
    }

    if (!draftId) {
      return;
    }

    let alive = true;

    getPinDraftDetailOnce(draftId)
      .then((detail) => {
        if (!alive || !detail) return;

        const name = String(detail.name ?? "").trim();
        const addr = String(detail.addressLine ?? "").trim();

        if (name) {
          setDisplayTitle(name);
        } else if (addr) {
          setDisplayTitle(addr);
        }
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [propertyId, planned, reserved, displayTitle]);

  /** 최종 헤더 타이틀 */
  const headerTitle = useMemo(() => {
    if (draft) return "선택 위치";

    const name = (displayTitle || propertyTitle || "").trim();
    if (name) return name;

    if (reserved) return "답사지예약";

    if (planned) {
      const addr = (roadAddress || jibunAddress || "").trim();
      if (addr) return addr;
      return "답사예정";
    }

    return "선택 위치";
  }, [
    draft,
    reserved,
    planned,
    displayTitle,
    propertyTitle,
    roadAddress,
    jibunAddress,
  ]);

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

  /** 패널 안쪽에서만 상위 버블링 차단 */
  const stopAll = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const handleReserveClick = useCallback(() => {
    const payload: ReserveRequestPayload | undefined = undefined;

    if (onReserve) {
      onReserve(payload);
    } else if (onPlan) {
      onPlan();
    }

    onClose();
  }, [onReserve, onPlan, onClose]);

  const handleViewClick = useCallback(() => {
    if (!canView) return;
    onView?.(String(propertyId));
    Promise.resolve().then(() => onClose());
  }, [onView, onClose, propertyId, canView]);

  const handleCreateClick = useCallback(() => {
    const pinDraftId = extractDraftIdFromPropertyId(propertyId);
    const { lat, lng } = getLatLng(position);

    const createMode: CreateMode = draft
      ? "PLAN_FROM_DRAFT"
      : reserved
      ? "FULL_PROPERTY_FROM_RESERVED"
      : "NORMAL";

    const basePayload = {
      latFromPin: lat,
      lngFromPin: lng,
      fromPinDraftId: pinDraftId,
      address: roadAddress ?? jibunAddress ?? null,
      roadAddress: roadAddress ?? null,
      jibunAddress: jibunAddress ?? null,
      createMode,
    };

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

  const handleHoverPrefetch = useCallback(() => {
    if (!canView) return;
    const idStr = String(propertyId);
    qc.prefetchQuery({
      queryKey: pinKeys.detail(idStr),
      queryFn: () => getPinRaw(idStr),
      staleTime: 60_000,
    });
  }, [qc, propertyId, canView]);

  return {
    // refs & ids
    headingId,
    descId,
    panelRef,
    firstFocusableRef,

    // 상태
    headerTitle,
    roadAddress,
    jibunAddress,
    draft,
    planned,
    reserved,
    canView,

    // 핸들러
    stopAll,
    handleReserveClick,
    handleViewClick,
    handleCreateClick,
    handleHoverPrefetch,
  };
}
