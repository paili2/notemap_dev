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
import { api } from "@/shared/api/api";
import { assertNoTruncate } from "@/shared/debug/assertCoords";

/** 다양한 입력 형태에서 원본 숫자 lat/lng 추출 */
function normalizeLL(v: any): { lat: number; lng: number } {
  if (v && typeof v.getLat === "function" && typeof v.getLng === "function") {
    return { lat: v.getLat(), lng: v.getLng() };
  }
  return { lat: Number(v?.lat), lng: Number(v?.lng) };
}

/**
 * 좌표 → 그룹핑/매칭 전용 키 (소수 5자리 ≈ 1.1m)
 * ⚠️ 이 키를 split/Number로 역파싱해 payload 좌표로 쓰지 말 것!
 */
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

/** 디버깅용: 5/6자리 절삭 모양 감지(느슨) */
function looksRounded56(n: number): boolean {
  if (!Number.isFinite(n)) return false;
  const m = String(n).match(/\.(\d{5,6})$/);
  return !!m;
}

/** 예약→등록 승격 시, 드래프트의 원본 좌표 재조회 */
async function fetchDraftLatLng(id: number) {
  const { data } = await api.get(`/pin-drafts/${id}`, {
    withCredentials: true,
    headers: { "x-no-retry": "1" },
  });
  const lat = Number(data?.data?.lat);
  const lng = Number(data?.data?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("임시핀 좌표 조회 실패");
  }
  return { lat, lng };
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

  // ── Hooks ────────────────────────────────────────────────────────────
  const sr = useScheduledReservations();
  const { refetch } = sr;
  const { toast } = useToast();
  const version = useReservationVersion((s) => s.version);
  const bump = useReservationVersion((s) => s.bump);

  const optimisticReservedIdsRef = useRef<Set<string>>(new Set());
  const optimisticReservedPosRef = useRef<Set<string>>(new Set());

  // 파생 계산
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

  // ── 가드 ──────────────────────────────────────────────────────────────
  if (!open || !mapInstance || !kakaoSDK || !menuAnchor) {
    return null;
  }

  // ── 좌표: 원본 숫자 그대로 사용 ──────────────────────────────────────
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

  // ✅ 상세보기 id: __visit__* 는 상세보기 불가 → __draft__로 넘겨 버튼 비활성 유도
  const propertyIdForView =
    menuTargetId && String(menuTargetId).startsWith("__visit__")
      ? "__draft__"
      : menuTargetId != null
      ? String(menuTargetId)
      : "__draft__";

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
      // 1) 기존 임시핀 id 기반
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

      // 2) 좌표 기반(새 임시핀 생성 후 예약)
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
      position={new kakaoSDK.maps.LatLng(menuAnchor.lat, menuAnchor.lng)} // ✅ 원본 좌표
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
        // 1) 먼저 상세보기 state 올리고
        onViewFromMenu?.(sid);
        // 2) 메뉴 닫기는 다음 틱(마이크로태스크/프레임)으로 미룸
        //    - React 배치로 뷰모달 열림이 롤백되는 현상 방지
        Promise.resolve().then(() => onCloseMenu?.());
        // or: setTimeout(() => onCloseMenu?.(), 0)
        // or: requestAnimationFrame(() => onCloseMenu?.())
      }}
      onCreate={async () => {
        // 신규등록: 앵커 원본 / 예약→등록: 드래프트 원본 재조회
        if (menuTargetId && String(menuTargetId).startsWith("__visit__")) {
          const draftId = Number(String(menuTargetId).replace("__visit__", ""));
          try {
            const { lat, lng } = await fetchDraftLatLng(draftId);
            if (looksRounded56(lat) || looksRounded56(lng)) {
              console.warn(
                "[ContextMenuHost] WARN: fetchDraftLatLng() 결과가 절삭 형태.",
                { lat, lng }
              );
            }
            assertNoTruncate("ContextMenuHost:onCreate:visit", lat, lng);
            onCreateFromMenu?.({ lat, lng });
          } catch {
            assertNoTruncate(
              "ContextMenuHost:onCreate:fallback",
              menuAnchor.lat,
              menuAnchor.lng
            );
            onCreateFromMenu?.({ lat: menuAnchor.lat, lng: menuAnchor.lng });
          }
        } else {
          if (
            looksRounded56(menuAnchor.lat) ||
            looksRounded56(menuAnchor.lng)
          ) {
            console.warn(
              "[ContextMenuHost] WARN: menuAnchor 좌표가 절삭 형태. 상위 경로 점검.",
              menuAnchor
            );
          }
          assertNoTruncate(
            "ContextMenuHost:onCreate:anchor",
            menuAnchor.lat,
            menuAnchor.lng
          );
          onCreateFromMenu?.({ lat: menuAnchor.lat, lng: menuAnchor.lng });
        }
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
