import type { PinKind } from "@/features/pins/types";

export const PIN_ACCENTS: Record<PinKind, string> = {
  "1room": "#ffffff",
  "1room-terrace": "#ffffff",
  "2room": "#4caf50",
  "2room-terrace": "#4caf50",
  "3room": "#ffd602",
  "3room-terrace": "#ffd602",
  "4room": "#9c27b0",
  "4room-terrace": "#9c27b0",
  duplex: "#ff68b5",
  townhouse: "#7f7f7f",
  oldhouse: "#2196f3",
  question: "#ffffff",
  completed: "#448d46",
};

export function getPinUrl(kind: PinKind): string {
  return `/pins/${kind}-pin.svg`;
}
