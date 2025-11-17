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

/** 🔹 소수점 5자리 posKey (UI 그룹/매칭 전용)
 *  - ⚠️ 이 문자열을 역파싱해서 서버 payload 좌표로 사용하면 안 됨!
 *  - 서버 전송/DB 저장에는 항상 원본 lat/lng 숫자를 그대로 사용해야 함.
 */
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

/** before 목록에서 좌표/주소로 draft 찾기 (비교 용도라 toFixed/근사 사용 OK) */
function findDraftIdByHeuristics(args: {
  before: BeforeDraft[];
  lat: number;
  lng: number;
  roadAddress?: string | null;
  jibunAddress?: string | null;
}): number | undefined {
  const { before, lat, lng, roadAddress, jibunAddress } = args;
  const targetKey = posKey(lat, lng);

  const byPos = before.find(
    (d) => `${d.lat.toFixed(5)},${d.lng.toFixed(5)}` === targetKey
  );
  if (byPos) return Number(byPos.id);

  const addr = (roadAddress ?? jibunAddress ?? "").trim();
  if (addr) {
    const byAddr = before.find((d) => (d.addressLine ?? "").trim() === addr);
    if (byAddr) return Number(byAddr.id);
  }

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

  /** ✅ draftState 해석 (UI 표기용) */
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

  /** ⭐ 낙관적 planned 반영 (좌표 키 기반) */
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
      planned = metaAtPos.draftState !== "SCHEDULED" || planned;
      listed = false;
    } else if (metaAtPos.source === "point") {
      listed = true;
      planned = false;
    }
  }

  const { createVisitPlanAt, reserveVisitPlan } = useSidebar();
  const { refetch: refetchScheduledReservations } = useScheduledReservations();

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

    // 오버레이 정리 (라벨 복원은 Host unmount에서 처리)
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

      await createSurveyReservation({
        pinDraftId: draftId,
        reservedDate: todayYmdKST(),
      });

      try {
        await refetchScheduledReservations();
      } catch {}

      cleanupOverlaysAt(position.getLat(), position.getLng());
      bump();
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

    // ✅ 여기서 onCreate 로 넘기는 lat/lng 이 바로 매물 생성 모달에서 쓰는 "원본 좌표"
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

  /** 🔍 검색 드래프트인지 (선택 위치) 여부 */
  const isSearchDraft = String((pin as any)?.id ?? "") === "__draft__";

  /** 🔥 검색 드래프트 vs 기존핀 offset 분리
   *  - 검색 드래프트: 좀 더 위로 (핀을 거의 안 가리게)
   *  - 기존 핀/답사예정 핀: 예전 느낌에 가깝게 낮게
   */
  const offsetPx = isSearchDraft ? 78 : 56;

  const MENU_Z = Math.max(zIndex ?? 0, 1_000_000);

  /** ✅ ID/제목 보강 */
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

  /** 📌 위치 디버그 로그 */
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug("[PinContextMenu] position", {
      lat: position.getLat(),
      lng: position.getLng(),
      propertyId,
      pinId: (pin as any)?.id,
      isSearchDraft,
      offsetPx,
    });
  }, [position, propertyId, pin, isSearchDraft, offsetPx]);

  return (
    <CustomOverlay
      key={`ctx:${version}:${posK}`} // 🔹 key 도 posKey 재사용
      kakao={kakao}
      map={map}
      position={position}
      xAnchor={xAnchor}
      yAnchor={yAnchor}
      zIndex={MENU_Z}
      pointerEventsEnabled
    >
      {/* ✅ 전체 메뉴(카드+꼬리)를 한 덩어리로 위로 올린다 */}
      <div style={{ position: "relative", top: -offsetPx }}>
        <div role="dialog" aria-modal="true">
          <div className="relative pointer-events-auto">
            <ContextMenuPanel
              roadAddress={roadAddress ?? null}
              jibunAddress={jibunAddress ?? null}
              propertyId={propertyIdClean}
              propertyTitle={derivedPropertyTitle || null}
              draftState={resolvedDraftState}
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
            />
            {/* ⬇️ 카드 바로 아래에 붙어있는 말꼬리 (카드와 항상 붙어 있음) */}
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
