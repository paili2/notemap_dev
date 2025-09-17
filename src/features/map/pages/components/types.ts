import { PropertyItem } from "@/features/properties/types/propertyItem";
import { MapMarker } from "../../types/map";
import { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import { LatLng } from "@/lib/geo/types";
import { CreatePayload } from "@/features/properties/types/property-dto";

export type MapHomeUIProps = {
  // core
  appKey: string;
  kakaoSDK: any;
  mapInstance: any;

  // data
  items: PropertyItem[];
  filtered: PropertyItem[];
  markers: MapMarker[];
  fitAllOnce: boolean;

  // search & filter
  q: string;
  filter: string;
  onChangeQ: (v: string) => void;
  onChangeFilter: (v: any) => void;
  onSubmitSearch: (v: string) => void;

  // toggles
  useSidebar: boolean;
  setUseSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  useDistrict: boolean; // 현재 컴포넌트에서는 사용 안 하지만 확장 대비 유지

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
  onMarkerClick: (id: string) => void;
  onMapReady: ({ kakao, map }: any) => void;
  onViewportChange: (vp: any) => void;

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
    selectAndOpenView: (id: string) => void;
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
    pin: { kind: string; isFav?: boolean };
  }) => void;
  onChangeHideLabelForId?: (id: string | null) => void;

  onToggleFav?: (next: boolean, ctx?: { id?: string; pos?: LatLng }) => void;
  favById?: Record<string, boolean>;
};
