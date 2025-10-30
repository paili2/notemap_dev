"use client";

import PropertyViewModal from "@/features/properties/components/PropertyViewModal/PropertyViewModal";
import MapCreateModalHost from "../../../components/MapCreateModalHost/MapCreateModalHost";
import RoadviewHost from "../../../components/Roadview/RoadviewHost";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";

export default function ModalsHost(props: {
  /** View Modal */
  viewOpen: boolean;
  selectedViewItem: PropertyViewDetails | null;
  onCloseView: () => void;
  onSaveViewPatch: (p: Partial<PropertyViewDetails>) => void | Promise<void>;
  onDeleteFromView: (id: string) => void | Promise<void>;

  /** Create Modal */
  createOpen: boolean;
  prefillAddress?: string;
  draftPin: { lat: number; lng: number } | null;
  selectedPos: { lat: number; lng: number } | null;
  createHostHandlers: {
    onClose: () => void;
    appendItem: (it: any) => void;
    selectAndOpenView: (id: string) => void;
    resetAfterCreate: () => void;
    /** ✅ 매물 생성 직후 호출되어 draft 숨김 + refetch 트리거
     *  payload는 선택적(과거 코드와의 호환)
     */
    onAfterCreate: (args: {
      pinId: string;
      matchedDraftId?: string | number | null;
      lat: number;
      lng: number;
      payload?: any; // ← 추가
    }) => void;
  };

  /** Roadview */
  roadviewVisible: boolean;
  roadviewContainerRef: any;
  onCloseRoadview: () => void;
}) {
  const {
    // view
    viewOpen,
    selectedViewItem,
    onCloseView,
    onSaveViewPatch,
    onDeleteFromView,
    // create
    createOpen,
    prefillAddress,
    draftPin,
    selectedPos,
    createHostHandlers,
    // roadview
    roadviewVisible,
    roadviewContainerRef,
    onCloseRoadview,
  } = props;

  return (
    <>
      {viewOpen && selectedViewItem && (
        <PropertyViewModal
          open
          onClose={onCloseView}
          data={selectedViewItem}
          onSave={onSaveViewPatch}
          onDelete={() => onDeleteFromView(String(selectedViewItem.id))}
        />
      )}

      {createOpen && (
        <MapCreateModalHost
          open={createOpen}
          prefillAddress={prefillAddress}
          draftPin={draftPin}
          selectedPos={selectedPos}
          onClose={createHostHandlers.onClose}
          appendItem={createHostHandlers.appendItem}
          selectAndOpenView={createHostHandlers.selectAndOpenView}
          resetAfterCreate={createHostHandlers.resetAfterCreate}
          onAfterCreate={createHostHandlers.onAfterCreate}
        />
      )}

      <RoadviewHost
        open={roadviewVisible}
        onClose={onCloseRoadview}
        containerRef={roadviewContainerRef}
        onResize={() => {}}
      />
    </>
  );
}
