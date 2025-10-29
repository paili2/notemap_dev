"use client";

import * as React from "react";

import CustomOverlay from "@/features/map/components/PinContextMenu/components/CustomOverlay/CustomOverlay";

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
import { useRouter } from "next/navigation";
import { usePropertyViewModal } from "@/features/properties/hooks/useEditForm/usePropertyViewModal";
import type { MergedMarker } from "@/features/map/pages/MapHome/hooks/useMergedMarkers";
import { useReservationVersion } from "@/features/survey-reservations/store/useReservationVersion";
import { todayYmdKST } from "@/shared/date/todayYmdKST";

/** 소수점 5자리 posKey */
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

/** before 목록에서 좌표/주소로 draft 찾기 (최후 보조용) */
function findDraftIdByHeuristics(args: {
  before: BeforeDraft[];
  lat: number;
  lng: number;
  roadAddress?: string | null;
  jibunAddress?: string | null;
}): number | undefined {
  const { before, lat, lng, roadAddress, jibunAddress } = args;
  const targetKey = posKey(lat, lng);

  // 1) 좌표 완전 일치
  const byPos = before.find(
    (d) => `${d.lat.toFixed(5)},${d.lng.toFixed(5)}` === targetKey
  );
  if (byPos) return Number(byPos.id);

  // 2) 주소 라인 일치
  const addr = (roadAddress ?? jibunAddress ?? "").trim();
  if (addr) {
    const byAddr = before.find((d) => (d.addressLine ?? "").trim() === addr);
    if (byAddr) return Number(byAddr.id);
  }

  // 3) 근사 좌표(≈1m)
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
  } = props;

  const version = useReservationVersion((s) => s.version);
  const bump = useReservationVersion((s) => s.bump);

  const router = useRouter();
  const viewModal = usePropertyViewModal();

  const handleView = () => {
    const id = String(propertyId ?? "");
    if (!id || id === "__draft__" || id.startsWith("__visit__")) return;
    props.onView?.(id);
    Promise.resolve().then(() => onClose?.());
  };

  if (!kakao || !map || !target) return null;

  const position = React.useMemo<kakao.maps.LatLng>(
    () => toLatLng(kakao, target),
    [kakao, target]
  );

  const handleCreateClick = React.useCallback(() => {
    const lat = position.getLat();
    const lng = position.getLng();
    const fromPinDraftId = extractDraftIdFromPin(pin);

    onCreate?.({
      latFromPin: lat,
      lngFromPin: lng,
      fromPinDraftId,
      address: (roadAddress ?? jibunAddress ?? null) as string | null,
    });

    onClose?.();
  }, [onCreate, onClose, position, pin, roadAddress, jibunAddress]);

  /** 기본 판정 */
  const base = useDerivedPinState({
    propertyId,
    pin,
    isPlanPinFromParent,
    isVisitReservedFromParent,
  });
  let { reserved, planned, listed, favActive } = base;

  /** 신규 클릭 가드: '__draft__' 는 항상 신규로 취급 */
  const isNewClick = propertyId === "__draft__";
  if (isNewClick) {
    reserved = false;
    planned = false;
    listed = false;
  }

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

  /** ✅ draftState 해석 */
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

  /** ⭐ 낙관적 planned 반영 */
  const posK = React.useMemo(
    () => posKey(position.getLat(), position.getLng()),
    [position]
  );
  if (!isNewClick && optimisticPlannedPosSet.has(posK)) {
    planned = true;
    reserved = false;
    listed = false;
  }

  /** 메타 override (신규 클릭일 땐 override 하지 않음) */
  if (!isNewClick && metaAtPos) {
    if (metaAtPos.source === "draft") {
      reserved = metaAtPos.draftState === "SCHEDULED";
      planned = metaAtPos.draftState !== "SCHEDULED" || planned; // 낙관 유지
      listed = false;
    } else if (metaAtPos.source === "point") {
      listed = true;
      planned = false;
    }
  }

  const { createVisitPlanAt, reserveVisitPlan } = useSidebar();
  const { refetch: refetchScheduledReservations } = useScheduledReservations();

  const { handlePlan, handleReserve } = usePlanReserve({
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

  /** 공용 오버레이 정리 */
  const cleanupOverlaysAt = React.useCallback((lat: number, lng: number) => {
    try {
      const anyWin = globalThis as any;
      if (typeof anyWin.__cleanupOverlaysAtPos === "function") {
        anyWin.__cleanupOverlaysAtPos(lat, lng);
      }
      if (typeof window !== "undefined" && "dispatchEvent" in window) {
        window.dispatchEvent(
          new CustomEvent("map:cleanup-overlays-at", { detail: { lat, lng } })
        );
      }
    } catch (e) {
      console.warn("[PinContextMenu] cleanupOverlaysAt failed:", e);
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

    // 뷰포트 리패치 우선, 실패 시 임시 주입
    let refreshed = false;
    const box = getBoundsBox();
    if (refreshViewportPins && box) {
      try {
        await refreshViewportPins(box);
        refreshed = true;
      } catch (e) {
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

  /** ✅ 예약용 draftId 해석기: POST만 보장 */
  const getDraftIdForReservation = React.useCallback(async (): Promise<
    number | undefined
  > => {
    // 1) 핀 객체에서 직접
    let draftId = extractDraftIdFromPin(pin);
    if (draftId != null) return draftId;

    // 2) 메타(클러스터 병합 정보)에서
    const metaDraftId =
      metaAtPos?.source === "draft" ? (metaAtPos as any)?.draftId : undefined;
    if (typeof metaDraftId === "number") return metaDraftId;

    // 3) propertyId에 숫자 형태가 포함된 경우 (예: "__plan__123")
    const idStr = String(propertyId ?? "");
    const m = idStr.match(/(\d{1,})$/);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n)) return n;
    }

    // 4) 최후 보조: before 목록에서 좌표/주소로 추정 (이 호출은 보조일 뿐)
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
    } catch {
      // 무시 (보조 실패)
    }

    return undefined;
  }, [pin, metaAtPos, propertyId, position, roadAddress, jibunAddress]);

  const [reserving, setReserving] = React.useState(false);

  /** ✅ “답사지 예약” → 반드시 POST /survey-reservations */
  const handleReserveClick = async () => {
    try {
      setReserving(true);

      // planned 여부와 무관하게, 이 핸들러는 “예약 확정”이므로 POST만 보낸다.
      let draftId = await getDraftIdForReservation();
      if (draftId == null) {
        console.error("No pinDraftId resolved for reservation", {
          pin,
          propertyId,
          pos: [position.getLat(), position.getLng()],
        });
        // 실패 시, 기존 로직으로 fallback 하고 싶다면 아래 주석 해제:
        // return handleReserve();
        return; // ← 요구사항: POST만 보장. draftId 없으면 중단.
      }

      await createSurveyReservation({
        pinDraftId: draftId,
        reservedDate: todayYmdKST(),
      });

      await (async () => {
        try {
          await refetchScheduledReservations();
        } catch {}
      })();

      cleanupOverlaysAt(position.getLat(), position.getLng());
      bump();
      onClose?.();
    } catch (e) {
      console.error(e);
    } finally {
      setReserving(false);
    }
  };

  const xAnchor = 0.5;
  const yAnchor = 1;
  const offsetPx = 57;

  return (
    <CustomOverlay
      key={`ctx:${version}:${position.getLat().toFixed(5)},${position
        .getLng()
        .toFixed(5)}`}
      kakao={kakao}
      map={map}
      position={position}
      xAnchor={xAnchor}
      yAnchor={yAnchor}
      zIndex={zIndex}
      pointerEventsEnabled
    >
      <div style={{ transform: `translateY(-${offsetPx}px)` }}>
        <div role="dialog" aria-modal="true">
          <div className="relative pointer-events-auto">
            <ContextMenuPanel
              roadAddress={roadAddress ?? null}
              jibunAddress={jibunAddress ?? null}
              propertyId={propertyId ?? null}
              propertyTitle={propertyTitle ?? null}
              /** ⬇️ 서버/메타에서 해석된 draftState를 패널에 전달 (UI 표시 용) */
              draftState={resolvedDraftState}
              onClose={onClose}
              onView={handleView}
              onCreate={handleCreateClick}
              onPlan={handlePlanClick}
              /** ⬇️ 예약 버튼은 항상 여기 핸들러 → POST 보장 */
              onReserve={reserving ? () => {} : handleReserveClick}
              isPlanPin={planned}
              isVisitReservedPin={reserved}
              showFav={listed}
              onAddFav={onAddFav}
              favActive={favActive}
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
