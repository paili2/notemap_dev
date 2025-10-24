import { api } from "./api";

/* =========================
 * Types
 * ========================= */
export type UploadedFileMeta = {
  url?: string;
  storageKey?: string;
  key?: string;
  fileKey?: string;
  path?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
};

/** 서버 실제 응답 형태 */
type UploadResponseOk = {
  message?: string;
  data: {
    urls: string[]; // S3 접근 가능한 최종 URL 들
    domain: "map" | "contracts" | "board" | "profile" | "etc";
    userId: number;
  };
};

type PinPhotoId = number | string;

export type PinPhoto = {
  id: PinPhotoId;
  groupId: string;
  url: string;
  sortOrder: number;
  isCover?: boolean;
};

/* =========================
 * Upload
 * ========================= */

/** 업로드: multipart/form-data로 /photo/upload?domain=map (기본값 map) */
export async function uploadPhotos(
  files: File[] | FileList,
  opts?: { domain?: "map" | "contracts" | "board" | "profile" | "etc" },
  signal?: AbortSignal
): Promise<UploadedFileMeta[]> {
  const fd = new FormData();
  Array.from(files as File[]).forEach((f) => fd.append("files", f));

  const domain = opts?.domain ?? "map";

  // ✅ Content-Type은 지정하지 않음(axios가 boundary 자동 설정)
  const { data } = await api.post<UploadResponseOk>(
    `/photo/upload?domain=${encodeURIComponent(domain)}`,
    fd,
    {
      withCredentials: true, // 세션/쿠키 필요 시
      signal,
    }
  );

  const urls = data?.data?.urls;
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error(data?.message || "사진 업로드 실패");
  }

  // 기존 사용처 호환을 위해 meta 형태로 매핑
  const metas: UploadedFileMeta[] = urls.map((u) => ({ url: u }));
  return metas;
}

/* ───────────────────────────────────────────── */
const PUBLIC_BASE = ""; // 필요시 CDN 주소로 교체

export function metaToUrl(m: UploadedFileMeta): string {
  if (m.url) return m.url;
  const key = m.storageKey ?? m.key ?? m.fileKey ?? m.path;
  if (!key) throw new Error("업로드 응답에 url/key가 없습니다.");
  return PUBLIC_BASE
    ? `${PUBLIC_BASE}/${String(key).replace(/^\/+/, "")}`
    : String(key);
}

/** 업로드 후 URL 배열만 필요하면 이 함수 사용 */
export async function uploadPhotosAndGetUrls(
  files: File[] | FileList,
  opts?: { domain?: "map" | "contracts" | "board" | "profile" | "etc" },
  signal?: AbortSignal
): Promise<string[]> {
  const metas = await uploadPhotos(files, opts, signal);
  return metas.map(metaToUrl);
}

/* =========================
 * /photos CRUD
 * ========================= */

/* 목록 조회: GET /photos/:groupId */
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

/* 등록: POST /photos/:groupId */
type CreateGroupPhotosBody = {
  urls: string[]; // 업로드 후 받은 URL 배열
  isCover?: boolean; // 전부 대표 설정 여부(선택)
  sortOrders?: number[]; // 각 URL의 정렬 순서(선택)
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

/* 수정: PATCH /photos (여러 장 동시 수정 가능) */
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

/* 삭제: DELETE /photos */
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
