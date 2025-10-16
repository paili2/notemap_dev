// src/shared/api/pins.ts
import { api } from "./api";

/* ───────────── 실제 핀 생성 (POST /pins) ───────────── */
export type CreatePinDto = {
  lat: number;
  lng: number;
  addressLine: string;
  // 필요시 name/options/units/directions/areaGroups 등 확장
};

export type CreatePinResponse = {
  success: boolean;
  path: string;
  message?: string;
  data: { id: string; matchedDraftId: number | null } | null;
  statusCode?: number;
  messages?: string[];
};

export async function createPin(dto: CreatePinDto) {
  // ✅ 반드시 POST + 리다이렉트 차단(리다이렉트되면 GET으로 바뀌는 경우 방지)
  const { data } = await api.post<CreatePinResponse>("/pins", dto, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
    maxRedirects: 0,
  });

  if (!data?.success || !data?.data?.id) {
    const msg = data?.messages?.join("\n") || data?.message || "핀 생성 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }
  return data.data; // { id, matchedDraftId }
}

/* ───────────── 임시핀 생성 (POST /pin-drafts) ───────────── */
export type CreatePinDraftDto = {
  lat: number;
  lng: number;
  addressLine: string;
};
export type CreatePinDraftResponse = {
  success: boolean;
  path: string;
  message?: string;
  data: { draftId: number } | null;
  statusCode?: number;
  messages?: string[];
};

export async function createPinDraft(dto: CreatePinDraftDto) {
  const { data } = await api.post<CreatePinDraftResponse>("/pin-drafts", dto, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
    maxRedirects: 0,
  });

  if (!data?.success || !data?.data?.draftId) {
    const msg =
      data?.messages?.join("\n") || data?.message || "임시핀 생성 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }
  return { id: data.data.draftId };
}
