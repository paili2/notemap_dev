import { api } from "../api";
import type { ApiEnvelope } from "@/features/pins/pin";
import type {
  PinSearchParams,
  PinSearchResult,
} from "@/features/pins/types/pin-search";
import { buildSearchQuery } from "../utils/buildSearchQuery";
import type { PinDraftDetail } from "./types";

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

/* ───────────── 임시핀 상세조회 (/pin-drafts/:id) ───────────── */

export async function getPinDraftDetail(
  id: number | string,
  signal?: AbortSignal
): Promise<PinDraftDetail> {
  const { data } = await api.get<{
    message?: string;
    data: any;
  }>(`/pin-drafts/${id}`, {
    withCredentials: true,
    signal,
  });

  const detail = data?.data ?? data;
  return {
    id: Number(detail.id ?? id),
    lat: Number(detail.lat),
    lng: Number(detail.lng),
    addressLine: detail.addressLine ?? null,
    name: detail.name ?? null,
    contactMainPhone: detail.contactMainPhone ?? null,
  };
}

const inFlightDraftDetail = new Map<string, Promise<PinDraftDetail>>();

export function getPinDraftDetailOnce(
  id: number | string,
  signal?: AbortSignal
): Promise<PinDraftDetail> {
  const key = String(id);

  // 이미 요청 진행 중이면 그 Promise 재사용
  const cached = inFlightDraftDetail.get(key);
  if (cached) return cached;

  const p = getPinDraftDetail(id, signal).finally(() => {
    inFlightDraftDetail.delete(key);
  });

  inFlightDraftDetail.set(key, p);
  return p;
}
