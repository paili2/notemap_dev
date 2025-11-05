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
    /** 매물 생성 직후 호출되어 draft 숨김 + refetch 트리거 */
    onAfterCreate: (args: {
      pinId: string;
      matchedDraftId?: string | number | null;
      lat: number;
      lng: number;
      payload?: any;
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

  // id 안전 가드
  const itemId = (selectedViewItem as any)?.id as string | number | undefined;

  // 뷰 모달 표시 가능 여부(선택된 아이템, open, id 모두 필요)
  const canShowView = !!viewOpen && !!selectedViewItem && itemId != null;

  return (
    <>
      {/* 1) View Modal: key로 완전 언마운트 보장 (포커스/refs 루프 방지) */}
      {canShowView && (
        <PropertyViewModal
          key={String(itemId)} // ★ 인스턴스 리셋을 강제
          open={true}
          onClose={onCloseView}
          data={selectedViewItem!}
          /** ✅ 에디트 초기 주입 키/캐시 안정화를 위해 pinId도 전달 */
          pinId={itemId!}
          onSave={onSaveViewPatch}
          onDelete={() => onDeleteFromView(String(itemId!))}
        />
      )}

      {/* 2) Create Modal: View 모달과 동시 포털 겹침 방지(선택적 가드 포함) */}
      {!canShowView && createOpen && (
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

      {/* 3) Roadview: View 모달이 열려있을 땐 숨겨 충돌 방지 */}
      {!canShowView && (
        <RoadviewHost
          open={roadviewVisible}
          onClose={onCloseRoadview}
          containerRef={roadviewContainerRef}
          onResize={() => {}}
        />
      )}
    </>
  );
}
