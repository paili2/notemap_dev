"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import { LatLng } from "@/lib/geo/types";
import { useMapHomeState } from "./hooks/useMapHomeState";
import { MapHomeUI } from "./components/MapHomeUI";

const FAV_LS_KEY = "map:favs"; // ⭐ 즐겨찾기 로컬스토리지 키

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

  const s = useMapHomeState({ appKey: KAKAO_MAP_KEY });

  // ✅ 즐겨찾기 상태 (id → boolean)
  const [favById, setFavById] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(FAV_LS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const normalized: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(parsed)) {
        normalized[k] = typeof v === "boolean" ? v : v === "true";
      }
      return normalized;
    } catch {
      return {};
    }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(FAV_LS_KEY, JSON.stringify(favById));
    } catch {}
  }, [favById]);

  // ✅ 변경될 때마다 저장
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(FAV_LS_KEY, JSON.stringify(favById));
    } catch {
      // noop
    }
  }, [favById]);

  // ✅ 즐겨찾기 토글 핸들러
  const onToggleFav = useCallback(
    (next: boolean, ctx?: { id?: string; pos?: LatLng }) => {
      const id = ctx?.id ?? s.menuTargetId;
      if (!id) return;
      setFavById((prev) => ({ ...prev, [id]: next }));
      // TODO: 서버 동기화 필요 시 여기서 API 호출
    },
    [s.menuTargetId]
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

  // 답사예정: 모달 열지 않고 핀만 추가
  const onPlanFromMenu = (pos: LatLng) => {
    s.addVisitPin(pos);
    s.closeMenu();
  };

  return (
    <MapHomeUI
      // 지도 관련
      appKey={KAKAO_MAP_KEY}
      kakaoSDK={s.kakaoSDK}
      mapInstance={s.mapInstance}
      // 데이터
      items={s.items}
      filtered={s.filtered}
      markers={s.markers}
      fitAllOnce={s.fitAllOnce}
      // 검색 & 필터
      q={s.q}
      filter={s.filter}
      onChangeQ={s.setQ}
      onChangeFilter={s.setFilter}
      onSubmitSearch={s.runSearch}
      useDistrict={s.useDistrict}
      useSidebar={s.useSidebar}
      setUseSidebar={s.setUseSidebar}
      // 메뉴/모달 상태
      menuOpen={s.menuOpen}
      menuAnchor={s.menuAnchor}
      menuTargetId={s.menuTargetId}
      menuRoadAddr={s.menuRoadAddr}
      menuJibunAddr={s.menuJibunAddr}
      menuTitle={menuTitle}
      // 핸들러 함수들
      onCloseMenu={s.closeMenu}
      onViewFromMenu={s.openViewFromMenu}
      onCreateFromMenu={s.openCreateFromMenu}
      onPlanFromMenu={onPlanFromMenu}
      onMarkerClick={s.handleMarkerClick}
      onMapReady={s.onMapReady}
      onViewportChange={s.sendViewportQuery}
      // 모달들
      viewOpen={s.viewOpen}
      editOpen={s.editOpen}
      createOpen={s.createOpen}
      selectedViewItem={selectedViewItem}
      selectedId={s.selectedId}
      prefillAddress={s.prefillAddress}
      // 드래프트 핀 관련
      draftPin={s.draftPin}
      setDraftPin={s.setDraftPin}
      // 기타
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
      // ⭐ 즐겨찾기 상태/토글 전달
      favById={favById}
      onToggleFav={onToggleFav}
    />
  );
}
