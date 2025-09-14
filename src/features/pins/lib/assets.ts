import type { PinKind } from "@/features/pins/types";

export function getPinUrl(kind: PinKind): string {
  return `/pins/${kind}-pin.svg`;
}
