"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import { LatLng } from "@/lib/geo/types";
import { useMapHomeState } from "./hooks/useMapHomeState";
import { MapHomeUI } from "./components/MapHomeUI";

// ⭐ 사이드바 Provider 상태
import { useSidebar } from "@/features/sidebar/SideBarProvider";
import FavGroupModal from "@/features/sidebar/components/FavGroupModal";
import type { ListItem } from "@/features/sidebar/types/sidebar"; // ← 스냅샷 타입

const MAP_FAVS_LS_KEY = "map:favs";

export default function MapHomePage() {
  const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!KAKAO_MAP_KEY) {
    return (
      <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
        NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수가 설정되지 않았습니다. (Vercel
        프로젝트 환경변수에 추가 후 재배포 필요)
      </div>
    );
  }

  const s = useMapHomeState();

  // ✅ 사이드바 Provider 상태
  const {
    nestedFavorites,
    addFavoriteToGroup,
    createGroupAndAdd,
    ensureFavoriteGroup,
  } = useSidebar();

  const [favModalOpen, setFavModalOpen] = useState(false);

  // ✅ “현재 핀” 스냅샷 (모달 열릴 때 고정)
  const [favCandidate, setFavCandidate] = useState<ListItem | null>(null);

  // (선택) 로컬 마킹 상태 (id → boolean)
  const [favById, setFavById] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(MAP_FAVS_LS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const normalized: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(parsed)) {
        normalized[k] = typeof v === "boolean" ? v : (v as any) === "true";
      }
      return normalized;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(MAP_FAVS_LS_KEY, JSON.stringify(favById));
    } catch {}
  }, [favById]);

  // 현재 선택된 핀을 Sidebar 아이템 형태로 변환
  const makeCurrentItem = useCallback((): ListItem | null => {
    const id = s.menuTargetId;
    if (!id) return null;
    const title =
      s.menuRoadAddr ||
      s.menuJibunAddr ||
      (s.items.find((p) => p.id === id)?.title ?? "이름 없음");
    return { id: String(id), title };
  }, [s.menuTargetId, s.menuRoadAddr, s.menuJibunAddr, s.items]);

  // ✅ 즐겨찾기 추가 버튼 → 모달 오픈
  const onAddFav = useCallback(() => {
    const snap = makeCurrentItem();
    setFavCandidate(snap);
    setFavModalOpen(true);
  }, [makeCurrentItem]);

  // 기존 그룹 선택 시 → 추가 + 닫힘
  const handleSelectGroup = useCallback(
    (groupId: string) => {
      const item = favCandidate;
      if (!item) {
        alert("추가할 대상이 없습니다. 지도를 다시 선택해 주세요.");
        return;
      }
      addFavoriteToGroup(groupId, item);
      setFavById((prev) => ({ ...prev, [item.id]: true }));
      setFavModalOpen(false);
      setFavCandidate(null);
    },
    [addFavoriteToGroup, favCandidate]
  );

  // 새 그룹 생성 + 자동 추가 + 닫힘
  const handleCreateAndSelect = useCallback(
    (groupId: string) => {
      ensureFavoriteGroup(groupId);

      const item = favCandidate;
      if (item) {
        createGroupAndAdd(groupId, item);
        setFavById((prev) => ({ ...prev, [item.id]: true }));
      }

      setFavModalOpen(false);
      setFavCandidate(null);
    },
    [ensureFavoriteGroup, createGroupAndAdd, favCandidate]
  );

  const menuTitle = useMemo(() => {
    if (!s.menuTargetId) return null;
    return s.items.find((p) => p.id === s.menuTargetId)?.title ?? null;
  }, [s.items, s.menuTargetId]);

  const selectedViewItem = useMemo(() => {
    if (!s.selected) return null;
    const extra = ((s.selected as any).view ?? {}) as Record<string, unknown>;
    const definedExtra = Object.fromEntries(
      Object.entries(extra).filter(([, v]) => v !== undefined)
    );
    return {
      ...s.toViewDetails(s.selected),
      ...definedExtra,
    } as PropertyViewDetails;
  }, [s.selected, s.toViewDetails]);

  const isBubbleOpen = s.menuOpen || s.viewOpen || s.editOpen || s.createOpen;
  const hideId = isBubbleOpen
    ? s.menuTargetId ?? (s.draftPin ? "__draft__" : null)
    : null;

  const onPlanFromMenu = (pos: LatLng) => {
    s.addVisitPin(pos);
    s.closeMenu();
  };

  return (
    <>
      <MapHomeUI
        appKey={KAKAO_MAP_KEY}
        kakaoSDK={s.kakaoSDK}
        mapInstance={s.mapInstance}
        items={s.items}
        filtered={s.filtered}
        markers={s.markers}
        fitAllOnce={s.fitAllOnce}
        q={s.q}
        filter={s.filter}
        onChangeQ={s.setQ}
        onChangeFilter={s.setFilter}
        onSubmitSearch={(kw) => s.runSearch(kw)}
        useDistrict={s.useDistrict}
        useSidebar={s.useSidebar}
        setUseSidebar={s.setUseSidebar}
        poiKinds={s.poiKinds}
        onChangePoiKinds={(next) => {
          s.setPoiKinds(next);
          if (s.lastViewport) {
            s.sendViewportQuery(s.lastViewport, { force: true });
          } else {
            s.runSearch();
            if (s.kakaoSDK && s.mapInstance) {
              s.kakaoSDK.maps.event.trigger(s.mapInstance, "idle");
              requestAnimationFrame(() =>
                s.kakaoSDK.maps.event.trigger(s.mapInstance, "idle")
              );
            }
          }
        }}
        menuOpen={s.menuOpen}
        menuAnchor={s.menuAnchor}
        menuTargetId={s.menuTargetId}
        menuRoadAddr={s.menuRoadAddr}
        menuJibunAddr={s.menuJibunAddr}
        menuTitle={menuTitle}
        onCloseMenu={s.closeMenu}
        onViewFromMenu={s.openViewFromMenu}
        onCreateFromMenu={s.openCreateFromMenu}
        onPlanFromMenu={onPlanFromMenu}
        onMarkerClick={s.handleMarkerClick}
        onMapReady={s.onMapReady}
        onViewportChange={s.sendViewportQuery}
        addFav={s.addFav}
        viewOpen={s.viewOpen}
        editOpen={s.editOpen}
        createOpen={s.createOpen}
        selectedViewItem={selectedViewItem}
        selectedId={s.selectedId}
        prefillAddress={s.prefillAddress}
        draftPin={s.draftPin}
        setDraftPin={s.setDraftPin}
        selectedPos={s.selected?.position ?? null}
        closeView={() => s.setViewOpen(false)}
        closeEdit={() => s.setEditOpen(false)}
        closeCreate={s.closeCreate}
        onSaveViewPatch={s.onSaveViewPatch}
        onEditFromView={() => s.setEditOpen(true)}
        onDeleteFromView={s.onDeleteFromView}
        createHostHandlers={s.createHostHandlers}
        editHostHandlers={s.editHostHandlers}
        hideLabelForId={hideId}
        onOpenMenu={({ position, propertyId }) => {
          s.openMenuAt(position, propertyId);
        }}
        favById={favById}
        onAddFav={onAddFav}
      />

      {/* 그룹 선택/생성 모달 */}
      <FavGroupModal
        open={favModalOpen}
        onClose={() => {
          setFavModalOpen(false);
          setFavCandidate(null);
        }}
        groups={nestedFavorites}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={handleCreateAndSelect}
      />
    </>
  );
}
