"use client";

import * as React from "react";

import { useSidebar } from "@/features/sidebar";
import { toLatLng } from "./utils/geo";
import { useDerivedPinState } from "./hooks/useDerivedPinState";
import { usePlanReserve } from "./hooks/usePlanReserve";
import ContextMenuPanel from "../ContextMenuPanel/ContextMenuPanel";
import { CreateFromPinArgs, PinContextMenuProps } from "./types";
import { useScheduledReservations } from "@/features/survey-reservations/hooks/useScheduledReservations";
import CustomOverlay from "../CustomOverlay/CustomOverlay";
import { useDeletePropertyFromMenu } from "./hooks/useDeletePropertyFromMenu";
import { MergedMarker } from "@/features/map/pages/hooks/useMergedMarkers";
import { posKey } from "./lib/draftMatching";
import { useReservationVersion } from "@/features/survey-reservations/store/useReservationVersion";
import { usePinContextMenuActions } from "./hooks/usePinContextMenuActions"; // ⭐ 새 훅

type Props = PinContextMenuProps & {
  mergedMeta?: MergedMarker[];
  refreshViewportPins?: (bounds: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  }) => Promise<void> | void;
  upsertDraftMarker?: (m: {
    id: string | number;
    lat: number;
    lng: number;
    address?: string | null;
  }) => void;
  /** ✅ 매물 삭제 후 부모에서 리스트/지도 갱신이 필요하면 사용 */
  onDeleteProperty?: (id: string | null) => void | Promise<void>;
};

export default function PinContextMenuContainer(props: Props) {
  const {
    kakao,
    map,
    position: target,
    roadAddress,
    jibunAddress,
    propertyId,
    propertyTitle,
    pin,
    onAddFav,
    onClose,
    onView,
    onCreate,
    onPlan,
    onReserve,
    zIndex = 10000,
    isPlanPin: isPlanPinFromParent,
    isVisitReservedPin: isVisitReservedFromParent,
    mergedMeta,
    refreshViewportPins,
    upsertDraftMarker,
    onDeleteProperty,
  } = props;

  const version = useReservationVersion((s) => s.version);
  const bump = useReservationVersion((s) => s.bump);

  const {
    items: scheduledReservations,
    refetch: refetchScheduledReservations,
  } = useScheduledReservations();

  const handleView = () => {
    const id = String(propertyId ?? "");
    if (!id || id === "__draft__" || id.startsWith("__visit__")) return;
    onView?.(id);
    Promise.resolve().then(() => onClose?.());
  };

  if (!kakao || !map || !target) return null;

  const position = React.useMemo<kakao.maps.LatLng>(
    () => toLatLng(kakao, target),
    [kakao, target]
  );

  /** 현재 위치 근처 메타 */
  const metaAtPos = React.useMemo(() => {
    if (!mergedMeta) return undefined;
    const lat = position.getLat();
    const lng = position.getLng();
    const EPS = 1e-5;
    return mergedMeta.find(
      (m) => Math.abs(m.lat - lat) < EPS && Math.abs(m.lng - lng) < EPS
    );
  }, [mergedMeta, position]);

  /** 핀/메타에서 읽은 draftState (원본) */
  const resolvedDraftState = React.useMemo<string | undefined>(() => {
    const fromMeta =
      metaAtPos?.source === "draft" ? metaAtPos?.draftState : undefined;
    const fromPin =
      (pin as any)?.draft?.draftState ??
      (pin as any)?.draft?.state ??
      (pin as any)?.draftState ??
      undefined;
    const v = (fromMeta ?? fromPin) as unknown;
    return typeof v === "string" ? v : undefined;
  }, [metaAtPos, pin]);

  const base = useDerivedPinState({
    propertyId,
    pin,
    isPlanPinFromParent,
    isVisitReservedFromParent,
  });

  let { listed, favActive } = base;

  /** 🔍 검색 드래프트인지 (선택 위치) 여부 */
  const isSearchDraft = String((pin as any)?.id ?? "") === "__draft__";

  /** 신규 클릭 가드: "검색 드래프트 + __draft__" 만 신규로 취급 */
  const isNewClick = propertyId === "__draft__" && isSearchDraft;

  /** 현재 위치 posKey */
  const posK = React.useMemo(
    () => posKey(position.getLat(), position.getLng()),
    [position]
  );

  /** 예약 리스트 기준 "현재 위치에 예약이 존재하는지" */
  const hasReservationAtPos = React.useMemo(() => {
    if (!scheduledReservations?.length) return false;
    const key = posK;

    // posKey 우선
    const byPosKey = scheduledReservations.find(
      (r: any) => r.posKey && r.posKey === key
    );
    if (byPosKey) return true;

    // lat/lng 보정
    const lat = position.getLat();
    const lng = position.getLng();
    const EPS = 1e-5;

    const byLatLng = scheduledReservations.find(
      (r: any) =>
        typeof r.lat === "number" &&
        typeof r.lng === "number" &&
        Math.abs(r.lat - lat) < EPS &&
        Math.abs(r.lng - lng) < EPS
    );

    return !!byLatLng;
  }, [scheduledReservations, posK, position]);

  /** 이 위치가 낙관적으로 "답사예정" 처리된 상태인지 */
  const optimisticPlannedHere =
    !isNewClick && (globalThis as any).optimisticPlannedPosSet?.has
      ? (globalThis as any).optimisticPlannedPosSet.has(posK)
      : false;

  /** 🔥 최종 reserved/planned 판정 */
  let reserved = false;
  let planned = false;

  if (!isNewClick) {
    if (hasReservationAtPos) {
      reserved = true;
      planned = false;
    } else {
      reserved = false;

      if (optimisticPlannedHere) {
        planned = true;
      } else {
        const s = (resolvedDraftState ?? "").toUpperCase();

        if (metaAtPos?.source === "draft") {
          planned = true;
        } else if (s && s !== "DELETED") {
          planned = true;
        } else if (isPlanPinFromParent) {
          planned = true;
        }
      }
    }
  }

  /** 패널에 넘길 draftState: reserved/planned 에 맞춰 단순화 */
  let draftStateForPanel: string | undefined;
  if (reserved) {
    draftStateForPanel = "SCHEDULED";
  } else if (planned) {
    draftStateForPanel = "PLANNED";
  } else {
    draftStateForPanel = undefined;
  }

  const { createVisitPlanAt, reserveVisitPlan } = useSidebar();

  const { handlePlan } = usePlanReserve({
    mode: "create",
    position,
    roadAddress,
    jibunAddress,
    propertyId,
    propertyTitle,
    onPlan,
    onReserve,
    onClose,
    createVisitPlanAt,
    reserveVisitPlan,
    loadScheduledReservations: refetchScheduledReservations,
  });

  /** 현재 지도 bounds를 {sw, ne}로 추출 */
  const getBoundsBox = React.useCallback(() => {
    try {
      const b = map.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      return {
        sw: { lat: sw.getLat(), lng: sw.getLng() },
        ne: { lat: ne.getLat(), lng: ne.getLng() },
      };
    } catch {
      return undefined;
    }
  }, [map]);

  /** 공용 오버레이 정리 (라벨은 Host에서만 복원) */
  const cleanupOverlaysAt = React.useCallback((lat: number, lng: number) => {
    try {
      const anyWin = globalThis as any;
      if (typeof anyWin.__cleanupOverlaysAtPos === "function") {
        anyWin.__cleanupOverlaysAtPos(lat, lng);
      }
    } catch {
      /* no-op */
    }
  }, []);

  // ⭐ 여기서 새 훅 사용
  const { handlePlanClick, reserving, handleReserveClick, handleCreateClick } =
    usePinContextMenuActions({
      position,
      posK,
      handlePlan,
      getBoundsBox,
      refreshViewportPins,
      upsertDraftMarker,
      cleanupOverlaysAt,
      bump,
      pin,
      metaAtPos,
      propertyId,
      roadAddress,
      jibunAddress,
      reserved,
      scheduledReservations,
      refetchScheduledReservations: () => refetchScheduledReservations(),
      onClose,
      onCreate,
    });

  const xAnchor = 0.5;
  const yAnchor = 1;

  const offsetPx = isSearchDraft ? 56 : 56;
  const MENU_Z = Math.max(zIndex ?? 0, 1_000_000);

  /** ✅ 컨텍스트 메뉴 패널에 넘길 propertyId */
  const propertyIdClean = React.useMemo(() => {
    if (metaAtPos?.source === "draft") {
      const n = Number((metaAtPos as any)?.id);
      if (Number.isFinite(n)) return String(n);
    }

    const raw = String(propertyId ?? "").trim();
    if (!raw) return null;
    const m = raw.match(/(\d{1,})$/);
    return (m?.[1] ?? raw) || null;
  }, [propertyId, metaAtPos]);

  /** ✅ draft 메타일 때만 제목으로 사용 */
  const metaTitle = React.useMemo(() => {
    if (!metaAtPos) return undefined;

    if (metaAtPos.source === "draft") {
      return (
        (metaAtPos as any)?.property?.title ??
        (metaAtPos as any)?.title ??
        (metaAtPos as any)?.name ??
        undefined
      );
    }

    return undefined;
  }, [metaAtPos]);

  const derivedPropertyTitle = React.useMemo(() => {
    const pinTitle =
      (pin as any)?.property?.title ??
      (pin as any)?.title ??
      (pin as any)?.name ??
      (pin as any)?.property?.name ??
      undefined;

    return (
      (propertyTitle ?? "").trim() ||
      (pinTitle ?? "").trim() ||
      (metaTitle ?? "").trim() ||
      ""
    );
  }, [propertyTitle, pin, metaTitle]);

  const { canDelete, deleting, handleDelete } = useDeletePropertyFromMenu({
    propertyIdClean,
    listed,
    isSearchDraft,
    onDeleteProperty,
    onClose,
  });

  React.useEffect(() => {
    // 상태 디버그용
    // eslint-disable-next-line no-console
    console.debug("[PinContextMenu] position", {
      lat: position.getLat(),
      lng: position.getLng(),
      propertyId,
      propertyIdClean,
      pinId: (pin as any)?.id,
      isSearchDraft,
      offsetPx,
      version,
      hasReservationAtPos,
      resolvedDraftState,
      reserved,
      planned,
      draftStateForPanel,
    });
  }, [
    position,
    propertyId,
    propertyIdClean,
    pin,
    isSearchDraft,
    offsetPx,
    version,
    hasReservationAtPos,
    resolvedDraftState,
    reserved,
    planned,
    draftStateForPanel,
  ]);

  // 🔑 제목이 바뀔 때 CustomOverlay를 한 번 다시 만들도록 key에 포함
  const overlayKey = React.useMemo(
    () => `ctx:${version}:${posK}:${derivedPropertyTitle || ""}`,
    [version, posK, derivedPropertyTitle]
  );

  return (
    <CustomOverlay
      key={overlayKey}
      kakao={kakao}
      map={map}
      position={position}
      xAnchor={xAnchor}
      yAnchor={yAnchor}
      zIndex={MENU_Z}
      pointerEventsEnabled
    >
      <div style={{ position: "relative", top: -offsetPx }}>
        <div role="dialog" aria-modal="true">
          <div className="relative pointer-events-auto">
            <ContextMenuPanel
              roadAddress={roadAddress ?? null}
              jibunAddress={jibunAddress ?? null}
              propertyId={propertyIdClean}
              propertyTitle={derivedPropertyTitle || null}
              draftState={draftStateForPanel}
              onClose={props.onClose}
              onView={handleView}
              onCreate={handleCreateClick}
              onPlan={handlePlanClick}
              onReserve={reserving ? () => {} : handleReserveClick}
              isPlanPin={planned}
              isVisitReservedPin={reserved}
              showFav={listed}
              onAddFav={onAddFav}
              favActive={favActive}
              position={position}
              canDelete={canDelete}
              onDelete={handleDelete}
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-full -mt-px -translate-x-1/2 w-0 h-0
                         border-l-[10px] border-l-transparent
                         border-r-[10px] border-r-transparent
                         border-t-[12px] border-t-white"
            />
          </div>
        </div>
      </div>
    </CustomOverlay>
  );
}
