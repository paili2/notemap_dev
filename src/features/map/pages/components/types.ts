import type { Dispatch, SetStateAction } from "react";
import { PropertyItem } from "@/features/properties/types/propertyItem";
import { MapMarker, MapMarkerTagged } from "../../types/map";
import { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import { LatLng } from "@/lib/geo/types";
import { CreatePayload } from "@/features/properties/types/property-dto";
import { PoiKind } from "../../components/overlays/poiOverlays";

// ✅ 가독성 좋게 유니온 페이로드 분리
export type ReserveFromMenuPayload =
  | { visitId: string | number; dateISO?: string }
  | {
      lat: number;
      lng: number;
      title?: string | null;
      roadAddress?: string | null;
      jibunAddress?: string | null;
      dateISO?: string;
    };

export type MapHomeUIProps = {
  // core
  appKey: string;
  kakaoSDK: any;
  mapInstance: any;

  // data
  items: PropertyItem[];
  filtered: PropertyItem[];
  markers: (MapMarker | MapMarkerTagged)[];
  fitAllOnce: boolean;

  // search & filter
  q: string;
  filter: string;
  onChangeQ: (v: string) => void;
  onChangeFilter: (v: any) => void;
  onSubmitSearch: (v?: string) => void;

  // toggles
  useSidebar: boolean;
  setUseSidebar: Dispatch<SetStateAction<boolean>>; // ✅ React 네임스페이스 대신 명시 import
  useDistrict: boolean;

  // ⭐ POI
  poiKinds: ReadonlyArray<PoiKind>;
  onChangePoiKinds: (next: ReadonlyArray<PoiKind>) => void;

  // ⛳️ 즐겨찾기(모달) 흐름만 사용
  addFav?: boolean;
  onAddFav?: () => void | Promise<void>;
  favById?: Record<string, boolean>;

  // menu
  menuOpen: boolean;
  menuAnchor: LatLng | null;
  menuTargetId: string | number | null;
  menuRoadAddr: string | null;
  menuJibunAddr: string | null;
  menuTitle: string | null;
  onCloseMenu: () => void;
  onViewFromMenu: (id: string | number) => void;
  onCreateFromMenu: () => void;
  onPlanFromMenu: (pos: LatLng) => void;

  // map callbacks
  onMarkerClick: (id: string | number) => void;
  onMapReady: (api: any) => void; // ← 현재 구현(handleMapReady)이 api를 통째로 넘기므로 이쪽이 더 자연스러움
  onViewportChange: (vp: any, opts?: { force?: boolean }) => void;

  // modals
  viewOpen: boolean;
  editOpen: boolean;
  createOpen: boolean;
  selectedViewItem: PropertyViewDetails | null;
  selectedId: string | number | null;
  prefillAddress?: string;
  draftPin: LatLng | null;
  setDraftPin: (pin: LatLng | null) => void;
  selectedPos: LatLng | null;
  closeView: () => void;
  closeEdit: () => void;
  closeCreate: () => void;
  onSaveViewPatch: (patch: Partial<PropertyViewDetails>) => Promise<void>;
  onEditFromView: () => void;
  onDeleteFromView: () => Promise<void>;
  createHostHandlers: {
    onClose: () => void;
    appendItem: (item: PropertyItem) => void;
    selectAndOpenView: (id: string | number) => void;
    resetAfterCreate: () => void;
  };
  editHostHandlers: {
    onClose: () => void;
    updateItems: (updater: (prev: PropertyItem[]) => PropertyItem[]) => void;
    onSubmit: (payload: CreatePayload) => Promise<void>;
  };

  // misc
  hideLabelForId?: string | null;

  onOpenMenu: (p: {
    position: { lat: number; lng: number };
    propertyId: "__draft__" | string | number;
    propertyTitle?: string | null;
    pin?: { kind: string; isFav?: boolean };
  }) => void;

  onChangeHideLabelForId?: (id?: string) => void;

  onReserveFromMenu?: (args: ReserveFromMenuPayload) => Promise<void>;
};
