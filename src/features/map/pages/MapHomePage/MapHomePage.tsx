"use client";

import { useCallback, useMemo } from "react";
import { useMapHomeState } from "../hooks/useMapHomeState"; // 기존 훅 그대로 사용
import { MapHomeUI } from "../MapHome/MapHomeUI"; // 기존 컴포넌트 그대로 사용

// 사이드바 Provider
import { useSidebar } from "@/features/sidebar/SideBarProvider";
import FavGroupModal from "@/features/sidebar/components/FavGroupModal";
import type { ListItem } from "@/features/sidebar/types/sidebar";

import { useReverseGeocode } from "./hooks/useReverseGeocode";
import { useFavModalController } from "./hooks/useFavModalController";
import { useReserveFromMenu } from "./hooks/useReserveFromMenu";

// ✅ draft 생성 API (프로젝트 경로에 맞게 조정)
import { createPinDraft } from "@/shared/api/pins";

// ──────────────────────────────────────────────────────────────
// 유틸: id 동등 비교 (숫자/문자열 혼용 대비)
const eqId = (
  a: string | number | null | undefined,
  b: string | number | null | undefined
) => a != null && b != null && String(a) === String(b);
// ──────────────────────────────────────────────────────────────

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

  // 지도 페이지 상태 (기존)
  const s = useMapHomeState();

  // 사이드바 상태 & 액션 (기존)
  const {
    nestedFavorites,
    addFavoriteToGroup,
    createGroupAndAdd,
    ensureFavoriteGroup,
    reserveVisitPlan, // 기존: (draftId, opts?) 시그니처
  } = useSidebar();

  // 역지오코딩 훅
  const reverseGeocode = useReverseGeocode(s.kakaoSDK);

  // 즐겨찾기 모달 + 로컬 표시 상태 제어 훅
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

  // ──────────────────────────────────────────────────────────────
  // ✅ 옵션 A: payload → draftId 어댑터
  // useReserveFromMenu는 아래 payload 시그니처를 기대한다고 가정:
  // (payload: { lat, lng, address, roadAddress, jibunAddress, reservedDate?, dateISO? }) => Promise<any>
  const reserveVisitPlanFromPayload = useCallback(
    async (payload: {
      lat: number;
      lng: number;
      address: string;
      roadAddress: string | null;
      jibunAddress: string | null;
      reservedDate?: string;
      dateISO?: string;
    }) => {
      // 1) payload 기반으로 draft 생성
      // createPinDraft 응답 예: { id: number, ... } 혹은 { data: { id: ... } }
      const draft = await createPinDraft({
        lat: payload.lat,
        lng: payload.lng,
        title: payload.address,
        roadAddress: payload.roadAddress,
        jibunAddress: payload.jibunAddress,
      } as any); // 필요한 경우 DTO 타입으로 교체

      const draftId =
        (draft && (draft as any).id) ??
        (draft && (draft as any).data && (draft as any).data.id);

      if (draftId == null) {
        throw new Error("Draft 생성에 실패했습니다. (id 없음)");
      }

      // 2) 기존 Provider API 호출: (draftId, opts?)
      return reserveVisitPlan(draftId, {
        reservedDate: payload.reservedDate,
        dateISO: payload.dateISO,
      });
    },
    [reserveVisitPlan]
  );
  // ──────────────────────────────────────────────────────────────

  // 답사지예약 핸들러 훅 (컨텍스트 메뉴에서 사용) — 훅이 payload 시그니처를 기대
  const onReserveFromMenu = useReserveFromMenu({
    s,
    reverseGeocode,
    reserveVisitPlan: reserveVisitPlanFromPayload,
  });

  // 파생 상태
  const menuTitle = useMemo(() => {
    if (!s.menuTargetId) return null;
    return s.items.find((p) => eqId(p.id, s.menuTargetId))?.title ?? null;
  }, [s.items, s.menuTargetId]);

  // ──────────────────────────────────────────────────────────────
  // NOTE: 아래 MapHomeUI/FavGroupModal prop들은 실제 컴포넌트 시그니처에 맞게 조정하세요.
  //       (프로젝트에서 이미 쓰던 형태가 있으면 그대로 유지)
  // ──────────────────────────────────────────────────────────────
  return (
    <>
      <MapHomeUI
        /* core */
        appKey={KAKAO_MAP_KEY}
        kakaoSDK={s.kakaoSDK}
        mapInstance={s.mapInstance}
        /* data */
        items={s.items}
        filtered={s.filtered}
        markers={s.markers}
        fitAllOnce={s.fitAllOnce}
        /* search & filter */
        q={s.q}
        filter={s.filter}
        // 교체 (안전 어댑터)
        onChangeQ={(v) => (s as any).onChangeQ?.(v) ?? (s as any).setQ?.(v)}
        onChangeFilter={(v) =>
          (s as any).onChangeFilter?.(v) ?? (s as any).setFilter?.(v)
        }
        onSubmitSearch={(text) =>
          (s as any).onSubmitSearch?.(text) ?? (s as any).performSearch?.(text)
        }
        /* toggles */
        useSidebar={s.useSidebar}
        setUseSidebar={s.setUseSidebar}
        useDistrict={s.useDistrict}
        /* POI */
        poiKinds={s.poiKinds}
        onChangePoiKinds={(next) =>
          (s as any).onChangePoiKinds?.(next) ??
          (s as any).setPoiKinds?.(next) ??
          (s as any).updatePoiKinds?.(next)
        }
        /* 즐겨찾기 */
        addFav
        favById={fav.favById}
        onAddFav={fav.onAddFav}
        /* menu */
        menuOpen={s.menuOpen}
        menuAnchor={s.menuAnchor}
        menuTargetId={s.menuTargetId}
        menuRoadAddr={s.menuRoadAddr}
        menuJibunAddr={s.menuJibunAddr}
        menuTitle={menuTitle}
        onCloseMenu={s.closeMenu}
        onViewFromMenu={(id) =>
          (s as any).onViewFromMenu?.(id) ?? (s as any).viewFromMenu?.(id)
        }
        onCreateFromMenu={() =>
          (s as any).onCreateFromMenu?.() ?? (s as any).createFromMenu?.()
        }
        onPlanFromMenu={s.onPlanFromMenu}
        /* map callbacks */
        onMarkerClick={s.onMarkerClick}
        onMapReady={s.onMapReady}
        onViewportChange={s.onViewportChange}
        /* modals */
        viewOpen={s.viewOpen}
        editOpen={s.editOpen}
        createOpen={s.createOpen}
        selectedViewItem={s.selectedViewItem}
        selectedId={s.selectedId}
        prefillAddress={s.prefillAddress}
        draftPin={s.draftPin}
        setDraftPin={s.setDraftPin}
        selectedPos={s.selectedPos}
        closeView={s.closeView}
        closeEdit={s.closeEdit}
        closeCreate={s.closeCreate}
        onSaveViewPatch={s.onSaveViewPatch}
        onEditFromView={s.onEditFromView}
        onDeleteFromView={s.onDeleteFromView}
        createHostHandlers={s.createHostHandlers}
        editHostHandlers={s.editHostHandlers}
        /* misc */
        hideLabelForId={s.hideLabelForId}
        onOpenMenu={s.onOpenMenu}
        onChangeHideLabelForId={(id) => s.onChangeHideLabelForId?.(id ?? null)}
        /* ✅ 옵션 A 어댑터 연결 */
        onReserveFromMenu={onReserveFromMenu}
      />

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
