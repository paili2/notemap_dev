// src/shared/api/pinPhotos.ts

export type PinPhotoId = number | string;

export type PinPhoto = {
  id: PinPhotoId;
  groupId: string;
  url: string;
  sortOrder: number;
  isCover?: boolean;
};

/* ───────── 목록 조회: GET /photos/:groupId ───────── */
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

/* ───────── 등록: POST /photos/:groupId ───────── */
export type CreateGroupPhotosBody = {
  urls: string[]; // 업로드 후 최종 접근 가능한 URL 배열
  isCover?: boolean; // (선택) true 지정 시 해당 요청에 포함된 전부에 동일값 적용
  sortOrders?: number[]; // (선택) 각 url의 정렬순서
};

export async function createGroupPhotos(
  groupId: string,
  body: CreateGroupPhotosBody,
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

/* ───────── 수정: PATCH /photos ─────────
   여러 장 동시 수정 가능. 필요한 필드만 보냄. */
export type UpdatePhotosBody = {
  photoIds: string[]; // 수정 대상 사진 IDs
  isCover?: boolean; // 대표 여부 토글
  sortOrder?: number; // 단건 정렬 변경 시 사용
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

/* ───────── 삭제: DELETE /photos ───────── */
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
