import { api } from "./api";

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

type UploadResponse = {
  success: boolean;
  path?: string;
  data: UploadedFileMeta[];
  message?: string;
  messages?: string[];
};

/** 업로드: multipart/form-data로 /photo/upload?domain=pin */
export async function uploadPhotos(
  files: File[] | FileList,
  opts?: { domain?: string },
  signal?: AbortSignal
): Promise<UploadedFileMeta[]> {
  const fd = new FormData();
  Array.from(files as File[]).forEach((f) => fd.append("files", f));

  // ✅ 기본 domain 값 설정
  const domain = opts?.domain ?? "map";

  // ✅ domain 쿼리 추가
  const { data } = await api.post<UploadResponse>(
    `/photo/upload?domain=${encodeURIComponent(domain)}`,
    fd,
    {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
      signal,
    }
  );

  if (!data?.success || !Array.isArray(data.data)) {
    const msg =
      data?.messages?.join("\n") || data?.message || "사진 업로드 실패";
    throw new Error(msg);
  }
  return data.data;
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

export async function uploadPhotosAndGetUrls(
  files: File[] | FileList,
  opts?: { domain?: string },
  signal?: AbortSignal
): Promise<string[]> {
  const metas = await uploadPhotos(files, opts, signal);
  return metas.map(metaToUrl);
}
