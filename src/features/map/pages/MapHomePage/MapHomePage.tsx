"use client";

import { useCallback, useMemo } from "react";
import { useMapHomeState } from "../hooks/useMapHomeState";
import { MapHomeUI } from "../MapHome/MapHomeUI/MapHomeUI";

import { useSidebar } from "@/features/sidebar/SideBarProvider";
import FavGroupModal from "@/features/sidebar/components/FavGroupModal";
import type { ListItem } from "@/features/sidebar/types/sidebar";

import { useReverseGeocode } from "./hooks/useReverseGeocode";
import { useFavModalController } from "./hooks/useFavModalController";
import { useReserveFromMenu, eqId } from "./hooks/useReserveFromMenu";

import { createPinDraft } from "@/shared/api/pins";
import { buildAddressLine } from "../../shared/pinContextMenu/components/PinContextMenu/utils/geo";
import { useToast } from "@/hooks/use-toast";

const PIN_MENU_MAX_LEVEL = 5; // 250m 까지 메뉴 허용

export default function MapHomePage() {
  const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!KAKAO_MAP_KEY) {
    return (
      <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
        NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수가 없습니다. (Vercel 프로젝트에 추가
        후 <b>재배포</b> 필요)
      </div>
    );
  }

  const s = useMapHomeState();
  const { toast } = useToast();

  const {
    nestedFavorites,
    addFavoriteToGroup,
    createGroupAndAdd,
    ensureFavoriteGroup,
    reserveVisitPlan,
  } = useSidebar();

  const reverseGeocode = useReverseGeocode(s.kakaoSDK);

  const fav = useFavModalController({
    getCurrentItem: (): ListItem | null => {
      const id = s.menuTargetId;
      if (!id) return null;
      const todayISO = new Date().toISOString().slice(0, 10);
      const title =
        s.menuRoadAddr ||
        s.menuJibunAddr ||
        (s.items.find((p) => eqId(p.id, id))?.title ?? "이름 없음");
      return { id: String(id), title, dateISO: todayISO };
    },
    addFavoriteToGroup,
    createGroupAndAdd,
    ensureFavoriteGroup,
  });

  // ===== 콜백들 =====
  const onChangeQ = useCallback(
    (v: string) => {
      (s as any).onChangeQ?.(v) ?? (s as any).setQ?.(v);
    },
    [s]
  );

  const onChangeFilter = useCallback(
    (v: any) => {
      (s as any).onChangeFilter?.(v) ?? (s as any).setFilter?.(v);
    },
    [s]
  );

  const onSubmitSearch = useCallback(
    (v?: string) => {
      const text = v ?? "";
      (s as any).onSubmitSearch?.(text) ?? (s as any).performSearch?.(text);
    },
    [s]
  );

  const onChangePoiKinds = useCallback(
    (next: any) => {
      (s as any).onChangePoiKinds?.(next) ??
        (s as any).setPoiKinds?.(next) ??
        (s as any).updatePoiKinds?.(next);
    },
    [s]
  );

  const onCreateFromMenu = useCallback(
    (pos: { lat: number; lng: number }) => {
      // 1) 클릭한 위치를 draftPin으로 저장해서
      //    실제 클릭 좌표가 생성 모달로 넘어가게
      (s as any).setDraftPin?.(pos);

      // 2) 나머지 동작은 그대로
      (s as any).onCreateFromMenu?.() ?? (s as any).createFromMenu?.();
    },
    [s]
  );

  const onChangeHideLabelForId = useCallback(
    (id?: string | null) => {
      s.onChangeHideLabelForId?.(id ?? null);
    },
    [s]
  );

  // ✅ MapHomeUI → useMapHomeState onOpenMenu 어댑터 + 줌 레벨 가드
  const handleOpenMenu = useCallback(
    (p: {
      position: { lat: number; lng: number };
      propertyId?: string | number | null;
      propertyTitle?: string | null;
      pin?: { kind: string; isFav?: boolean };
    }) => {
      const level = s?.mapInstance?.getLevel?.();

      // 500m(레벨 6) 이상에서는 메뉴 막고 토스트만
      if (typeof level === "number" && level > PIN_MENU_MAX_LEVEL) {
        toast({
          title: "조금 더 확대해 주세요",
          description:
            "핀 메뉴는 지도 250m(5단계) 이하에서만 사용할 수 있어요.",
        });
        return;
      }

      const payloadForState = {
        ...p,
        // 내부 상태 쪽은 null 대신 undefined 쪽이 더 자연스러우면 변환
        propertyId: p.propertyId ?? undefined,
      };
      (s as any).onOpenMenu?.(payloadForState);
    },
    [s, toast]
  );

  // ===== payload → draftId 어댑터 =====
  const reserveVisitPlanFromPayload = useCallback(
    async (payload: {
      lat: number;
      lng: number;
      address?: string;
      roadAddress: string | null;
      jibunAddress: string | null;
      reservedDate?: string;
      dateISO?: string;
    }) => {
      const addressLine =
        (payload.address && payload.address.trim()) ||
        buildAddressLine(
          payload.lat,
          payload.lng,
          payload.roadAddress,
          payload.jibunAddress,
          null
        );

      const { id: draftId } = await createPinDraft({
        lat: payload.lat,
        lng: payload.lng,
        addressLine,
      });
      if (draftId == null)
        throw new Error("Draft 생성에 실패했습니다. (id 없음)");

      await reserveVisitPlan(String(draftId), {
        reservedDate: payload.reservedDate ?? payload.dateISO,
        dateISO: payload.dateISO,
      });

      try {
        (s as any).refetchPins?.({ draftState: "all" });
        (s as any).reloadPins?.();
        (s as any).onViewportChange?.(s.mapInstance);
      } catch {
        /* noop */
      }
    },
    [reserveVisitPlan, s]
  );

  const onReserveFromMenu = useReserveFromMenu({
    s,
    reverseGeocode,
    reserveVisitPlan: reserveVisitPlanFromPayload,
  });

  // ===== 메뉴 타이틀 메모 =====
  const menuTitle = useMemo(() => {
    if (!s.menuTargetId) return null;
    return s.items.find((p) => eqId(p.id, s.menuTargetId))?.title ?? null;
  }, [s.items, s.menuTargetId]);

  // ===== MapHomeUI에 내려줄 프롭 메모 =====
  const uiProps = useMemo(
    () => ({
      /* core */
      appKey: KAKAO_MAP_KEY,
      kakaoSDK: s.kakaoSDK,
      mapInstance: s.mapInstance,

      /* data */
      items: s.items,
      filtered: s.filtered,
      markers: s.markers,
      fitAllOnce: s.fitAllOnce,

      /* search & filter */
      q: s.q,
      filter: s.filter,
      onChangeQ,
      onChangeFilter,
      onSubmitSearch,

      /* toggles */
      useSidebar: s.useSidebar,
      setUseSidebar: s.setUseSidebar,
      useDistrict: s.useDistrict,

      /* POI */
      poiKinds: s.poiKinds,
      onChangePoiKinds,

      /* 즐겨찾기 */
      addFav: true,
      favById: fav.favById,
      onAddFav: fav.onAddFav,

      /* menu */
      menuOpen: s.menuOpen,
      menuAnchor: s.menuAnchor,
      menuTargetId: s.menuTargetId,
      menuRoadAddr: s.menuRoadAddr,
      menuJibunAddr: s.menuJibunAddr,
      menuTitle,
      onCloseMenu: s.closeMenu,
      // 상세보기는 MapHomeUI 내부에서 처리
      onCreateFromMenu,
      onPlanFromMenu: s.onPlanFromMenu,

      /* map callbacks */
      onMarkerClick: s.onMarkerClick,
      onMapReady: s.onMapReady,
      onViewportChange: s.onViewportChange,

      /* modals (MapHomeUI가 view를 직접 관리) */
      editOpen: s.editOpen,
      createOpen: s.createOpen,
      selectedId: s.selectedId,
      prefillAddress: s.prefillAddress,
      draftPin: s.draftPin,
      setDraftPin: s.setDraftPin,
      selectedPos: s.selectedPos,
      closeEdit: s.closeEdit,
      closeCreate: s.closeCreate,
      onSaveViewPatch: s.onSaveViewPatch,
      onEditFromView: s.onEditFromView,
      onDeleteFromView: s.onDeleteFromView,
      createHostHandlers: s.createHostHandlers,
      editHostHandlers: s.editHostHandlers,

      /* misc */
      hideLabelForId: s.hideLabelForId,
      onOpenMenu: handleOpenMenu, // ✅ 여기서 줌 레벨 가드
      onChangeHideLabelForId,
      onReserveFromMenu,
      createFromDraftId: s.createFromDraftId,
    }),
    [
      KAKAO_MAP_KEY,
      s,
      fav.favById,
      fav.onAddFav,
      onChangeQ,
      onChangeFilter,
      onSubmitSearch,
      onChangePoiKinds,
      onCreateFromMenu,
      onChangeHideLabelForId,
      onReserveFromMenu,
      handleOpenMenu,
      menuTitle,
    ]
  );

  return (
    <>
      <MapHomeUI {...uiProps} />
      <FavGroupModal
        open={fav.favModalOpen}
        groups={nestedFavorites}
        onSelectGroup={fav.handleSelectGroup}
        onCreateAndSelect={fav.handleCreateAndSelect}
        onClose={fav.closeFavModal}
      />
    </>
  );
}
