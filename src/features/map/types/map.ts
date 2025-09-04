import { PinKind } from "../pins";

export type LatLng = { lat: number; lng: number };

export type MapMarker = {
  id: string;
  position: LatLng;
  title?: string;
  isNew?: boolean;
  kind?: PinKind;
};
