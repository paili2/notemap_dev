"use client";

import * as React from "react";

import { useSidebar } from "@/features/sidebar";
import { toLatLng } from "./utils/geo";
import { useDerivedPinState } from "./hooks/useDerivedPinState";
import { usePlanReserve } from "./hooks/usePlanReserve";
import ContextMenuPanel from "../ContextMenuPanel/ContextMenuPanel";
import { PinContextMenuProps } from "./types";
import { useScheduledReservations } from "@/features/survey-reservations/hooks/useScheduledReservations";
import {
  BeforeDraft,
  createSurveyReservation,
  fetchUnreservedDrafts,
} from "@/shared/api/surveyReservations";
import type { MergedMarker } from "@/features/map/pages/MapHome/hooks/useMergedMarkers";
import { useReservationVersion } from "@/features/survey-reservations/store/useReservationVersion";
import { todayYmdKST } from "@/shared/date/todayYmdKST";
import CustomOverlay from "../CustomOverlay/CustomOverlay";
import { togglePinDisabled } from "@/shared/api/pins"; // ✅ 추가

/** 🔹 소수점 5자리 posKey (UI 그룹/매칭 전용) */
function posKey(lat: number, lng: number) {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

/** draftId 우선 추출 */
function extractDraftIdFromPin(pin: any): number | undefined {
  const raw =
    pin?.pinDraftId ??
    pin?.draftId ??
    pin?.draft?.id ??
    (typeof pin?.id === "number" ? pin.id : undefined);

  if (raw == null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** before 목록에서 좌표/주소로 draft 찾기 */
function findDraftIdByHeuristics(args: {
  before: BeforeDraft[];
  lat: number;
  lng: number;
  roadAddress?: string | null;
  jibunAddress?: string | null;
}): number | undefined {
  const { before, lat, lng, roadAddress, jibunAddress } = args;
  const targetKey = posKey(lat, lng);

  // 1) posKey 기반
  const byPos = before.find(
    (d) => `${d.lat.toFixed(5)},${d.lng.toFixed(5)}` === targetKey
  );
  if (byPos) return Number(byPos.id);

  // 2) 주소 기반
  const addr = (roadAddress ?? jibunAddress ?? "").trim();
  if (addr) {
    const byAddr = before.find((d) => (d.addressLine ?? "").trim() === addr);
    if (byAddr) return Number(byAddr.id);
  }

  // 3) 근사 lat/lng
  const EPS = 1e-5;
  const byNear = before.find(
    (d) => Math.abs(d.lat - lat) < EPS && Math.abs(d.lng - lng) < EPS
  );
  if (byNear) return Number(byNear.id);

  return undefined;
}

/** ⭐ 낙관적 "답사예정" 표식을 좌표 기준으로 저장 (페이지 생명주기 동안 유지) */
const optimisticPlannedPosSet = new Set<string>();

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
    !isNewClick && optimisticPlannedPosSet.has(posK);

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

  /** ⭐ 답사예정 생성 */
  const handlePlanClick = React.useCallback(async () => {
    const lat = position.getLat();
    const lng = position.getLng();

    const result = (await handlePlan()) as {
      draftId?: string | number;
      payload: { lat: number; lng: number; address?: string | null };
    } | void;

    optimisticPlannedPosSet.add(posK);

    let refreshed = false;
    const box = getBoundsBox();
    if (refreshViewportPins && box) {
      try {
        await refreshViewportPins(box);
        refreshed = true;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[PinContextMenu] refreshViewportPins failed:", e);
      }
    }
    if (!refreshed && result?.payload && upsertDraftMarker) {
      const id = (result.draftId ?? `__temp_${Date.now()}`) as string | number;
      upsertDraftMarker({
        id,
        lat: result.payload.lat,
        lng: result.payload.lng,
        address: result.payload.address ?? null,
      });
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cleanupOverlaysAt(lat, lng);
      });
    });

    bump();
  }, [
    handlePlan,
    posK,
    upsertDraftMarker,
    refreshViewportPins,
    getBoundsBox,
    position,
    cleanupOverlaysAt,
    bump,
  ]);

  /** 예약 */
  const [reserving, setReserving] = React.useState(false);
  const getDraftIdForReservation = React.useCallback(async (): Promise<
    number | undefined
  > => {
    let draftId = extractDraftIdFromPin(pin);
    if (draftId != null) return draftId;

    const metaDraftId =
      metaAtPos?.source === "draft" ? (metaAtPos as any)?.id : undefined;
    if (typeof metaDraftId === "number") return metaDraftId;

    const idStr = String(propertyId ?? "");
    const m = idStr.match(/(\d{1,})$/);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n)) return n;
    }

    try {
      const before = await fetchUnreservedDrafts();
      const lat = position.getLat();
      const lng = position.getLng();
      draftId = findDraftIdByHeuristics({
        before,
        lat,
        lng,
        roadAddress,
        jibunAddress,
      });
      if (draftId != null) return draftId;
    } catch {}

    return undefined;
  }, [pin, metaAtPos, propertyId, position, roadAddress, jibunAddress]);

  const handleReserveClick = async () => {
    try {
      setReserving(true);

      const draftId = await getDraftIdForReservation();
      if (draftId == null) {
        // eslint-disable-next-line no-console
        console.error("No pinDraftId resolved for reservation", {
          pin,
          propertyId,
          pos: [position.getLat(), position.getLng()],
        });
        return;
      }

      // ✅ 1) 예약 생성
      await createSurveyReservation({
        pinDraftId: draftId,
        reservedDate: todayYmdKST(),
      });

      // ✅ 2) 예약 리스트 동기화
      try {
        await refetchScheduledReservations();
      } catch {}

      // ✅ 3) 컨텍스트메뉴는 닫기
      onClose?.();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setReserving(false);
    }
  };

  /** 신규 등록/정보 입력 */
  const handleCreateClick = React.useCallback(async () => {
    const lat = position.getLat();
    const lng = position.getLng();

    let pinDraftId = extractDraftIdFromPin(pin);

    if (pinDraftId == null && metaAtPos?.source === "draft") {
      const n = Number((metaAtPos as any)?.id);
      if (Number.isFinite(n)) pinDraftId = n;
    }

    if (pinDraftId == null) {
      const idStr = String(propertyId ?? "");
      const m = idStr.match(/(\d{1,})$/);
      if (m) {
        const n = Number(m[1]);
        if (Number.isFinite(n)) pinDraftId = n;
      }
    }

    onCreate?.({
      latFromPin: lat,
      lngFromPin: lng,
      fromPinDraftId: pinDraftId,
      address: roadAddress ?? jibunAddress ?? null,
      roadAddress: roadAddress ?? null,
      jibunAddress: jibunAddress ?? null,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          const anyWin = globalThis as any;
          if (typeof anyWin.__cleanupOverlaysAtPos === "function") {
            anyWin.__cleanupOverlaysAtPos(lat, lng);
          }
        } catch {}
      });
    });
    onClose?.();
  }, [
    onCreate,
    onClose,
    position,
    pin,
    metaAtPos,
    propertyId,
    roadAddress,
    jibunAddress,
  ]);

  const xAnchor = 0.5;
  const yAnchor = 1;

  const offsetPx = isSearchDraft ? 78 : 56;
  const MENU_Z = Math.max(zIndex ?? 0, 1_000_000);

  const propertyIdClean = React.useMemo(() => {
    const raw = String(propertyId ?? "").trim();
    if (!raw) return null;
    const m = raw.match(/(\d{1,})$/);
    return (m?.[1] ?? raw) || null;
  }, [propertyId]);

  const derivedPropertyTitle = React.useMemo(() => {
    const metaTitle =
      (metaAtPos as any)?.property?.title ??
      (metaAtPos as any)?.title ??
      (metaAtPos as any)?.name ??
      undefined;
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
  }, [propertyTitle, pin, metaAtPos]);

  /** ✅ 매물 삭제 여부 상태 */
  const [deleting, setDeleting] = React.useState(false);

  const canDelete = React.useMemo(
    () => !!propertyIdClean && listed && !isSearchDraft,
    [propertyIdClean, listed, isSearchDraft]
  );

  const handleDelete = React.useCallback(async () => {
    if (!propertyIdClean || deleting) return;
    if (!confirm("정말 삭제(비활성화)할까요?")) return;

    try {
      setDeleting(true);
      // ✅ PropertyViewModal에서 쓰는 것과 동일한 요청
      await togglePinDisabled(String(propertyIdClean), true);

      // 부모 쪽에서 리스트/지도 갱신이 필요하면
      await onDeleteProperty?.(propertyIdClean);

      // 컨텍스트 메뉴 닫기
      onClose?.();
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.responseData?.message ||
        "비활성화 요청에 실패했습니다.";
      alert(msg);
    } finally {
      setDeleting(false);
    }
  }, [propertyIdClean, deleting, onDeleteProperty, onClose]);

  React.useEffect(() => {
    // 상태 디버그용
    // eslint-disable-next-line no-console
    console.debug("[PinContextMenu] position", {
      lat: position.getLat(),
      lng: position.getLng(),
      propertyId,
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
              /** 🔥 즐겨찾기 옆 매물삭제 버튼용 */
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
