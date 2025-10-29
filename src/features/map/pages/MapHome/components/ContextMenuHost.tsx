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

/* ───────── 로컬 좌표 디버그(외부 의존 제거) ───────── */
function assertNoTruncate(tag: string, lat: number, lng: number) {
  const latStr = String(lat);
  const lngStr = String(lng);
  const latDec = latStr.split(".")[1]?.length ?? 0;
  const lngDec = lngStr.split(".")[1]?.length ?? 0;
  // eslint-disable-next-line no-console
  console.debug(`[coords-send:${tag}]`, {
    lat,
    lng,
    latStr,
    lngStr,
    latDecimals: latDec,
    lngDecimals: lngDec,
  });
  if (process.env.NODE_ENV !== "production") {
    if (latDec < 6 || lngDec < 6) {
      // eslint-disable-next-line no-console
      console.warn(`[coords-low-precision:${tag}] 소수 자릿수 부족`, {
        latStr,
        lngStr,
      });
    }
  }
}

/** 다양한 입력 형태에서 원본 숫자 lat/lng 추출 */
function normalizeLL(v: any): { lat: number; lng: number } {
  if (v && typeof v.getLat === "function" && typeof v.getLng === "function") {
    return { lat: v.getLat(), lng: v.getLng() };
  }
  return { lat: Number(v?.lat), lng: Number(v?.lng) };
}

/** 좌표 → 그룹핑 키(절대 payload에 역사용 금지) */
function toGroupingPosKey(m: any): string | undefined {
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
    return `${lat.toFixed(5)},${lng.toFixed(5)}`;
  }
  return undefined;
}

/** 느슨한 절삭 감지 */
function looksRounded56(n: number): boolean {
  if (!Number.isFinite(n)) return false;
  const m = String(n).match(/\.(\d{5,6})$/);
  return !!m;
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

  const sr = useScheduledReservations();
  const { refetch } = sr;
  const { toast } = useToast();
  const version = useReservationVersion((s) => s.version);
  const bump = useReservationVersion((s) => s.bump);

  const optimisticReservedIdsRef = useRef<Set<string>>(new Set());
  const optimisticReservedPosRef = useRef<Set<string>>(new Set());

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
    ? toGroupingPosKey(targetPin.position)
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

  if (!open || !mapInstance || !kakaoSDK || !menuAnchor) return null;

  type LatLngRO = Readonly<{ lat: number; lng: number }>;
  const anchorPos: LatLngRO = { lat: menuAnchor.lat, lng: menuAnchor.lng };
  assertNoTruncate("ContextMenuHost:anchorPos", anchorPos.lat, anchorPos.lng);

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
          title: (targetPin as any).title ?? "이름 없음",
          position: normalizeLL((targetPin as any).position) as LatLngRO,
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

  const propertyIdForView =
    menuTargetId && String(menuTargetId).startsWith("__visit__")
      ? "__draft__"
      : menuTargetId != null
      ? String(menuTargetId)
      : "__draft__";

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
      if ("visitId" in args) {
        const pinDraftId = Number(args.visitId);
        if (!Number.isFinite(pinDraftId))
          throw new Error("유효하지 않은 visitId");

        optimisticReservedIdsRef.current.add(String(args.visitId));
        const basePosForVisit = (
          targetPin?.position ? normalizeLL(targetPin.position) : anchorPos
        ) as LatLngRO;

        const posKeyForVisit = toGroupingPosKey(basePosForVisit);
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

      const { lat, lng, title, roadAddress, jibunAddress, dateISO } = args;

      if (looksRounded56(lat) || looksRounded56(lng)) {
        console.warn(
          "[ContextMenuHost] WARN: 좌표가 5/6자리 절삭 형태입니다. 상위 공급 경로 점검 필요.",
          { lat, lng }
        );
      }
      assertNoTruncate("ContextMenuHost:onReserve:createDraft", lat, lng);

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
        ? normalizeLL(targetPin.position)
        : { lat, lng };

      if (looksRounded56(samePos.lat) || looksRounded56(samePos.lng)) {
        console.warn(
          "[ContextMenuHost] WARN: targetPin.position 좌표가 절삭 형태입니다. 마커 생성 경로 점검.",
          samePos
        );
      }
      assertNoTruncate("ContextMenuHost:upsertDraft", samePos.lat, samePos.lng);

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

      const posKey = toGroupingPosKey(samePos);
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
      bump();
    }
  };

  return (
    <PinContextMenuContainer
      key={
        menuTargetId
          ? `bubble:${version}:${menuTargetId}`
          : `bubble:draft:${version}:${menuAnchor.lat},${menuAnchor.lng}`
      }
      kakao={kakaoSDK}
      map={mapInstance}
      position={new kakaoSDK.maps.LatLng(menuAnchor.lat, menuAnchor.lng)}
      roadAddress={menuRoadAddr ?? undefined}
      jibunAddress={menuJibunAddr ?? undefined}
      propertyId={propertyIdForView}
      propertyTitle={menuTitle ?? undefined}
      mergedMeta={mergedMeta}
      pin={pin as any}
      onClose={onCloseMenu ?? (() => {})}
      onView={(id) => {
        const sid = String(id);
        if (sid === "__draft__") {
          toast({
            title: "상세보기 불가",
            description: "선택 위치는 등록 후 상세보기를 사용할 수 있어요.",
          });
          onCloseMenu?.();
          return;
        }
        onViewFromMenu?.(sid);
        Promise.resolve().then(() => onCloseMenu?.());
      }}
      onCreate={async () => {
        // ✅ 더 이상 /pin-drafts/:id 조회 안 함
        const basePos = targetPin?.position
          ? normalizeLL(targetPin.position)
          : anchorPos;

        if (looksRounded56(basePos.lat) || looksRounded56(basePos.lng)) {
          console.warn(
            "[ContextMenuHost] WARN: onCreate 좌표가 절삭 형태. 공급 경로 점검.",
            basePos
          );
        }
        assertNoTruncate("ContextMenuHost:onCreate", basePos.lat, basePos.lng);
        onCreateFromMenu?.({ lat: basePos.lat, lng: basePos.lng });
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
          const basePos = targetPin?.position
            ? normalizeLL(targetPin.position)
            : anchorPos;

          const payload = {
            lat: basePos.lat,
            lng: basePos.lng,
            title: menuTitle ?? null,
            roadAddress: menuRoadAddr ?? null,
            jibunAddress: menuJibunAddr ?? null,
            dateISO: todayISO,
          } as const;

          if (looksRounded56(payload.lat) || looksRounded56(payload.lng)) {
            console.warn(
              "[ContextMenuHost] WARN: onReserve payload 좌표가 절삭 형태. 공급 경로 점검.",
              payload
            );
          }
          assertNoTruncate(
            "ContextMenuHost:onReserve:payload",
            payload.lat,
            payload.lng
          );

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
