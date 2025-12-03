import { api } from "../../api";
import type { ApiEnvelope } from "@/features/pins/pin";
import type {
  PinSearchParams,
  PinSearchResult,
} from "@/features/pins/types/pin-search";
import { buildSearchQuery } from "../../utils/buildSearchQuery";

/* ───────────── 핀 검색 (/pins/search) ───────────── */
export async function searchPins(
  params: PinSearchParams
): Promise<PinSearchResult> {
  const qs = buildSearchQuery(params);
  const { data } = await api.get<ApiEnvelope<PinSearchResult>>(
    `/pins/search${qs ? `?${qs}` : ""}`,
    { withCredentials: true }
  );

  if (!data?.success || !data?.data) {
    const msg = data?.messages?.join("\n") || "핀 검색 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }
  return data.data;
}
