import { useQuery } from "@tanstack/react-query";

import type { PropertyViewDetails } from "./types";
import { toViewDetailsFromApi } from "../../lib/view/toViewDetailsFromApi";
import { getPinRaw } from "@/shared/api/getPin";

export function usePinDetails(pinId?: string | number) {
  return useQuery({
    queryKey: ["pin-detail", String(pinId ?? "")],
    enabled: !!pinId,
    queryFn: async (): Promise<
      PropertyViewDetails & { lat: number; lng: number }
    > => {
      const apiPin = await getPinRaw(String(pinId)); // ✅ 바로 raw 데이터
      return toViewDetailsFromApi(apiPin); // ✅ 어댑터로 변환
    },
  });
}
