import { api } from "@/shared/api/api";

/** 공통 응답 형태 */
type ApiWrap<T> = { message?: string; data?: T };

/** 예약 생성 DTO (✅ 백엔드 스펙에 맞춰 이름 교정) */
export type CreateSurveyReservationDto = {
  pinDraftId: number; // ← draftId -> pinDraftId
  reservedDate: string; // ← date -> reservedDate ("YYYY-MM-DD")
  note?: string; // 메모(선택)
  // time 필드는 백이 받지 않으면 제거 (필요 시 백에 맞춰 재도입)
};

/** 내 예약 아이템 (필드명 여유 있게) */
export type MyReservation = {
  id: number | string;
  pinDraftId?: number;
  addressLine?: string;
  reservedDate?: string; // "YYYY-MM-DD"
  createdAt?: string;
};

/** BEFORE 아이템(예약 없는 활성 임시핀) */
export type BeforeDraft = {
  id: string | number;
  lat: number;
  lng: number;
  addressLine?: string;
  createdAt?: string;
};

export type BoundsParams = {
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
};

/** ✅ 예약 생성 (세션 필요) */
export async function createSurveyReservation(dto: CreateSurveyReservationDto) {
  const res = await api.post<ApiWrap<{ id: number | string }>>(
    "survey-reservations",
    dto,
    { withCredentials: true, headers: { "Content-Type": "application/json" } }
  );
  return res.data?.data;
}

/** ✅ 내 예약 목록 조회 (세션 필요) */
export async function fetchMySurveyReservations(): Promise<MyReservation[]> {
  const res = await api.get<ApiWrap<MyReservation[]>>(
    "survey-reservations/scheduled",
    { withCredentials: true }
  );
  return Array.isArray(res.data?.data) ? res.data!.data! : [];
}

/** ✅ 답사 전(예약 없는) 임시핀 목록 조회 — 지도 바운딩 박스 선택 지원 */
export async function fetchUnreservedDrafts(
  bounds?: BoundsParams
): Promise<BeforeDraft[]> {
  const res = await api.get<ApiWrap<BeforeDraft[]>>(
    "survey-reservations/before",
    {
      params: bounds,
      // withCredentials는 필요 없으면 빼도 OK (공개 엔드포인트라면)
    }
  );
  return Array.isArray(res.data?.data) ? res.data!.data! : [];
}

/** ✅ 예약 취소 (세션 필요) */
export async function cancelSurveyReservation(id: number | string) {
  await api.delete(`survey-reservations/${id}`, { withCredentials: true });
}
