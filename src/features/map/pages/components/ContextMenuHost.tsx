"use client";

import { createSurveyReservation } from "@/shared/api/surveyReservations";
import { createPinDraft } from "@/shared/api/pins";
import { useToast } from "@/hooks/use-toast";
import { useScheduledReservations } from "@/features/survey-reservations/hooks/useScheduledReservations";
import type { MergedMarker } from "../hooks/useMergedMarkers";
import { useReservationVersion } from "@/features/survey-reservations/store/useReservationVersion";
import { useMemo, useRef, useEffect, useState } from "react";
import {
  hideLabelsAround,
  showLabelsAround,
} from "@/features/map/shared/overlays/labelRegistry";
import PinContextMenuContainer from "@/features/map/shared/pinContextMenu/components/PinContextMenu/PinContextMenuContainer";
import { CreateFromPinArgs } from "@/features/map/shared/pinContextMenu/components/PinContextMenu/types";
import { MapMarker } from "../../shared/types/map";

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
  onCreateFromMenu?: (args: CreateFromPinArgs) => void;
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
  onDeleteProperty?: (id: string | null) => void;
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
    onDeleteProperty,
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
  const anchorBase = useMemo(() => {
    if (menuAnchor) return { lat: menuAnchor.lat, lng: menuAnchor.lng };
    if (menuTargetId && targetPin?.position) {
      const p = normalizeLL((targetPin as any).position);
      return { lat: p.lat, lng: p.lng };
    }
    return null;
  }, [menuAnchor, menuTargetId, targetPin]);

  /** 2) 주소검색 보정: 앵커 후보 아래 ‘실제 등록핀’ 탐색 */
  const underlyingMarker = useMemo(() => {
    if (!anchorBase) return undefined;

    const isDraftLike = (id: any) =>
      typeof id === "string" &&
      (id.startsWith("__draft__") || id.startsWith("__visit__"));

    // 2-1) posKey(소수 5자리) 완전일치
    const key = toGroupingPosKeyFromPos(anchorBase);
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
      const dx = p.lat - anchorBase.lat;
      const dy = p.lng - anchorBase.lng;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = m;
      }
    }
    // 위경도 약식: 0.0002 ≈ 20m
    return bestD2 < 0.0002 * 0.0002 ? best : undefined;
  }, [visibleMarkers, anchorBase]);

  /** 3) effective target: 클릭된 핀 있으면 그것, 없으면 underlying 등록핀, 없으면 draft */
  const effectiveTarget = useMemo((): { id: string; marker?: MapMarker } => {
    const isDraftLike = (id: any) =>
      typeof id === "string" && id.startsWith("__");

    if (menuTargetId && targetPin && !isDraftLike(menuTargetId)) {
      return { id: String(menuTargetId), marker: targetPin as MapMarker };
    }

    if (underlyingMarker && !isDraftLike(underlyingMarker.id)) {
      return { id: String(underlyingMarker.id), marker: underlyingMarker };
    }

    if (menuTargetId && targetPin) {
      return { id: String(menuTargetId), marker: targetPin as MapMarker };
    }

    return { id: "__new__", marker: undefined };
  }, [menuTargetId, targetPin, underlyingMarker]);

  /**
   * 4) 최종 앵커:
   *    - 가능한 경우 항상 "실제 타겟 핀의 좌표"를 기준으로 사용
   *    - 아직 핀이 없고 검색 좌표만 있을 때는 anchorBase 사용
   * 이렇게 해야, 처음엔 임시핀 기준으로 열렸다가
   * 나중에 서버 핀이 들어와서 effectiveTarget 이 바뀌어도
   * 메뉴가 그 핀 위치로 따라가면서 핀/말풍선이 안 어긋남.
   */
  const anchorPos = useMemo(() => {
    if (effectiveTarget.marker?.position) {
      const p = normalizeLL((effectiveTarget.marker as any).position);
      return { lat: p.lat, lng: p.lng };
    }
    return anchorBase;
  }, [effectiveTarget.marker, anchorBase]);

  const [idleReady, setIdleReady] = useState(false);

  useEffect(() => {
    if (!open || !mapInstance || !kakaoSDK || !anchorPos) {
      setIdleReady(false);
      return;
    }

    // 🔥 ultra fast 모드: idle 안 기다리고, center가 anchor에 충분히 가까워지는 순간 바로 렌더
    let stopped = false;
    setIdleReady(false);

    // 위경도 차이 제곱합 기준 (0.0001 ≈ 대략 10m 근처)
    const TH = 0.0001;
    const TH2 = TH * TH;

    const checkCenter = () => {
      if (stopped) return;

      try {
        const center = mapInstance.getCenter?.();
        if (center) {
          const dx = center.getLat() - anchorPos.lat;
          const dy = center.getLng() - anchorPos.lng;
          const d2 = dx * dx + dy * dy;

          if (d2 <= TH2) {
            setIdleReady(true);
            stopped = true;
            return;
          }
        }
      } catch {
        // center 못 가져와도 계속 시도
      }

      // 아직 충분히 안 가까우면 다음 프레임에 다시 체크
      requestAnimationFrame(checkCenter);
    };

    // 안전장치: 애니메이션이 너무 길어도 120ms 안에는 강제로 띄우기
    const timeoutId = window.setTimeout(() => {
      if (!stopped) {
        setIdleReady(true);
        stopped = true;
      }
    }, 120);

    requestAnimationFrame(checkCenter);

    return () => {
      stopped = true;
      window.clearTimeout(timeoutId);
    };
  }, [open, mapInstance, kakaoSDK, anchorPos?.lat, anchorPos?.lng]);

  /** 5) 렌더/라벨숨김 조건을 anchorPos 기준으로: 검색 경로에서도 동작 */
  const shouldRender =
    !!open && !!mapInstance && !!kakaoSDK && !!anchorPos && idleReady;

  // === 디버그: 현재 상태 로그 ===
  useEffect(() => {
    if (!shouldRender || !anchorPos) return;
    const draftMarkerPos =
      effectiveTarget.marker &&
      (effectiveTarget.marker as any).kind === "question"
        ? normalizeLL((effectiveTarget.marker as any).position)
        : null;

    // eslint-disable-next-line no-console
    console.debug("[ContextMenuHost] anchorPos", {
      anchorBase,
      anchorPos,
      menuTargetId,
      effectiveId: effectiveTarget.id,
      targetPinPos: targetPin ? normalizeLL((targetPin as any).position) : null,
      underlyingId: underlyingMarker ? underlyingMarker.id : null,
      draftMarkerPos,
    });
    // eslint-disable-next-line no-console
    console.debug("[usePinsFromViewport] markers ▶", visibleMarkers);
  }, [
    shouldRender,
    anchorPos?.lat,
    anchorPos?.lng,
    anchorBase?.lat,
    anchorBase?.lng,
    menuTargetId,
    effectiveTarget.id,
    targetPin,
    underlyingMarker,
    visibleMarkers,
  ]);

  // ★ open 기준 라벨 마스크
  useLabelMaskOnMenuOpen({
    open: shouldRender,
    map: mapInstance,
    kakaoSDK,
    anchor: anchorPos,
    radius: 240,
  });

  /** 컨텍스트 메뉴가 붙을 좌표: 항상 anchorPos 그대로 사용 */
  const overlayLatLng = useMemo(() => {
    if (!anchorPos || !kakaoSDK?.maps) return null;
    return new kakaoSDK.maps.LatLng(anchorPos.lat, anchorPos.lng);
  }, [anchorPos?.lat, anchorPos?.lng, kakaoSDK]);

  if (!shouldRender || !anchorPos || !overlayLatLng) return null;

  type LatLngRO = Readonly<{ lat: number; lng: number }>;
  const anchorPosRO: LatLngRO = { lat: anchorPos.lat, lng: anchorPos.lng };

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
      kakao={kakaoSDK}
      map={mapInstance}
      position={overlayLatLng}
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
      onCreate={async (panelArgs?: any) => {
        if (!onCreateFromMenu) return;

        const basePos = effectiveTarget.marker?.position
          ? normalizeLL(effectiveTarget.marker.position)
          : anchorPosRO;

        assertNoTruncate("ContextMenuHost:onCreate", basePos.lat, basePos.lng);

        let fromPinDraftId: number | undefined;
        let createMode: CreateFromPinArgs["createMode"] = "NORMAL";

        if (
          typeof effectiveTarget.id === "string" &&
          effectiveTarget.id.startsWith("__visit__")
        ) {
          const raw = effectiveTarget.id.replace("__visit__", "");
          const n = Number(raw);
          if (!Number.isNaN(n)) {
            fromPinDraftId = n;
            createMode = "FULL_PROPERTY_FROM_RESERVED";
          }
        }

        const visitPlanOnly = !!panelArgs?.visitPlanOnly;

        console.debug("[ContextMenuHost:onCreate] panelArgs =", panelArgs, {
          basePos,
          fromPinDraftId,
          createMode,
          visitPlanOnly,
        });

        const args = {
          latFromPin: basePos.lat,
          lngFromPin: basePos.lng,
          fromPinDraftId,
          address:
            panelArgs?.address ??
            menuRoadAddr ??
            menuJibunAddr ??
            (pin as any)?.title ??
            menuTitle ??
            null,
          roadAddress: panelArgs?.roadAddress ?? menuRoadAddr ?? null,
          jibunAddress: panelArgs?.jibunAddress ?? menuJibunAddr ?? null,
          createMode,
          visitPlanOnly,
        };

        onCreateFromMenu(args as any);
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
      onDeleteProperty={onDeleteProperty}
    />
  );
}
