import { AxiosError } from "axios";
import { api } from "@/shared/api/api";
import { ApiEnvelope, PinDetail } from "@/features/pins/pin";

export type GetPinOk = { ok: true; pin: PinDetail };
export type GetPinNotFound = { ok: false; reason: "not-found" };
export type GetPinFail = { ok: false; reason: "error"; message?: string };
export type GetPinResult = GetPinOk | GetPinNotFound | GetPinFail;

export async function getPin(id: string): Promise<GetPinResult> {
  try {
    const res = await api.get<ApiEnvelope<PinDetail>>(`/pins/${id}`);
    if (res.data?.success && res.data.data) {
      return { ok: true, pin: res.data.data };
    }
    if (res.data?.statusCode === 404) {
      return { ok: false, reason: "not-found" };
    }
    return {
      ok: false,
      reason: "error",
      message: res.data?.messages?.join("\n"),
    };
  } catch (e) {
    const err = e as AxiosError<ApiEnvelope<unknown>>;
    if (err.response?.status === 404) {
      return { ok: false, reason: "not-found" };
    }
    return {
      ok: false,
      reason: "error",
      message:
        err.response?.data?.messages?.join("\n") ||
        err.message ||
        "Unknown error",
    };
  }
}
