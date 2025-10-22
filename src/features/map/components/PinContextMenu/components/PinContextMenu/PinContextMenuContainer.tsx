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
    // 일부 구현에서 question 핀의 id가 draft pk일 수 있음
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

  // 3) 근사 좌표(아주 작은 오차 허용, 약 1e-5 ≈ 1m 급)
  const EPS = 1e-5;
  const byNear = before.find(
    (d) => Math.abs(d.lat - lat) < EPS && Math.abs(d.lng - lng) < EPS
  );
  if (byNear) return Number(byNear.id);

  return undefined;
}

export default function PinContextMenuContainer(props: PinContextMenuProps) {
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
  } = props;

  if (!kakao || !map || !target) return null;

  const position = React.useMemo<kakao.maps.LatLng>(
    () => toLatLng(kakao, target),
    [kakao, target]
  );

  const { reserved, planned, listed, favActive } = useDerivedPinState({
    propertyId,
    pin,
    isPlanPinFromParent,
    isVisitReservedFromParent,
  });

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

  /** 컨텍스트 메뉴 삼각형 y 오프셋 */
  const xAnchor = 0.5;
  const yAnchor = 1;
  const offsetPx = 57;

  /* -------------------------- */
  /*  답사예약 버튼 분기 처리    */
  /* -------------------------- */
  const [reserving, setReserving] = React.useState(false);

  const handleReserveClick = async () => {
    // ✅ “답사예정 핀”이라면 반드시 /survey-reservations 로 POST
    if (planned) {
      try {
        setReserving(true);

        // 1) 직접 추출 시도
        let draftId = extractDraftIdFromPin(pin);

        // 2) 실패하면 before 목록에서 좌표/주소로 찾기
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
          // TODO: toast.error("임시핀 ID를 찾지 못했어요. 목록 동기화 후 다시 시도해 주세요.");
          return;
        }

        await createSurveyReservation({
          pinDraftId: draftId,
          reservedDate: todayKST(), // TODO: 이후 데이트피커로 교체
        });

        // TODO: toast.success("답사 예약이 생성되었습니다.");
        await refetchScheduledReservations();
        onClose?.();
      } catch (e) {
        console.error(e);
        // TODO: toast.error("예약 생성 중 오류가 발생했어요.");
      } finally {
        setReserving(false);
      }
      return;
    }

    // ✳️ “신규 주소핀/일반 핀”은 기존 로직 유지 → (onReserve or pin-drafts 흐름)
    return handleReserve();
  };

  return (
    <CustomOverlay
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
              onView={(id) => onView?.(id)}
              onCreate={onCreate}
              onPlan={handlePlan}
              // 🔴 여기서만 분기된 핸들러 사용
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
