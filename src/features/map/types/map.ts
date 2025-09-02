import { PinKind } from "@/features/properties/common/sections/HeaderSection/components/PinTypeSelect";

export type LatLng = { lat: number; lng: number };

export type MapMarker = {
  id: string;
  position: LatLng;
  title?: string;
  isNew?: boolean;
  kind?: PinKind;
};
