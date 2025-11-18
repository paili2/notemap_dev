// features/map/view/components/ModalsHost.tsx
"use client";

import RoadviewHost from "../../../view/roadview/RoadviewHost";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import PropertyCreateViewHost from "@/features/properties/components/PropertyCreateViewHost/PropertyCreateViewHost";
import { DEFAULT_CENTER } from "@/features/map/shared/constants";
import type { LatLng } from "@/lib/geo/types";

export default function ModalsHost(props: {
  /** View Modal */
  viewOpen: boolean;
  selectedViewItem: PropertyViewDetails | null;
  onCloseView: () => void;
  onSaveViewPatch: (p: Partial<PropertyViewDetails>) => void | Promise<void>;

  /** ✅ MapHomeUI 쪽 시그니처에 맞게: 인자 없는 함수 */
  onDeleteFromView: () => void | Promise<void>;

  /** Create Modal */
  createOpen: boolean;
  prefillAddress?: string;
  draftPin: { lat: number; lng: number } | null;
  selectedPos: { lat: number; lng: number } | null;
  createHostHandlers: {
    onClose: () => void;
    appendItem: (it: any) => void;
    resetAfterCreate: () => void;
    /**
     * 매물 생성 직후 호출:
     *  - draft 숨김/정리
     *  - (이제는) 마커 정리 등 MapHomeUI 쪽 후처리
     */
    onAfterCreate: (args: {
      pinId: string;
      matchedDraftId?: string | number | null;
      lat: number;
      lng: number;
      payload?: any;
    }) => void;
  };

  /** ✅ draft 기반 생성용 id */
  pinDraftId?: number;

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
    pinDraftId,
    // roadview
    roadviewVisible,
    roadviewContainerRef,
    onCloseRoadview,
  } = props;

  // 뷰 진입 가능 여부
  const canShowView = !!viewOpen && !!selectedViewItem;

  // 단일 카드 호스트 열림 여부
  const cardOpen = createOpen || canShowView;

  // create 단계에서 사용할 초기 좌표
  const initialPos: LatLng = draftPin ?? selectedPos ?? DEFAULT_CENTER;

  // 처음 열릴 때 어떤 단계로 시작할지
  const initialStage: "create" | "view" = canShowView ? "view" : "create";

  // 카드 닫기 시: 생성/뷰 쪽 둘 다 닫기 시도
  const handleCloseCard = () => {
    createHostHandlers.onClose();
    onCloseView();
  };

  return (
    <>
      {cardOpen && (
        <PropertyCreateViewHost
          open={cardOpen}
          initialStage={initialStage}
          onClose={handleCloseCard}
          /* 생성 단계 props */
          initialAddress={prefillAddress}
          initialPos={initialPos}
          pinDraftId={pinDraftId ?? null}
          appendItem={createHostHandlers.appendItem}
          resetAfterCreate={createHostHandlers.resetAfterCreate}
          onAfterCreate={createHostHandlers.onAfterCreate}
          /* 뷰 단계 props */
          initialViewData={selectedViewItem ?? undefined}
          onSaveViewPatch={onSaveViewPatch}
          onDeleteFromView={onDeleteFromView}
        />
      )}

      {/* 카드가 떠 있을 땐 로드뷰 숨김 */}
      {!cardOpen && (
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
