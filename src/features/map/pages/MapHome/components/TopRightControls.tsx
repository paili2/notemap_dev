"use client";

import { useEffect, useRef } from "react";
import MapMenu from "../../../components/MapMenu/MapMenu";
import ToggleSidebar from "../../../components/top/ToggleSidebar/ToggleSidebar";
import type { MapMenuKey } from "../../../components/MapMenu";
import { PoiKind } from "@/features/map/components/overlays/poiOverlays";
import Portal from "@/components/Portal";
import { usePlannedDrafts } from "../hooks/usePlannedDrafts";

function isPlannedKey(k: MapMenuKey | string) {
  return k === "planned"; // ← 실제 키로 교체
}

export default function TopRightControls(props: {
  activeMenu: MapMenuKey;
  onChangeFilter: (next: MapMenuKey) => void;
  isDistrictOn: boolean;
  setIsDistrictOn: (v: boolean) => void;
  poiKinds: readonly PoiKind[];
  onChangePoiKinds: (next: PoiKind[]) => void;
  roadviewVisible: boolean;
  onToggleRoadview: () => void;
  rightOpen: boolean;
  setRightOpen: (v: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  getBounds: () => kakao.maps.LatLngBounds | undefined;
}) {
  const stop = (e: any) => {
    e.stopPropagation?.();
    e.nativeEvent?.stopPropagation?.();
    e.nativeEvent?.stopImmediatePropagation?.();
  };
  // 1) kakao Bounds -> 커스텀 Bounds 어댑터
  const getBoundsForHook = () => {
    const b = props.getBounds?.();
    if (!b) return undefined;
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    return {
      swLat: sw.getLat(),
      swLng: sw.getLng(),
      neLat: ne.getLat(),
      neLng: ne.getLng(),
    };
  };

  const { reloadPlanned } = usePlannedDrafts({
    filter: isPlannedKey(props.activeMenu) ? "planned" : "all",
    getBounds: getBoundsForHook, // 2) 어댑터를 훅에 전달
  });

  const loadingRef = useRef(false);

  // 메뉴가 planned일 때만 데이터 로드
  useEffect(() => {
    const run = async () => {
      if (isPlannedKey(props.activeMenu)) {
        if (loadingRef.current) return;
        loadingRef.current = true;
        try {
          await Promise.resolve(reloadPlanned());
        } finally {
          loadingRef.current = false;
        }
      }
      // else: 다른 메뉴에서는 planned 레이어를 렌더 단계에서 제외
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.activeMenu, reloadPlanned]);

  return (
    <Portal>
      <div
        id="top-right-controls"
        className="fixed top-3 right-3 z-[2147483647]"
        style={{ pointerEvents: "auto" }}
      >
        <div
          className="relative flex items-center gap-2"
          onPointerDown={stop}
          onMouseDown={stop}
          onTouchStart={stop}
        >
          <div className="relative z-[2] shrink-0">
            <MapMenu
              active={props.activeMenu}
              onChange={(next) => {
                const resolved = next === props.activeMenu ? "all" : next;
                // 즉시 로드가 필요하면 아래 2줄을 유지(중복이 걱정되면 useEffect만으로도 충분)
                if (isPlannedKey(resolved)) reloadPlanned();
                props.onChangeFilter(resolved as MapMenuKey);
              }}
              isDistrictOn={props.isDistrictOn}
              onToggleDistrict={props.setIsDistrictOn}
              poiKinds={props.poiKinds}
              onChangePoiKinds={props.onChangePoiKinds}
              roadviewVisible={props.roadviewVisible}
              onToggleRoadview={props.onToggleRoadview}
              expanded={props.rightOpen}
              onExpandChange={(expanded) => {
                props.setRightOpen(expanded);
                if (expanded && props.sidebarOpen) props.setSidebarOpen(false);
              }}
            />
          </div>

          <div className="relative z-[3] shrink-0 pointer-events-auto">
            <ToggleSidebar
              overlay={false}
              controlledOpen={props.sidebarOpen}
              onChangeOpen={(open) => {
                props.setSidebarOpen(open);
                if (open) props.setRightOpen(false);
              }}
            />
          </div>
        </div>
      </div>
    </Portal>
  );
}
