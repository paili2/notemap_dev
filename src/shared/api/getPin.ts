import { AxiosError } from "axios";
import { api } from "./api";
import type { ApiPin } from "@/features/properties/lib/view/toViewDetailsFromApi";
import type { ApiEnvelope, PinDetail } from "@/features/pins/pin";

// (유틸) 메시지 추출: messages 우선, 없으면 message(any), 둘 다 없으면 기본문구
function pickMsg(x: any, fallback: string) {
  if (Array.isArray(x?.messages) && x.messages.length) {
    return x.messages.join("\n");
  }
  if (typeof x?.message === "string" && x.message.trim().length) {
    return x.message;
  }
  return fallback;
}

/* 1) 어댑터용 RAW */
export async function getPinRaw(id: string | number): Promise<ApiPin> {
  const res = await api.get<{ success: boolean; data: ApiPin }>(`/pins/${id}`, {
    withCredentials: true,
    headers: { "x-no-retry": "1" },
    validateStatus: () => true,
  });

  const env: any = res?.data;
  if (!env?.success || !env?.data) {
    const msg = pickMsg(env, "핀 상세 조회 실패");
    const e = new Error(msg) as any;
    e.responseData = env;
    throw e;
  }
  return env.data;
}

/* 2) 레거시 결과 유니온 */
export type GetPinOk = { ok: true; pin: PinDetail };
export type GetPinNotFound = { ok: false; reason: "not-found" };
export type GetPinFail = { ok: false; reason: "error"; message?: string };
export type GetPinResult = GetPinOk | GetPinNotFound | GetPinFail;

export async function getPinResult(id: string | number): Promise<GetPinResult> {
  try {
    const res = await api.get<ApiEnvelope<PinDetail>>(`/pins/${id}`, {
      withCredentials: true,
      headers: { "x-no-retry": "1" },
      validateStatus: () => true,
    });

    if (res.data?.success && res.data.data) {
      return { ok: true, pin: res.data.data };
    }
    // 404 처리 (서버가 statusCode를 body로 줄 수도 있고 HTTP status로 올 수도 있음)
    if ((res.data as any)?.statusCode === 404) {
      return { ok: false, reason: "not-found" };
    }
    return {
      ok: false,
      reason: "error",
      // ❌ res.data.message 직접 접근 금지 → ✅ pickMsg 사용
      message: pickMsg(res.data as any, "핀 상세 조회 실패"),
    };
  } catch (e) {
    const err = e as AxiosError<ApiEnvelope<unknown>>;
    if (err.response?.status === 404) {
      return { ok: false, reason: "not-found" };
    }
    return {
      ok: false,
      reason: "error",
      // ❌ err.response.data.message 직접 접근 금지 → ✅ pickMsg 사용
      message: pickMsg(
        err.response?.data as any,
        err.message || "Unknown error"
      ),
    };
  }
}
