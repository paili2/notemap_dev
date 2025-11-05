"use client";

import PinContextMenuContainer from "../../../components/PinContextMenu/components/PinContextMenu/PinContextMenuContainer";
import type { MapMarker } from "../../../types/map";
import { createSurveyReservation } from "@/shared/api/surveyReservations";
import { createPinDraft } from "@/shared/api/pins";
import { useToast } from "@/hooks/use-toast";
import { useScheduledReservations } from "@/features/survey-reservations/hooks/useScheduledReservations";
import type { MergedMarker } from "../hooks/useMergedMarkers";
import { useReservationVersion } from "@/features/survey-reservations/store/useReservationVersion";
import { useMemo, useRef, useEffect } from "react";
import {
  hideLabelsAround,
  showLabelsAround,
} from "@/features/map/lib/labelRegistry";

/* ───────── 유틸 ───────── */
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

function normalizeLL(v: any): { lat: number; lng: number } {
  if (v && typeof v.getLat === "function" && typeof v.getLng === "function") {
    return { lat: v.getLat(), lng: v.getLng() };
  }
  return { lat: Number(v?.lat), lng: Number(v?.lng) };
}

function toGroupingPosKeyFromPos(pos?: { lat: number; lng: number } | null) {
  if (!pos) return undefined;
  const { lat, lng } = pos;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
}

/* ───────── 핵심: open 기준 라벨 마스크 훅 ───────── */
function useLabelMaskOnMenuOpen(opts: {
  open: boolean;
  map: any;
  kakaoSDK: any;
  anchor: { lat: number; lng: number } | null;
  radius?: number;
}) {
  const { open, map, kakaoSDK, anchor, radius = 240 } = opts;

  useEffect(() => {
    if (!open || !map || !anchor) return;

    const { lat, lng } = anchor;

    const runHide = () => {
      try {
        hideLabelsAround(map, lat, lng, radius);
        requestAnimationFrame(() => hideLabelsAround(map, lat, lng, radius));
        setTimeout(() => hideLabelsAround(map, lat, lng, radius), 0);
      } catch (e) {
        console.warn("[LabelMask] hideLabelsAround failed:", e);
      }
    };

    // 즉시 1회
    runHide();

    // idle 직후 1회
    let idleKey: any = null;
    try {
      const ev =
        (globalThis as any)?.kakao?.maps?.event ?? kakaoSDK?.maps?.event;
      if (ev && typeof ev.addListener === "function") {
        idleKey = ev.addListener(map, "idle", () => {
          try {
            ev.removeListener(idleKey);
          } catch {}
          runHide();
        });
      } else {
        setTimeout(runHide, 150);
      }
    } catch {
      setTimeout(runHide, 150);
    }

    // 짧은 재시도 (라벨 지연 렌더 대비)
    let tries = 0;
    const maxTries = 8;
    const t = setInterval(() => {
      tries += 1;
      runHide();
      if (tries >= maxTries) clearInterval(t);
    }, 150);

    // 닫힐 때 복원
    return () => {
      try {
        clearInterval(t);
      } catch {}
      try {
        const ev =
          (globalThis as any)?.kakao?.maps?.event ?? kakaoSDK?.maps?.event;
        if (ev && typeof ev.removeListener === "function" && idleKey)
          ev.removeListener(idleKey);
      } catch {}
      try {
        showLabelsAround(map, lat, lng, radius + 40);
      } catch (e) {
        console.warn("[LabelMask] showLabelsAround failed:", e);
      }
    };
  }, [open, map, kakaoSDK, anchor?.lat, anchor?.lng, radius]);
}

/* ───────── 컴포넌트 ───────── */
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

  // 예약 목록 취합
  const reservations: any[] = useMemo(() => {
    const cands = [
      (sr as any)?.items,
      (sr as any)?.list,
      (sr as any)?.data,
      (sr as any)?.reservations,
      Array.isArray(sr) ? (sr as any) : undefined,
    ];
    const picked = cands.find((x) => Array.isArray(x));
    return Array.isArray(picked)
      ? picked
      : Array.isArray(siteReservations)
      ? siteReservations
      : [];
  }, [sr, siteReservations, version]);

  const reservedIdSet = new Set(reservations.map((it: any) => String(it.id)));
  const reservedPosSet = new Set(
    reservations.map((it: any) => it?.posKey).filter(Boolean)
  );

  /** 1) 앵커 후보: menuAnchor 우선, 없으면 클릭된 핀 좌표 */
  const anchorCandidate = useMemo(() => {
    if (menuAnchor) return { lat: menuAnchor.lat, lng: menuAnchor.lng };
    if (menuTargetId && targetPin?.position) {
      const p = normalizeLL((targetPin as any).position);
      return { lat: p.lat, lng: p.lng };
    }
    return null;
  }, [menuAnchor, menuTargetId, targetPin]);

  /** 2) 주소검색 보정: 앵커 후보 아래 ‘실제 등록핀’ 탐색 (draft/visit 제외 + 거리 임계값) */
  const underlyingMarker = useMemo(() => {
    if (!anchorCandidate) return undefined;

    const isDraftLike = (id: any) =>
      typeof id === "string" &&
      (id.startsWith("__draft__") || id.startsWith("__visit__"));

    // 2-1) posKey(소수 5자리) 완전일치
    const key = toGroupingPosKeyFromPos(anchorCandidate);
    let cand = visibleMarkers.find((m) => {
      if (isDraftLike(m.id)) return false;
      const p = normalizeLL((m as any).position);
      return toGroupingPosKeyFromPos(p) === key;
    });
    if (cand) return cand;

    // 2-2) 근접(위경도 유클리드) 최솟값이 임계 미만(대략 20m)인 실제 등록핀
    let best: MapMarker | undefined;
    let bestD2 = Number.POSITIVE_INFINITY;
    for (const m of visibleMarkers) {
      if (isDraftLike(m.id)) continue;
      const p = normalizeLL((m as any).position);
      const dx = p.lat - anchorCandidate.lat;
      const dy = p.lng - anchorCandidate.lng;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = m;
      }
    }
    // 위경도 약식: 0.0002 ≈ 20m
    return bestD2 < 0.0002 * 0.0002 ? best : undefined;
  }, [visibleMarkers, anchorCandidate]);

  /** 3) effective target: 클릭된 핀이 있으면 그것, 없으면 underlying 등록핀, 없으면 draft */
  const effectiveTarget = useMemo((): { id: string; marker?: MapMarker } => {
    if (menuTargetId && targetPin) {
      return { id: String(menuTargetId), marker: targetPin as MapMarker };
    }
    if (underlyingMarker && !String(underlyingMarker.id).startsWith("__")) {
      return { id: String(underlyingMarker.id), marker: underlyingMarker };
    }
    return { id: "__draft__", marker: undefined };
  }, [menuTargetId, targetPin, underlyingMarker]);

  /** 4) 앵커 최종값: menuAnchor 또는 클릭핀 좌표 */
  const anchorPos = anchorCandidate;

  /** 5) 렌더/라벨숨김 조건을 anchorPos 기준으로: 검색 경로에서도 동작 */
  const shouldRender = !!open && !!mapInstance && !!kakaoSDK && !!anchorPos;

  // ★ open 기준 라벨 마스크
  useLabelMaskOnMenuOpen({
    open: shouldRender,
    map: mapInstance,
    kakaoSDK,
    anchor: anchorPos,
    radius: 240,
  });

  // ======== 렌더 분기 ========
  if (!shouldRender) return null;

  type LatLngRO = Readonly<{ lat: number; lng: number }>;
  const anchorPosRO: LatLngRO = { lat: anchorPos!.lat, lng: anchorPos!.lng };
  assertNoTruncate(
    "ContextMenuHost:anchorPos",
    anchorPosRO.lat,
    anchorPosRO.lng
  );

  /** 핀 모델: effectiveTarget 기준 */
  const pin = effectiveTarget.marker
    ? {
        id: String(effectiveTarget.marker.id),
        title: (effectiveTarget.marker as any).title ?? "이름 없음",
        position: normalizeLL(
          (effectiveTarget.marker as any).position
        ) as LatLngRO,
        kind: (effectiveTarget.marker as any)?.kind ?? "1room",
        isFav: Boolean(
          Object.prototype.hasOwnProperty.call(favById, effectiveTarget.id)
            ? (favById as any)[effectiveTarget.id]
            : (effectiveTarget.marker as any)?.isFav
        ),
      }
    : {
        id: "__draft__",
        title: "선택 위치",
        position: anchorPosRO,
        kind: "question",
        isFav: false,
      };

  /** 예약 여부도 effectiveTarget 기준 */
  const posKeyOfEffective = effectiveTarget.marker?.position
    ? toGroupingPosKeyFromPos(
        normalizeLL((effectiveTarget.marker as any).position)
      )
    : undefined;

  const isVisitReservedPin =
    (effectiveTarget.id !== "__draft__" &&
      (reservedIdSet.has(String(effectiveTarget.id)) ||
        optimisticReservedIdsRef.current.has(String(effectiveTarget.id)))) ||
    (!!posKeyOfEffective &&
      (reservedPosSet.has(posKeyOfEffective) ||
        optimisticReservedPosRef.current.has(posKeyOfEffective)));

  /** 상세보기용 id */
  const propertyIdForView =
    effectiveTarget.id && String(effectiveTarget.id).startsWith("__visit__")
      ? "__draft__"
      : effectiveTarget.id ?? "__draft__";

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
          effectiveTarget.marker?.position
            ? normalizeLL(effectiveTarget.marker.position)
            : anchorPosRO
        ) as LatLngRO;

        const posKeyForVisit = toGroupingPosKeyFromPos(basePosForVisit);
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

      const samePos = effectiveTarget.marker?.position
        ? normalizeLL(effectiveTarget.marker.position)
        : { lat, lng };

      props.upsertDraftMarker?.({
        id: `__visit__${pinDraftId}`,
        lat: samePos.lat,
        lng: samePos.lng,
        address: roadAddress ?? jibunAddress ?? title ?? null,
        source: "draft",
        kind: "question",
      });

      const posKey = toGroupingPosKeyFromPos(samePos);
      if (posKey) optimisticReservedPosRef.current.add(posKey);

      await createSurveyReservation({ pinDraftId, reservedDate: dateISO });
      toast({ title: "예약 등록 완료", description: dateISO });
      await refetch();

      try {
        const b = mapInstance?.getBounds?.();
        if (b) {
          await props.refreshViewportPins?.({
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
      } catch {}
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
        effectiveTarget.id !== "__draft__"
          ? `bubble:${version}:${effectiveTarget.id}`
          : `bubble:draft:${version}:${anchorPosRO.lat},${anchorPosRO.lng}`
      }
      kakao={kakaoSDK}
      map={mapInstance}
      position={new kakaoSDK.maps.LatLng(anchorPosRO.lat, anchorPosRO.lng)}
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
        const basePos = effectiveTarget.marker?.position
          ? normalizeLL(effectiveTarget.marker.position)
          : anchorPosRO;
        assertNoTruncate("ContextMenuHost:onCreate", basePos.lat, basePos.lng);
        onCreateFromMenu?.({ lat: basePos.lat, lng: basePos.lng });
      }}
      onPlan={() => {
        onPlanFromMenu?.({ lat: anchorPosRO.lat, lng: anchorPosRO.lng });
        bump();
        onCloseMenu?.();
      }}
      onReserve={async () => {
        const todayISO = new Date().toISOString().slice(0, 10);
        if (String(effectiveTarget.id).startsWith("__visit__")) {
          const visitId = String(effectiveTarget.id).replace("__visit__", "");
          if (onReserveFromMenu)
            await onReserveFromMenu({ visitId, dateISO: todayISO });
          else await reserveDefault({ visitId, dateISO: todayISO });
        } else {
          const basePos = effectiveTarget.marker?.position
            ? normalizeLL(effectiveTarget.marker.position)
            : anchorPosRO;
          const payload = {
            lat: basePos.lat,
            lng: basePos.lng,
            title: menuTitle ?? null,
            roadAddress: menuRoadAddr ?? null,
            jibunAddress: menuJibunAddr ?? null,
            dateISO: todayISO,
          } as const;
          if (onReserveFromMenu) await onReserveFromMenu(payload);
          else await reserveDefault(payload);
        }
        onCloseMenu?.();
      }}
      onAddFav={onAddFav ?? (() => {})}
      zIndex={10000}
      isVisitReservedPin={isVisitReservedPin}
      isPlanPin={
        !isVisitReservedPin &&
        (pin as any).kind === "question" &&
        String((pin as any).id) !== "__draft__"
      }
      upsertDraftMarker={upsertDraftMarker}
      refreshViewportPins={refreshViewportPins}
    />
  );
}
