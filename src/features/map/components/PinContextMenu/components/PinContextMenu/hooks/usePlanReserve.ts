import { useCallback } from "react";
import { buildAddressLine } from "../utils/geo";
import { PlanRequestPayload, ReserveRequestPayload } from "../types";

type Mode = "view" | "create"; // view: 보기(토글 전용), create: 생성/예약 플로우

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

export function usePlanReserve(params: {
  mode?: Mode;
  position: kakao.maps.LatLng;
  roadAddress?: string | null;
  jibunAddress?: string | null;
  propertyId?: string | null;
  propertyTitle?: string | null;
  onPlan?: (p: PlanRequestPayload) => Promise<void> | void;
  onReserve?: (p?: ReserveRequestPayload) => Promise<void> | void;
  onClose?: () => void;
  createVisitPlanAt: (args: {
    lat: number;
    lng: number;
    roadAddress: string | null;
    jibunAddress: string | null;
    title: string;
  }) => Promise<
    | {
        id?: string | number;
        draftId?: string | number;
        data?: { id?: string | number; draftId?: string | number };
      }
    | any
  >;
  reserveVisitPlan: (id: string) => Promise<void>;
  loadScheduledReservations: () => Promise<void>;
}) {
  const {
    mode = "view",
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
    loadScheduledReservations,
  } = params;

  // ────────────────────────────────────────────
  // 1) 계획(임시핀 생성) - view 모드면 생성 없이 onPlan만 호출
  // 반환: { draftId?, payload }
  // ────────────────────────────────────────────
  const handlePlan = useCallback(
    async (
      opts: Partial<PlanRequestPayload> = {}
    ): Promise<{
      draftId?: string | number;
      payload: PlanRequestPayload;
    } | void> => {
      const lat = typeof opts.lat === "number" ? opts.lat : position.getLat();
      const lng = typeof opts.lng === "number" ? opts.lng : position.getLng();

      const address =
        (opts.address && opts.address.trim()) ||
        buildAddressLine(lat, lng, roadAddress, jibunAddress, propertyTitle);

      const payload: PlanRequestPayload = {
        lat,
        lng,
        address,
        roadAddress: opts.roadAddress ?? roadAddress ?? null,
        jibunAddress: opts.jibunAddress ?? jibunAddress ?? null,
        propertyId: opts.propertyId ?? propertyId ?? null,
        propertyTitle: opts.propertyTitle ?? propertyTitle ?? null,
        dateISO: opts.dateISO ?? todayKST(),
      };

      let createdId: string | number | undefined;

      if (mode === "create") {
        try {
          const draft = await createVisitPlanAt({
            lat: payload.lat,
            lng: payload.lng,
            roadAddress: payload.roadAddress ?? null,
            jibunAddress: payload.jibunAddress ?? null,
            title: payload.address,
          });

          createdId =
            draft?.id ??
            draft?.draftId ??
            draft?.data?.id ??
            draft?.data?.draftId ??
            undefined;
        } catch (e) {
          console.error("[plan] createVisitPlanAt failed:", e);
          return; // 생성 실패 시 이후 콜백은 호출하지 않음
        }
      }

      try {
        await onPlan?.(payload);
      } catch (e) {
        console.error("[plan] onPlan callback failed:", e);
      }

      return { draftId: createdId, payload };
    },
    [
      mode,
      position,
      roadAddress,
      jibunAddress,
      propertyId,
      propertyTitle,
      createVisitPlanAt,
      onPlan,
    ]
  );

  // ────────────────────────────────────────────
  // 2) 예약 - view 모드에선 visitId 없으면 생성하지 않음
  // 반환: { success, visitId? }
  // ────────────────────────────────────────────
  const handleReserve = useCallback(
    async (
      payload?: ReserveRequestPayload
    ): Promise<{ success: boolean; visitId?: string | number }> => {
      let visitId: string | number | undefined =
        payload && "visitId" in payload ? payload.visitId : undefined;

      // 보기 모드: 새 draft 만들지 않음
      if (!visitId && mode === "view") {
        // skip silently
        return { success: false };
      }

      // 생성 모드: visitId 없으면 draft 만들어서 진행
      if (!visitId && mode === "create") {
        const lat =
          payload && "lat" in payload && typeof payload.lat === "number"
            ? payload.lat
            : position.getLat();
        const lng =
          payload && "lng" in payload && typeof payload.lng === "number"
            ? payload.lng
            : position.getLng();

        const title =
          (payload && "title" in payload && payload.title) ||
          buildAddressLine(lat, lng, roadAddress, jibunAddress, propertyTitle);

        let draft: any;
        try {
          draft = await createVisitPlanAt({
            lat,
            lng,
            roadAddress:
              payload && "roadAddress" in payload
                ? payload.roadAddress ?? null
                : roadAddress ?? null,
            jibunAddress:
              payload && "jibunAddress" in payload
                ? payload.jibunAddress ?? null
                : jibunAddress ?? null,
            title,
          });
        } catch (e) {
          console.error("[reserve] createVisitPlanAt failed:", e);
          return { success: false };
        }

        // 다양한 응답 형태 대응
        const draftId =
          draft?.id ??
          draft?.draftId ??
          draft?.data?.id ??
          draft?.data?.draftId ??
          undefined;

        if (draftId == null) {
          console.warn("[reserve] create returned without id/draftId:", draft);
          return { success: false };
        }
        visitId = String(draftId);
      }

      if (!visitId) {
        return { success: false };
      }

      try {
        await reserveVisitPlan(String(visitId));
        await loadScheduledReservations();
      } catch (e) {
        console.error(
          "[reserve] reserveVisitPlan/loadScheduledReservations failed:",
          e
        );
        return { success: false };
      }

      try {
        await onReserve?.({
          kind: "visit",
          visitId,
          dateISO:
            (payload && "dateISO" in payload && payload.dateISO) || todayKST(),
        });
      } catch (e) {
        console.error("[reserve] onReserve callback failed:", e);
      }

      onClose?.();
      return { success: true, visitId };
    },
    [
      mode,
      position,
      roadAddress,
      jibunAddress,
      propertyTitle,
      onReserve,
      onClose,
      createVisitPlanAt,
      reserveVisitPlan,
      loadScheduledReservations,
    ]
  );

  return { handlePlan, handleReserve };
}
