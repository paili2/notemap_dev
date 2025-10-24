"use client";

import PinContextMenuContainer from "../../../components/PinContextMenu/components/PinContextMenu/PinContextMenuContainer";
import type { MapMarker } from "../../../types/map";
import { createSurveyReservation } from "@/shared/api/surveyReservations";
import { createPinDraft } from "@/shared/api/pins";
import { useToast } from "@/hooks/use-toast";
import { useScheduledReservations } from "@/features/survey-reservations/hooks/useScheduledReservations";
import type { MergedMarker } from "../hooks/useMergedMarkers";

function getPosKey(m: any): string | undefined {
  // m이 {lat,lng} 형태도 지원
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
  siteReservations: any[];
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

  /** ✅ useMergedMarkers에서 올라온 판정용 메타 */
  mergedMeta?: MergedMarker[];

  /** ✅ 등록 직후 임시 draft 마커 낙관 주입 */
  upsertDraftMarker?: (m: {
    id: string | number;
    lat: number;
    lng: number;
    address?: string | null;
    source?: "draft";
    kind?: string;
  }) => void;

  /** ✅ 현재 뷰포트 마커 재패치 트리거 (선택) */
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

  const { refetch } = useScheduledReservations();
  const { toast } = useToast();

  if (!open || !mapInstance || !kakaoSDK || !menuAnchor) return null;

  // target pin 찾기
  const targetPin = menuTargetId
    ? visibleMarkers.find((m) => String(m.id) === String(menuTargetId))
    : undefined;

  console.groupCollapsed("[CM] menu open");
  console.log("[CM] menuTargetId =", menuTargetId);
  console.log("[CM] targetPin.position =", targetPin?.position);
  console.log("[CM] menuAnchor =", menuAnchor);
  console.log("[CM] menu title/addr =", {
    menuTitle,
    menuRoadAddr,
    menuJibunAddr,
  });
  console.groupEnd();

  // 예약 상태 판정(사이드바 기반)
  const reservedIdSet = new Set(
    (Array.isArray(siteReservations) ? siteReservations : []).map((it: any) =>
      String(it.id)
    )
  );
  const posKeyOfTarget = targetPin?.position
    ? getPosKey(targetPin.position)
    : undefined;
  const reservedPosSet = new Set(
    (Array.isArray(siteReservations) ? siteReservations : [])
      .map((it: any) => it?.posKey)
      .filter(Boolean)
  );
  const isVisitReservedPin =
    (!!menuTargetId && reservedIdSet.has(String(menuTargetId))) ||
    (!!posKeyOfTarget && reservedPosSet.has(posKeyOfTarget));

  const pin =
    menuTargetId && targetPin
      ? {
          id: String(targetPin.id),
          title: targetPin.title ?? "이름 없음",
          position: targetPin.position,
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
          position: menuAnchor,
          kind: "question",
          isFav: false,
        };

  // "__visit__{id}" 형태의 임시핀만 '답사예정'으로 간주
  const isPlanPin =
    !isVisitReservedPin &&
    pin.kind === "question" &&
    String(pin.id) !== "__draft__";

  // 기본 예약 생성 처리 (부모가 onReserveFromMenu를 안 주면 사용)
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
      console.groupCollapsed("[reserveDefault] start");
      console.log("[reserveDefault] args =", args);
      console.groupEnd();
      // 1) visitId가 오면 그걸 draftId로 간주
      if ("visitId" in args) {
        const pinDraftId = Number(args.visitId);
        if (!Number.isFinite(pinDraftId))
          throw new Error("유효하지 않은 visitId");
        await createSurveyReservation({
          pinDraftId,
          reservedDate: args.dateISO,
        });
        toast({ title: "예약 등록 완료", description: args.dateISO });
        await refetch();
        return;
      }

      // 2) 좌표 기반 예약: 임시핀 없으면 생성 후 예약
      const { lat, lng, title, roadAddress, jibunAddress, dateISO } = args;

      const draft = await createPinDraft({
        lat,
        lng,
        addressLine: roadAddress ?? jibunAddress ?? title ?? "선택 위치",
      });
      console.log("[reserveDefault] draft response =", draft);
      const pinDraftId =
        typeof draft === "object" && draft && "id" in draft
          ? Number((draft as any).id)
          : Number(draft);

      if (!Number.isFinite(pinDraftId)) throw new Error("임시핀 생성 실패");

      // ✅ 등록 직후 화면에 즉시 '답사예정'만 보이도록 낙관 주입
      const samePos = targetPin?.position
        ? { lat: targetPin.position.lat, lng: targetPin.position.lng }
        : { lat, lng };

      console.log("[reserveDefault] upsertDraftMarker =", {
        id: `__visit__${pinDraftId}`,
        ...samePos,
        address: roadAddress ?? jibunAddress ?? title ?? null,
      });

      upsertDraftMarker?.({
        id: `__visit__${pinDraftId}`,
        lat: samePos.lat,
        lng: samePos.lng,
        address: roadAddress ?? jibunAddress ?? title ?? null,
        source: "draft",
        kind: "question",
      });

      // ✅ 같은 id의 기존 주소라벨은 즉시 숨김 (한 프레임이라도 겹치지 않게)
      if (menuTargetId) {
        console.log(
          "[reserveDefault] hide original address label for id",
          String(menuTargetId)
        );
        onChangeHideLabelForId?.(String(menuTargetId));
      }
      console.log("[reserveDefault] createSurveyReservation payload =", {
        pinDraftId,
        reservedDate: dateISO,
      });
      await createSurveyReservation({ pinDraftId, reservedDate: dateISO });
      console.log("[reserveDefault] createSurveyReservation done");
      toast({ title: "예약 등록 완료", description: dateISO });
      await refetch();

      // (선택) 뷰포트 재패치
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
    }
  };

  return (
    <PinContextMenuContainer
      key={
        menuTargetId
          ? `bubble-${menuTargetId}`
          : `bubble-draft-${menuAnchor.lat},${menuAnchor.lng}`
      }
      kakao={kakaoSDK}
      map={mapInstance}
      position={new kakaoSDK.maps.LatLng(menuAnchor.lat, menuAnchor.lng)}
      roadAddress={menuRoadAddr ?? undefined}
      jibunAddress={menuJibunAddr ?? undefined}
      propertyId={menuTargetId != null ? String(menuTargetId) : "__draft__"}
      propertyTitle={menuTitle ?? undefined}
      /** ✅ 판정용 메타 전달 */
      mergedMeta={mergedMeta}
      pin={pin}
      onClose={onCloseMenu ?? (() => {})}
      onView={onViewFromMenu ?? (() => {})}
      onCreate={() => {
        onCreateFromMenu?.({ lat: menuAnchor.lat, lng: menuAnchor.lng });
      }}
      onPlan={() => {
        onPlanFromMenu?.({ lat: menuAnchor.lat, lng: menuAnchor.lng });
        onCloseMenu?.();
      }}
      onReserve={async () => {
        const todayISO = new Date().toISOString().slice(0, 10);
        console.groupCollapsed("[CM] onReserve click");
        console.log("[CM] targetPin.position =", targetPin?.position);
        console.log("[CM] menuAnchor =", menuAnchor);
        console.groupEnd();
        if (menuTargetId && String(menuTargetId).startsWith("__visit__")) {
          const visitId = String(menuTargetId).replace("__visit__", "");
          if (onReserveFromMenu) {
            await onReserveFromMenu({ visitId, dateISO: todayISO });
          } else {
            await reserveDefault({ visitId, dateISO: todayISO });
          }
        } else {
          const basePos = targetPin?.position ?? menuAnchor;
          const payload = {
            lat: basePos.lat,
            lng: basePos.lng,
            title: menuTitle ?? null,
            roadAddress: menuRoadAddr ?? null,
            jibunAddress: menuJibunAddr ?? null,
            dateISO: todayISO,
          } as const;
          console.log(
            "[CM] onReserve -> payload to reserveDefault/onReserveFromMenu =",
            payload
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
      /** ✅ 등록 직후 임시 마커 주입 & 뷰포트 재패치 */
      upsertDraftMarker={upsertDraftMarker}
      refreshViewportPins={refreshViewportPins}
    />
  );
}
