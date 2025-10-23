"use client";

import PropertyViewModal from "@/features/properties/components/PropertyViewModal/PropertyViewModal";
import MapCreateModalHost from "../../../components/MapCreateModalHost/MapCreateModalHost";
import RoadviewHost from "../../../components/Roadview/RoadviewHost";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";

export default function ModalsHost(props: {
  viewOpen: boolean;
  selectedViewItem: PropertyViewDetails | null;
  onCloseView: () => void;
  onSaveViewPatch: (p: Partial<PropertyViewDetails>) => void | Promise<void>;
  onDeleteFromView: (id: string) => void | Promise<void>;

  createOpen: boolean;
  prefillAddress?: string;
  draftPin: any;
  selectedPos: any;
  createHostHandlers: {
    onClose: () => void;
    appendItem: (it: any) => void;
    selectAndOpenView: (id: string) => void;
    resetAfterCreate: () => void;
  };

  roadviewVisible: boolean;
  roadviewContainerRef: any;
  onCloseRoadview: () => void;
}) {
  const {
    viewOpen,
    selectedViewItem,
    onCloseView,
    onSaveViewPatch,
    onDeleteFromView,
    createOpen,
    prefillAddress,
    draftPin,
    selectedPos,
    createHostHandlers,
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
