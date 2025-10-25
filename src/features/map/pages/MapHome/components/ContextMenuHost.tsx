"use client";

import PinContextMenuContainer from "../../../components/PinContextMenu/components/PinContextMenu/PinContextMenuContainer";
import type { MapMarker } from "../../../types/map";
import { createSurveyReservation } from "@/shared/api/surveyReservations";
import { createPinDraft } from "@/shared/api/pins";
import { useToast } from "@/hooks/use-toast";
import { useScheduledReservations } from "@/features/survey-reservations/hooks/useScheduledReservations";
import type { MergedMarker } from "../hooks/useMergedMarkers";
import { useReservationVersion } from "@/features/survey-reservations/store/useReservationVersion";
import { useMemo, useRef } from "react";

function getPosKey(m: any): string | undefined {
  const lat =
    typeof m?.lat === "number"
      ? m.lat
      : typeof m?.position?.lat === "number"
      ? m.position.lat
      : m?.getPosition?.().getLat?.();
  const lng =
    typeof m?.lng === "number"
      ? m.lng
      : typeof m?.position?.lng === "number"
      ? m.position.lng
      : m?.getPosition?.().getLng?.();
  if (typeof lat === "number" && typeof lng === "number") {
    return `${lat.toFixed(4)},${lng.toFixed(4)}`;
  }
  return undefined;
}

export default function ContextMenuHost(props: {
  open: boolean;
  kakaoSDK: any;
  mapInstance: any;
  menuAnchor?: { lat: number; lng: number } | null;
  menuTargetId?: string | number | null;
  menuTitle?: string | null;
  menuRoadAddr?: string | null;
  menuJibunAddr?: string | null;
  visibleMarkers: MapMarker[];
  favById: Record<string, boolean>;
  siteReservations?: any[];
  onCloseMenu?: () => void;
  onViewFromMenu?: (id: string) => void;
  onCreateFromMenu?: (pos: { lat: number; lng: number }) => void;
  onPlanFromMenu?: (pos: { lat: number; lng: number }) => void;
  onReserveFromMenu?: (
    args:
      | { visitId: string; dateISO: string }
      | {
          lat: number;
          lng: number;
          title?: string | null;
          roadAddress?: string | null;
          jibunAddress?: string | null;
          dateISO: string;
        }
  ) => Promise<void>;
  onAddFav?: () => void;
  onOpenMenu?: (args: any) => void;
  onChangeHideLabelForId?: (id?: string) => void;

  mergedMeta?: MergedMarker[];
  upsertDraftMarker?: (m: {
    id: string | number;
    lat: number;
    lng: number;
    address?: string | null;
    source?: "draft";
    kind?: string;
  }) => void;

  refreshViewportPins?: (bounds: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  }) => Promise<void> | void;
}) {
  const {
    open,
    kakaoSDK,
    mapInstance,
    menuAnchor,
    menuTargetId,
    menuTitle,
    menuRoadAddr,
    menuJibunAddr,
    visibleMarkers,
    favById,
    siteReservations,
    onCloseMenu,
    onViewFromMenu,
    onCreateFromMenu,
    onPlanFromMenu,
    onReserveFromMenu,
    onAddFav,
    mergedMeta,
    upsertDraftMarker,
    refreshViewportPins,
    onChangeHideLabelForId,
  } = props;

  // ── Hooks: 조건부 return 이전에 항상 호출 ─────────────────────────────
  const sr = useScheduledReservations();
  const { refetch } = sr;
  const { toast } = useToast();
  const version = useReservationVersion((s) => s.version);
  const bump = useReservationVersion((s) => s.bump);

  const optimisticReservedIdsRef = useRef<Set<string>>(new Set());
  const optimisticReservedPosRef = useRef<Set<string>>(new Set());

  // 파생 계산 (훅 OK)
  const targetPin = menuTargetId
    ? visibleMarkers.find((m) => String(m.id) === String(menuTargetId))
    : undefined;

  const reservations: any[] = useMemo(() => {
    const cands = [
      (sr as any)?.items,
      (sr as any)?.list,
      (sr as any)?.data,
      (sr as any)?.reservations,
      Array.isArray(sr) ? (sr as any) : undefined,
    ];
    const picked = cands.find((x) => Array.isArray(x));
    if (Array.isArray(picked)) return picked as any[];
    return Array.isArray(siteReservations) ? siteReservations : [];
  }, [sr, siteReservations, version]);

  const reservedIdSet = new Set(reservations.map((it: any) => String(it.id)));
  const posKeyOfTarget = targetPin?.position
    ? getPosKey(targetPin.position)
    : undefined;
  const reservedPosSet = new Set(
    reservations.map((it: any) => it?.posKey).filter(Boolean)
  );
  const isVisitReservedPin =
    (!!menuTargetId &&
      (reservedIdSet.has(String(menuTargetId)) ||
        optimisticReservedIdsRef.current.has(String(menuTargetId)))) ||
    (!!posKeyOfTarget &&
      (reservedPosSet.has(posKeyOfTarget) ||
        optimisticReservedPosRef.current.has(posKeyOfTarget)));

  // ── 가드 (훅/계산 후에) ───────────────────────────────────────────────
  if (!open || !mapInstance || !kakaoSDK || !menuAnchor) {
    return null;
  }

  // ── 타입 안전 좌표, pin 1회만 생성 ────────────────────────────────────
  type LatLngRO = Readonly<{ lat: number; lng: number }>;
  const anchorPos: LatLngRO = { lat: menuAnchor.lat, lng: menuAnchor.lng };

  const pin:
    | {
        id: string;
        title: string;
        position: LatLngRO;
        kind: any;
        isFav: boolean;
      }
    | {
        id: "__draft__";
        title: "선택 위치";
        position: LatLngRO;
        kind: string;
        isFav: boolean;
      } =
    menuTargetId && targetPin
      ? {
          id: String(targetPin.id),
          title: targetPin.title ?? "이름 없음",
          position: targetPin.position as LatLngRO,
          kind: (targetPin as any)?.kind ?? "1room",
          isFav: Boolean(
            !!menuTargetId &&
              Object.prototype.hasOwnProperty.call(favById, menuTargetId)
              ? (favById as any)[menuTargetId!]
              : (targetPin as any)?.isFav
          ),
        }
      : {
          id: "__draft__",
          title: "선택 위치",
          position: anchorPos,
          kind: "question",
          isFav: false,
        };

  const isPlanPin =
    !isVisitReservedPin &&
    pin.kind === "question" &&
    String(pin.id) !== "__draft__";

  // ── 예약 로직 ─────────────────────────────────────────────────────────
  const reserveDefault = async (
    args:
      | { visitId: string; dateISO: string }
      | {
          lat: number;
          lng: number;
          title?: string | null;
          roadAddress?: string | null;
          jibunAddress?: string | null;
          dateISO: string;
        }
  ) => {
    try {
      // 1) visitId 기반 예약
      if ("visitId" in args) {
        const pinDraftId = Number(args.visitId);
        if (!Number.isFinite(pinDraftId))
          throw new Error("유효하지 않은 visitId");

        // 낙관 반영
        optimisticReservedIdsRef.current.add(String(args.visitId));
        const basePosForVisit = targetPin?.position ?? anchorPos;
        const posKeyForVisit = getPosKey(basePosForVisit);
        if (posKeyForVisit)
          optimisticReservedPosRef.current.add(posKeyForVisit);

        await createSurveyReservation({
          pinDraftId,
          reservedDate: args.dateISO,
        });
        toast({ title: "예약 등록 완료", description: args.dateISO });
        await refetch();
        return;
      }

      // 2) 좌표 기반 예약
      const { lat, lng, title, roadAddress, jibunAddress, dateISO } = args;

      const draft = await createPinDraft({
        lat,
        lng,
        addressLine: roadAddress ?? jibunAddress ?? title ?? "선택 위치",
      });

      const pinDraftId =
        typeof draft === "object" && draft && "id" in draft
          ? Number((draft as any).id)
          : Number(draft);

      if (!Number.isFinite(pinDraftId)) throw new Error("임시핀 생성 실패");

      const samePos = targetPin?.position
        ? { lat: targetPin.position.lat, lng: targetPin.position.lng }
        : { lat, lng };

      upsertDraftMarker?.({
        id: `__visit__${pinDraftId}`,
        lat: samePos.lat,
        lng: samePos.lng,
        address: roadAddress ?? jibunAddress ?? title ?? null,
        source: "draft",
        kind: "question",
      });

      if (menuTargetId) {
        onChangeHideLabelForId?.(String(menuTargetId));
      }

      const posKey = getPosKey(samePos);
      if (posKey) optimisticReservedPosRef.current.add(posKey);

      await createSurveyReservation({ pinDraftId, reservedDate: dateISO });
      toast({ title: "예약 등록 완료", description: dateISO });
      await refetch();

      try {
        const b = mapInstance?.getBounds?.();
        if (b) {
          await refreshViewportPins?.({
            sw: {
              lat: b.getSouthWest().getLat(),
              lng: b.getSouthWest().getLng(),
            },
            ne: {
              lat: b.getNorthEast().getLat(),
              lng: b.getNorthEast().getLng(),
            },
          });
        }
      } catch {
        /* no-op */
      }
    } catch (e: any) {
      const msg = String(e?.response?.data?.message ?? e?.message ?? e);
      toast({
        title: "예약 등록 실패",
        description:
          msg.includes("duplicate") || msg.includes("이미")
            ? "이미 예약된 임시핀입니다. 기존 예약을 취소하거나 다른 위치를 선택해 주세요."
            : msg,
        variant: "destructive",
      });
      throw e;
    } finally {
      bump(); // 렌더 키 갱신 보장
    }
  };

  return (
    <PinContextMenuContainer
      key={
        menuTargetId
          ? `bubble:${version}:${menuTargetId}`
          : `bubble:draft:${version}:${menuAnchor.lat.toFixed(
              5
            )},${menuAnchor.lng.toFixed(5)}`
      }
      kakao={kakaoSDK}
      map={mapInstance}
      position={new kakaoSDK.maps.LatLng(menuAnchor.lat, menuAnchor.lng)}
      roadAddress={menuRoadAddr ?? undefined}
      jibunAddress={menuJibunAddr ?? undefined}
      propertyId={menuTargetId != null ? String(menuTargetId) : "__draft__"}
      propertyTitle={menuTitle ?? undefined}
      mergedMeta={mergedMeta}
      pin={pin as any} // PinContextMenuContainer의 기대 타입에 맞게 필요한 경우 조정
      onClose={onCloseMenu ?? (() => {})}
      onView={onViewFromMenu ?? (() => {})}
      onCreate={() => {
        onCreateFromMenu?.({ lat: menuAnchor.lat, lng: menuAnchor.lng });
      }}
      onPlan={() => {
        onPlanFromMenu?.({ lat: menuAnchor.lat, lng: menuAnchor.lng });
        bump();
        onCloseMenu?.();
      }}
      onReserve={async () => {
        const todayISO = new Date().toISOString().slice(0, 10);

        if (menuTargetId && String(menuTargetId).startsWith("__visit__")) {
          const visitId = String(menuTargetId).replace("__visit__", "");
          if (onReserveFromMenu) {
            await onReserveFromMenu({ visitId, dateISO: todayISO });
          } else {
            await reserveDefault({ visitId, dateISO: todayISO });
          }
        } else {
          const basePos = targetPin?.position ?? anchorPos;
          const payload = {
            lat: basePos.lat,
            lng: basePos.lng,
            title: menuTitle ?? null,
            roadAddress: menuRoadAddr ?? null,
            jibunAddress: menuJibunAddr ?? null,
            dateISO: todayISO,
          } as const;

          if (onReserveFromMenu) {
            await onReserveFromMenu(payload);
          } else {
            await reserveDefault(payload);
          }
        }
        onCloseMenu?.();
      }}
      onAddFav={onAddFav ?? (() => {})}
      zIndex={10000}
      isVisitReservedPin={isVisitReservedPin}
      isPlanPin={isPlanPin}
      upsertDraftMarker={upsertDraftMarker}
      refreshViewportPins={refreshViewportPins}
    />
  );
}
