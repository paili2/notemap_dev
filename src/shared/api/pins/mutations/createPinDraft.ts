import { api } from "../../api";
import { DEV, assertNoTruncate } from "../utils";
import type { CreatePinDraftDto } from "../types";

type CreatePinDraftResponse = {
  success: boolean;
  path: string;
  message?: string;
  data: {
    draftId?: number;
    id?: number;
    pinDraftId?: number;
    pin_draft_id?: number;
    lat?: number;
    lng?: number;
  } | null;
  statusCode?: number;
  messages?: string[];
};

export async function createPinDraft(
  dto: CreatePinDraftDto,
  signal?: AbortSignal
): Promise<{ id: string }> {
  const latNum = Number(dto.lat);
  const lngNum = Number(dto.lng);
  if (!Number.isFinite(latNum))
    throw new Error("lat이 유효한 숫자가 아닙니다.");
  if (!Number.isFinite(lngNum))
    throw new Error("lng가 유효한 숫자가 아닙니다.");

  const payload = {
    lat: latNum,
    lng: lngNum,
    addressLine: String(dto.addressLine ?? ""),
    ...(dto.name != null && String(dto.name).trim() !== ""
      ? { name: String(dto.name).trim() }
      : {}),
    ...(dto.contactMainPhone != null &&
    String(dto.contactMainPhone).trim() !== ""
      ? { contactMainPhone: String(dto.contactMainPhone).trim() }
      : {}),
  };

  assertNoTruncate("createPinDraft", payload.lat, payload.lng);

  if (DEV) {
    console.groupCollapsed("[createPinDraft] payload");
    console.log(payload);
    console.groupEnd();
  }

  const request = api.post<CreatePinDraftResponse>("/pin-drafts", payload, {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
    maxRedirects: 0,
    signal,
    validateStatus: () => true,
  });

  const { data, headers, status } = await request;

  if (DEV) {
    console.groupCollapsed("[createPinDraft] response");
    console.log("status:", status);
    console.log("data:", data);
    console.groupEnd();
  }

  if (status === 409) {
    throw new Error("중복 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.");
  }

  const savedLat = (data as any)?.data?.lat;
  const savedLng = (data as any)?.data?.lng;
  if (
    typeof savedLat === "number" &&
    typeof savedLng === "number" &&
    (Math.abs(savedLat - payload.lat) > 1e-8 ||
      Math.abs(savedLng - payload.lng) > 1e-8)
  ) {
    console.warn("[coords-mismatch:createPinDraft] server-truncated?", {
      sent: { lat: payload.lat, lng: payload.lng },
      saved: { lat: savedLat, lng: savedLng },
    });
  }

  let draftId: string | number | undefined =
    data?.data?.draftId ??
    data?.data?.id ??
    (data?.data as any)?.pinDraftId ??
    (data?.data as any)?.pin_draft_id ??
    undefined;

  if (draftId == null) {
    const loc = (headers as any)?.location || (headers as any)?.Location;
    if (typeof loc === "string") {
      const m = loc.match(/\/pin-drafts\/(\d+)(?:$|[\/?#])/);
      if (m) draftId = m[1];
    }
  }

  if (draftId == null || draftId === "") {
    const msg =
      data?.messages?.join("\n") || data?.message || "임시핀 생성 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }
  return { id: String(draftId) };
}
