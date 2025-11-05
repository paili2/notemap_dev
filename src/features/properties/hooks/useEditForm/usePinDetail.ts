import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toViewDetailsFromApi } from "@/features/properties/lib/view/toViewDetailsFromApi";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import { getPinRaw } from "@/shared/api/getPin";

export const pinDetailKey = (id: string | number) =>
  ["pinDetail", String(id)] as const;

type PinDetailQueryData = {
  raw: any;
  view: PropertyViewDetails;
};

export function usePinDetail(pinId?: string | number | null, enabled = true) {
  const queryClient = useQueryClient();

  const hasId = pinId != null && String(pinId) !== "";
  const idStr = hasId ? String(pinId) : "";
  // enabled=false일 때도 쿼리키는 고정되도록 noop 키 사용
  const key = hasId ? pinDetailKey(idStr) : (["pinDetail", "noop"] as const);

  // 캐시에 있으면 '값'으로 initialData를 넣어 오버로드 충돌 회피
  const cached = hasId
    ? queryClient.getQueryData<PinDetailQueryData>(pinDetailKey(idStr))
    : undefined;

  return useQuery<PinDetailQueryData>({
    queryKey: key,
    queryFn: async () => {
      const apiPin = await getPinRaw(idStr); // ApiEnvelope 표준 fetcher
      return {
        raw: apiPin,
        view: toViewDetailsFromApi(apiPin),
      };
    },
    enabled: enabled && hasId,
    staleTime: 60_000, // 편집 중 재조회 방지
    gcTime: 10 * 60_000, // 모달 닫아도 캐시 유지
    refetchOnWindowFocus: false,
    // v5: keepPreviousData 제거 → 이전 데이터 유지하려면 placeholderData 사용
    placeholderData: (prev) => prev,
    // initialData는 '값'만 조건부로 세팅 (함수로 감싸지 않음)
    ...(cached ? { initialData: cached } : {}),
  });
}
