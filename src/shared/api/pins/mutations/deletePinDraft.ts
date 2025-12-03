import type { AxiosRequestConfig } from "axios";
import { api } from "../../api";
import type { DeletePinRes } from "../types";

/** [DELETE] /pin-drafts/:id — 답사예정지 임시핀 삭제 */
export async function deletePinDraft(
  id: string | number,
  config?: AxiosRequestConfig
): Promise<DeletePinRes> {
  const { data } = await api.delete<{
    success?: boolean;
    message?: string;
    messages?: string[];
    data?: { id?: string | number; draftId?: string | number } | null;
  }>(`/pin-drafts/${encodeURIComponent(String(id))}`, {
    withCredentials: true,
    ...(config ?? {}),
  });

  if ((data as any)?.success === false) {
    const msg =
      (Array.isArray(data?.messages) && data!.messages!.join("\n")) ||
      data?.message ||
      "임시핀 삭제에 실패했습니다.";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }

  const resId = (data?.data as any)?.id ?? (data?.data as any)?.draftId ?? id;

  return { id: String(resId) };
}
