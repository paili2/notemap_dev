"use client";

import MapMenu from "../../../components/MapMenu/MapMenu";
import ToggleSidebar from "../../../components/top/ToggleSidebar/ToggleSidebar";
import type { MapMenuKey } from "../../../components/MapMenu";
import { PoiKind } from "@/features/map/components/overlays/poiOverlays";
import Portal from "@/components/Portal";

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
}) {
  const stop = (e: any) => {
    e.stopPropagation?.();
    e.nativeEvent?.stopPropagation?.();
    e.nativeEvent?.stopImmediatePropagation?.();
  };

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
          {/* MapMenu (트리거/메뉴만 클릭 허용) */}
          <div className="relative z-[2] shrink-0">
            <MapMenu
              active={props.activeMenu}
              onChange={(next) => {
                const resolved = next === props.activeMenu ? "all" : next;
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
