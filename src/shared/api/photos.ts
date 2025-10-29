/* =========================
 * Types
 * ========================= */

export type PinPhotoId = number | string;

export type PinPhoto = {
  id: PinPhotoId;
  groupId: string;
  url: string;
  sortOrder: number;
  isCover?: boolean;
};

/* =========================
 * /photo-groups CRUD  (신규 명세)
 * ========================= */

type CreatePhotoGroupReq = {
  /** 서버가 요구: 반드시 number */
  pinId: number | string;
  /** URL-safe 문자열(하이픈 등 OK) */
  groupId: string;
  /** 업로드 후 최종 접근 가능한 URL 배열 */
  urls: string[];
  /** 각 url의 정렬 순서 */
  sortOrders?: number[];
  /** true면 이번 요청에 포함된 전부 대표로 설정 */
  isCover?: boolean;
};

type UpdatePhotoGroupReq = {
  /** 그룹 표시 이름 등 확장 여지. 현재 정렬만 가정 */
  sortOrder?: number;
  /** 대표 그룹 지정 등 확장 여지 */
  isCover?: boolean;
};

export async function listPhotoGroupsByPin(
  pinId: number | string,
  init?: RequestInit
): Promise<any[]> {
  const idNum = Number(pinId);
  if (!Number.isFinite(idNum))
    throw new Error("listPhotoGroupsByPin: pinId must be number");
  const res = await fetch(
    `/photo-groups/${encodeURIComponent(String(idNum))}`,
    {
      method: "GET",
      credentials: "include",
      ...init,
    }
  );
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`사진 그룹 조회 실패: ${res.status} ${msg}`);
  }
  const data = await res.json().catch(() => ({}));
  return (data?.data ?? data) as any[];
}

/** ✅ 새 명세: POST /photo-groups  (pinId + groupId + urls + sortOrders + isCover) */
export async function createGroupPhotos(
  body: CreatePhotoGroupReq,
  init?: RequestInit
): Promise<PinPhoto[]> {
  const pinIdNum = Number(body.pinId);
  if (!Number.isFinite(pinIdNum))
    throw new Error("createGroupPhotos: pinId must be number");

  const res = await fetch(`/photo-groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ...body, pinId: pinIdNum }),
    ...init,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`사진 그룹 생성 실패: ${res.status} ${msg}`);
  }
  const data = await res.json().catch(() => ({}));
  return (data?.data ?? data) as PinPhoto[];
}

/** PATCH /photo-groups/:groupId (그룹 메타 수정—필요 시 사용) */
export async function updatePhotoGroup(
  groupId: string,
  dto: UpdatePhotoGroupReq,
  init?: RequestInit
): Promise<any> {
  const res = await fetch(`/photo-groups/${encodeURIComponent(groupId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(dto ?? {}),
    ...init,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`사진 그룹 수정 실패: ${res.status} ${msg}`);
  }
  const data = await res.json().catch(() => ({}));
  return data?.data ?? data;
}

/* =========================
 * /photos CRUD  (그룹 내 사진 조작: 유지)
 * ========================= */

/** 목록 조회: GET /photos/:groupId */
export async function listGroupPhotos(
  groupId: string,
  init?: RequestInit
): Promise<PinPhoto[]> {
  const res = await fetch(`/photos/${encodeURIComponent(groupId)}`, {
    method: "GET",
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`사진 목록 조회 실패: ${res.status} ${msg}`);
  }
  const data = await res.json().catch(() => ({}));
  return (data?.data ?? data) as PinPhoto[];
}

/** 등록: POST /photos/:groupId  (이전 방식 유지용) */
type CreatePhotosInGroupBody = {
  urls: string[];
  isCover?: boolean;
  sortOrders?: number[];
};

export async function createPhotosInGroup(
  groupId: string,
  body: CreatePhotosInGroupBody,
  init?: RequestInit
): Promise<PinPhoto[]> {
  const res = await fetch(`/photos/${encodeURIComponent(groupId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`사진 등록 실패: ${res.status} ${msg}`);
  }
  const data = await res.json().catch(() => ({}));
  return (data?.data ?? data) as PinPhoto[];
}

/** 수정: PATCH /photos (여러 장 동시 수정 가능, 필요한 필드만 보냄) */
type UpdatePhotosBody = {
  photoIds: string[]; // 수정 대상 사진 IDs
  isCover?: boolean; // 대표 여부 토글
  sortOrder?: number; // 단건 정렬 변경
  moveGroupId?: string | null; // 그룹 이동
};

export async function updatePhotos(
  body: UpdatePhotosBody,
  init?: RequestInit
): Promise<PinPhoto[]> {
  const res = await fetch(`/photos`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`사진 수정 실패: ${res.status} ${msg}`);
  }
  const data = await res.json().catch(() => ({}));
  return (data?.data ?? data) as PinPhoto[];
}

/** 삭제: DELETE /photos */
export async function deletePhotos(
  photoIds: string[],
  init?: RequestInit
): Promise<{ affected: number }> {
  const res = await fetch(`/photos`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ photoIds }),
    ...init,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`사진 삭제 실패: ${res.status} ${msg}`);
  }
  const data = await res.json().catch(() => ({}));
  return (data?.data ?? data) as { affected: number };
}
