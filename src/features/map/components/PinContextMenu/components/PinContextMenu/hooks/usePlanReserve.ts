import { useCallback } from "react";

import { buildAddressLine } from "../utils/geo";
import { PlanRequestPayload, ReserveRequestPayload } from "../types";

export function usePlanReserve(params: {
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
  }) => Promise<{ id: string | number }>;
  reserveVisitPlan: (id: string) => Promise<void>;
  loadScheduledReservations: () => Promise<void>;
}) {
  const {
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

  const handlePlan = useCallback(
    async (opts?: Partial<PlanRequestPayload>) => {
      if (!opts) return;

      const lat = typeof opts.lat === "number" ? opts.lat : position.getLat();
      const lng = typeof opts.lng === "number" ? opts.lng : position.getLng();

      const address =
        opts.address && opts.address.trim()
          ? opts.address
          : buildAddressLine(
              lat,
              lng,
              roadAddress,
              jibunAddress,
              propertyTitle
            );

      const payload: PlanRequestPayload = {
        lat,
        lng,
        address,
        roadAddress: opts.roadAddress ?? roadAddress ?? null,
        jibunAddress: opts.jibunAddress ?? jibunAddress ?? null,
        propertyId: opts.propertyId ?? propertyId ?? null,
        propertyTitle: opts.propertyTitle ?? propertyTitle ?? null,
        dateISO: opts.dateISO ?? new Date().toISOString().slice(0, 10),
      };

      await createVisitPlanAt({
        lat: payload.lat,
        lng: payload.lng,
        roadAddress: payload.roadAddress ?? null,
        jibunAddress: payload.jibunAddress ?? null,
        title: payload.address,
      });

      await onPlan?.(payload);
    },
    [
      position,
      roadAddress,
      jibunAddress,
      propertyId,
      propertyTitle,
      createVisitPlanAt,
      onPlan,
    ]
  );

  const handleReserve = useCallback(
    async (payload?: ReserveRequestPayload) => {
      let visitId: string | number | undefined =
        payload && "visitId" in payload ? payload.visitId : undefined;

      if (!visitId) {
        const lat =
          payload && "lat" in payload && typeof payload.lat === "number"
            ? payload.lat
            : position.getLat();
        const lng =
          payload && "lng" in payload && typeof payload.lng === "number"
            ? payload.lng
            : position.getLng();
        const title =
          payload && "title" in payload && payload.title
            ? payload.title
            : buildAddressLine(
                lat,
                lng,
                roadAddress,
                jibunAddress,
                propertyTitle
              );

        const draft = await createVisitPlanAt({
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
        visitId = draft.id;
      }

      await reserveVisitPlan(String(visitId));
      await loadScheduledReservations();
      await onReserve?.(
        visitId
          ? {
              kind: "visit",
              visitId,
              dateISO: new Date().toISOString().slice(0, 10),
            }
          : undefined
      );
      onClose?.();
    },
    [
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
