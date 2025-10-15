import { api } from "./api";

/* ───────────── 임시핀 생성 (답사예정 / 신규등록 위치용) ───────────── */
export type CreatePinDraftDto = {
  lat: number;
  lng: number;
  addressLine: string;
};

export type CreatePinDraftResponse = {
  success: boolean;
  path: string;
  message: string;
  data: { draftId: number } | null;
  statusCode?: number;
  messages?: string[];
};

export async function createPinDraft(dto: CreatePinDraftDto) {
  const { data } = await api.post<CreatePinDraftResponse>("pin-drafts", dto);

  if (!data?.success || !data?.data?.draftId) {
    const msg =
      data?.messages?.join(", ") || data?.message || "임시핀 생성 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }
  return { id: data.data.draftId };
}

/* ───────────── 실제 핀 생성 (폼 저장 시 /pins POST) ───────────── */
export type CreatePinDto = {
  lat: number;
  lng: number;
  addressLine: string;
  // 나머지 필드: 이름(name), options, units, directions, areaGroups 등
  // 필요할 때 점진적으로 확장 가능
};

export type CreatePinResponse = {
  success: boolean;
  path: string;
  message: string;
  data: { id: string; matchedDraftId: number | null } | null;
  statusCode?: number;
  messages?: string[];
};

export async function createPin(dto: CreatePinDto) {
  const { data } = await api.post<CreatePinResponse>("pins", dto);
  if (!data?.success || !data?.data?.id) {
    const msg = data?.messages?.join(", ") || data?.message || "핀 생성 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }
  return data.data; // { id, matchedDraftId }
}
