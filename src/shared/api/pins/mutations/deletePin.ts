import type { AxiosRequestConfig } from "axios";
import { api } from "../../api";
import type { ApiEnvelope } from "@/features/pins/pin";
import type { DeletePinRes } from "../types";

/** [DELETE] /pins/:id — 핀 완전 삭제 */
export async function deletePin(
  id: string | number,
  config?: AxiosRequestConfig
): Promise<DeletePinRes> {
  const { data } = await api.delete<
    ApiEnvelope<{ id: string | number } | null>
  >(`/pins/${encodeURIComponent(String(id))}`, {
    withCredentials: true,
    ...(config ?? {}),
  });

  if (!data?.success) {
    const single = (data as any)?.message as string | undefined;
    const msg =
      (Array.isArray(data?.messages) && data!.messages!.join("\n")) ||
      single ||
      "핀 삭제에 실패했습니다.";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }

  const resId = (data.data as any)?.id ?? id;
  return { id: String(resId) };
}

/**
 * ⚠️ 레거시 호환용:
 *  - 예전 코드가 togglePinDisabled(id, true)를 호출해도
 *    내부에서는 DELETE /pins/:id 로 동작하게 유지
 */
export async function togglePinDisabled(
  id: string | number,
  isDisabled: boolean,
  config?: AxiosRequestConfig
): Promise<DeletePinRes> {
  if (!isDisabled) {
    throw new Error("핀 복구 API는 아직 지원하지 않습니다.");
  }
  return deletePin(id, config);
}
