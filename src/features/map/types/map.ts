import { PinKind } from "@/features/pins/types";
import { LatLng } from "@/lib/geo/types";

export type MapMarker = {
  id: string;
  position: LatLng;
  title?: string;
  isNew?: boolean;
  kind?: PinKind;
};
