import { useQuery } from "@tanstack/react-query";
import { getPin, GetPinResult } from "@/shared/api/getPin";

export const pinKeys = {
  all: ["pin"] as const,
  detail: (id: string) => [...pinKeys.all, "detail", id] as const,
};

export function usePin(id?: string | null) {
  const enabled = !!id && id.trim().length > 0;
  return useQuery<GetPinResult>({
    queryKey: enabled ? pinKeys.detail(id!) : pinKeys.all,
    queryFn: () => getPin(id!),
    enabled,
    staleTime: 60_000, // 1분
  });
}
