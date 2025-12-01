import type { PoiKind } from "@/features/map/shared/overlays/poiOverlays";

export type UsePoiLayerOptions = {
  kakaoSDK?: any | null;
  map?: any | null;
  enabledKinds?: PoiKind[];
  maxResultsPerKind?: number;
  minViewportEdgeMeters?: number; // 호환 유지(미사용)
  showAtOrBelowLevel?: number; // 호환 유지(미사용)
};

export type OverlayInst = {
  destroy: () => void;
  update: (
    p: Partial<{
      lat: number;
      lng: number;
      zIndex: number;
      kind: PoiKind;
      size: number;
      iconSize: number;
    }>
  ) => void;
  show: () => void;
  hide: () => void;
  visible: boolean;
};

export type BoundsBox = {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
};
