"use client";

import { useMemo } from "react";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import { useMapHomeState } from "./hooks/useMapHomeState";
import { MapHomeUI } from "./components/MapHomeUI";

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

  return (
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
      onSubmitSearch={s.runSearch}
      useDistrict={s.useDistrict}
      menuOpen={s.menuOpen}
      menuAnchor={s.menuAnchor}
      menuTargetId={s.menuTargetId}
      menuRoadAddr={s.menuRoadAddr}
      menuJibunAddr={s.menuJibunAddr}
      menuTitle={menuTitle}
      onCloseMenu={s.closeMenu}
      onViewFromMenu={s.openViewFromMenu}
      onCreateFromMenu={s.openCreateFromMenu}
      onMarkerClick={s.handleMarkerClick}
      onMapReady={s.onMapReady}
      useSidebar={s.useSidebar}
      setUseSidebar={s.setUseSidebar}
      onViewportChange={s.sendViewportQuery}
      viewOpen={s.viewOpen}
      editOpen={s.editOpen}
      createOpen={s.createOpen}
      selectedViewItem={selectedViewItem}
      selectedId={s.selectedId}
      prefillAddress={s.prefillAddress}
      draftPin={s.draftPin}
      selectedPos={s.selected?.position ?? null}
      closeView={() => s.setViewOpen(false)}
      closeEdit={() => s.setEditOpen(false)}
      closeCreate={s.closeCreate}
      onSaveViewPatch={s.onSaveViewPatch}
      onEditFromView={() => s.setEditOpen(true)}
      onDeleteFromView={s.onDeleteFromView}
      createHostHandlers={s.createHostHandlers}
      editHostHandlers={s.editHostHandlers}
      hideLabelForId={s.menuTargetId ?? (s.draftPin ? "__draft__" : null)}
    />
  );
}
