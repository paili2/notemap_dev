import { PropertyItem } from "@/features/properties/types/propertyItem";
import { MapMarker, MapMarkerTagged } from "../../types/map";
import { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import { LatLng } from "@/lib/geo/types";
import { CreatePayload } from "@/features/properties/types/property-dto";
import { PoiKind } from "../../lib/poiOverlays";

export type MapHomeUIProps = {
  // core
  appKey: string;
  kakaoSDK: any;
  mapInstance: any;

  // data
  items: PropertyItem[];
  filtered: PropertyItem[];
  markers: (MapMarker | MapMarkerTagged)[]; // ✅ MapMarkerTagged 허용
  fitAllOnce: boolean;

  // search & filter
  q: string;
  filter: string;
  onChangeQ: (v: string) => void;
  onChangeFilter: (v: any) => void;
  onSubmitSearch: (v?: string) => void; // ✅ kw optional

  // toggles
  useSidebar: boolean;
  setUseSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  useDistrict: boolean; // 확장 대비 유지

  // ⭐ POI
  poiKinds: PoiKind[];
  onChangePoiKinds: (next: PoiKind[]) => void;

  // menu
  menuOpen: boolean;
  menuAnchor: LatLng | null;
  menuTargetId: string | null;
  menuRoadAddr: string | null;
  menuJibunAddr: string | null;
  menuTitle: string | null;
  onCloseMenu: () => void;
  onViewFromMenu: (id: string) => void;
  onCreateFromMenu: () => void;
  onPlanFromMenu: (pos: LatLng) => void;

  // map callbacks
  onMarkerClick: (id: string | number) => void; // ✅ number 허용
  onMapReady: ({ kakao, map }: any) => void;
  onViewportChange: (vp: any, opts?: { force?: boolean }) => void; // ✅ force 옵션

  // modals
  viewOpen: boolean;
  editOpen: boolean;
  createOpen: boolean;
  selectedViewItem: PropertyViewDetails | null;
  selectedId: string | null;
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
    selectAndOpenView: (id: string | number) => void; // ✅ number 허용 (내부 사용 편의)
    resetAfterCreate: () => void;
  };
  editHostHandlers: {
    onClose: () => void;
    updateItems: (updater: (prev: PropertyItem[]) => PropertyItem[]) => void;
    onSubmit: (payload: CreatePayload) => Promise<void>;
  };

  // misc
  hideLabelForId: string | null;

  onOpenMenu: (p: {
    position: { lat: number; lng: number };
    propertyId: "__draft__" | string;
    propertyTitle?: string | null;
    pin?: { kind: string; isFav?: boolean };
  }) => void;
  onChangeHideLabelForId?: (id: string | null) => void;

  onToggleFav?: (next: boolean, ctx?: { id?: string; pos?: LatLng }) => void;
  favById?: Record<string, boolean>;
};
