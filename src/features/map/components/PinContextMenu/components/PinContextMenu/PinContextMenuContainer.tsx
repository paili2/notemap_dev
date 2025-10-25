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

/* 오늘(한국표준시) "YYYY-MM-DD" */
function todayKST(): string {
  const now = new Date();
  const kst = new Date(
    now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60 * 1000
  );
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

type FindDraftArgs = {
  before: BeforeDraft[];
  lat: number;
  lng: number;
  roadAddress?: string | null;
  jibunAddress?: string | null;
};

/** before 목록에서 좌표/주소로 draft 찾기 */
function findDraftIdByHeuristics(args: FindDraftArgs): number | undefined {
  const { before, lat, lng, roadAddress, jibunAddress } = args;
  const targetKey = posKey(lat, lng);

  // 1) 좌표 posKey 완전 일치
  const byPos = before.find((d) => posKey(d.lat, d.lng) === targetKey);
  if (byPos) return Number(byPos.id);

  // 2) 주소 라인 일치(보조)
  if (roadAddress || jibunAddress) {
    const addr = (roadAddress ?? jibunAddress ?? "").trim();
    if (addr) {
      const byAddr = before.find((d) => (d.addressLine ?? "").trim() === addr);
      if (byAddr) return Number(byAddr.id);
    }
  }

  // 3) 근사 좌표(약 1m 허용)
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
  /** useMergedMarkers에서 전달되는 판정용 메타 */
  mergedMeta?: MergedMarker[];
  /** ✅ 뷰포트 마커 갱신용 선택 콜백(있으면 즉시 재패치) */
  refreshViewportPins?: (bounds: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  }) => Promise<void> | void;
  /** ✅ 등록 직후 임시 draft 마커를 로컬에 주입 (새로고침 없이 지도에 즉시 표시) */
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
    refreshViewportPins, // ✅ 선택 콜백
    upsertDraftMarker, // ✅ 임시 마커 주입 콜백
  } = props;

  const version = useReservationVersion((s) => s.version);
  const bump = useReservationVersion((s) => s.bump);

  const router = useRouter();
  const viewModal = usePropertyViewModal();

  const handleView = () => {
    viewModal.openWithPin({
      pin,
      propertyId,
      roadAddress,
      jibunAddress,
      propertyTitle,
    });
    onClose?.();
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
      // 폼/저장에서 반드시 이 값을 우선 사용하도록!
      latFromPin: lat,
      lngFromPin: lng,
      fromPinDraftId,
      // 선택: 주소도 같이 넘기면 폼 초기값에 좋음
      address: (roadAddress ?? jibunAddress ?? null) as string | null,
    });

    // 메뉴 닫기
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
      planned = metaAtPos.draftState !== "SCHEDULED" || planned; // 낙관적 planned 유지
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

  /** ✅ 현재 지도 bounds를 {sw, ne}로 추출 */
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

  /** ─────────────────────────────────────────
   *  공용: 동일 좌표 오버레이/라벨 정리 훅
   *  - 전역 함수나 커스텀 이벤트가 연결돼 있으면 호출
   *  - 없다면 그냥 지나가도 무해
   *  ───────────────────────────────────────── */
  const cleanupOverlaysAt = React.useCallback((lat: number, lng: number) => {
    try {
      // (A) 전역 훅을 제공하는 경우
      // window.__cleanupOverlaysAtPos?.(lat, lng)
      const anyWin = globalThis as any;
      if (typeof anyWin.__cleanupOverlaysAtPos === "function") {
        anyWin.__cleanupOverlaysAtPos(lat, lng);
      }
      // (B) 이벤트로 브로드캐스트 (클러스터/오버레이 모듈에서 수신)
      if (typeof window !== "undefined" && "dispatchEvent" in window) {
        window.dispatchEvent(
          new CustomEvent("map:cleanup-overlays-at", { detail: { lat, lng } })
        );
      }
    } catch (e) {
      console.warn("[PinContextMenu] cleanupOverlaysAt failed:", e);
    }
  }, []);

  /** ⭐ onPlan 클릭 시: 서버 생성 → (중복 방지) 주입 or 리패치 중 하나 → 동기화 → 오버레이 정리 → 리렌더 */
  const handlePlanClick = React.useCallback(async () => {
    const lat = position.getLat();
    const lng = position.getLng();

    // 1) 서버에 draft 생성 (usePlanReserve가 draftId/payload 반환)
    const result = (await handlePlan()) as {
      draftId?: string | number;
      payload: { lat: number; lng: number; address?: string | null };
    } | void;

    // 2) 즉시 예정으로 보이도록 낙관적 전환
    optimisticPlannedPosSet.add(posK);

    // 3) "둘 다" 하지 말고 하나만!
    // FIX: refreshViewportPins가 있으면 임시 주입을 생략 → 겹라벨 예방
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
      // 리패치가 실패했을 때만 임시 주입
      const id = (result.draftId ?? `__temp_${Date.now()}`) as string | number;
      upsertDraftMarker({
        id,
        lat: result.payload.lat,
        lng: result.payload.lng,
        address: result.payload.address ?? null,
      });
    }

    // 4) 서버 동기화(목록 재조회) — before 목록/상태 갱신
    try {
      await fetchUnreservedDrafts();
    } catch {}

    // 5) 동일 좌표에 남은 오버레이 청소 (임시 + 신규 중복 제거)
    // FIX: 겹라벨 방지 핵심
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cleanupOverlaysAt(lat, lng);
      });
    });

    // 6) 컨텍스트 메뉴 강제 리렌더(상태 즉시 반영)
    bump();
  }, [
    handlePlan,
    posK,
    upsertDraftMarker,
    refreshViewportPins,
    getBoundsBox,
    router,
    position,
    cleanupOverlaysAt,
    bump,
  ]);

  const xAnchor = 0.5;
  const yAnchor = 1;
  const offsetPx = 57;

  const [reserving, setReserving] = React.useState(false);

  const handleReserveClick = async () => {
    // “답사예정 핀” → /survey-reservations POST
    if (planned) {
      try {
        setReserving(true);

        let draftId = extractDraftIdFromPin(pin);

        if (draftId == null) {
          const lat = position.getLat();
          const lng = position.getLng();
          const before = await fetchUnreservedDrafts();
          draftId = findDraftIdByHeuristics({
            before,
            lat,
            lng,
            roadAddress,
            jibunAddress,
          });
        }

        if (draftId == null) {
          console.error("No pinDraftId for planned pin", {
            pin,
            rawId: pin?.id,
            roadAddress,
            jibunAddress,
            pos: [position.getLat(), position.getLng()],
          });
          return;
        }

        await createSurveyReservation({
          pinDraftId: draftId,
          reservedDate: todayKST(),
        });

        // 예약 완료 → 스케줄 재패치
        await refetchScheduledReservations();

        // FIX: 예약으로 상태 전환 시에도 좌표 중복 오버레이 정리
        cleanupOverlaysAt(position.getLat(), position.getLng());

        bump();

        onClose?.();
      } catch (e) {
        console.error(e);
      } finally {
        setReserving(false);
      }
      return;
    }

    // 신규/일반 핀 → 기존 로직
    return handleReserve();
  };

  return (
    <CustomOverlay
      key={`ctx:${version}:${position.getLat().toFixed(5)},${position
        .getLng()
        .toFixed(5)}`} // ✅ 등록 직후 강제 리마운트로 반영
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
              onClose={onClose}
              onView={handleView}
              onCreate={handleCreateClick}
              onPlan={handlePlanClick}
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
