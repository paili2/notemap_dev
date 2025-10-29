import { api } from "@/shared/api/api";

/** 업로드 도메인 */
export type UploadDomain = "map" | "contracts" | "board" | "profile" | "etc";

/** 허용 확장자 / 용량 / 분할 업로드 설정 */
export const ALLOWED_FILE_EXTS = new Set<string>([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "hwp",
  "hwpx",
]);

export const MAX_FILES_PER_REQUEST = 10; // 서버 FilesInterceptor('files', 10)
export const MAX_FILES_PER_CARD = 20; // UI 정책
export const MAX_SIZE_MB = Number(
  process.env.NEXT_PUBLIC_UPLOAD_MAX_SIZE_MB ?? 10
);
export const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/** 업로드 메타 (호환용) */
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

/** 백엔드 응답 타입 (Nest 코드 기준) */
type UploadResponseOk = {
  message?: string;
  data: {
    urls: string[];
    keys?: string[]; // ⬅ optional 로 완화
    domain: UploadDomain;
    userId: string; // 백엔드 구현이 string 반환이므로 string으로 통일
  };
};

const toExt = (f: File): string => {
  const n = f.name || "";
  return n.includes(".") ? n.split(".").pop()!.toLowerCase() : "";
};

/** 카드 잔여 용량(remain) 고려한 유효성 검사 */
export function validateFiles(
  files: File[],
  remain: number
): { ok: File[]; skipped: { file: File; reason: string }[] } {
  const ok: File[] = [];
  const skipped: { file: File; reason: string }[] = [];
  for (const f of files) {
    if (ok.length >= remain) {
      skipped.push({
        file: f,
        reason: `카드당 최대 ${MAX_FILES_PER_CARD}장 제한`,
      });
      continue;
    }
    const ext = toExt(f);
    if (!ALLOWED_FILE_EXTS.has(ext)) {
      skipped.push({ file: f, reason: `허용되지 않은 확장자 (.${ext})` });
      continue;
    }
    if (f.size > MAX_SIZE_BYTES) {
      skipped.push({
        file: f,
        reason: `파일 크기 초과 (최대 ${MAX_SIZE_MB}MB)`,
      });
      continue;
    }
    ok.push(f);
  }
  return { ok, skipped };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** /photo/upload 멀티파트 업로드(요청당 10장 자동 분할) → 메타 배열 반환 */
export async function uploadPhotos(
  files: File[] | FileList,
  opts?: { domain?: UploadDomain },
  signal?: AbortSignal
): Promise<UploadedFileMeta[]> {
  const all: File[] = Array.from(files as File[]);
  const domain: UploadDomain = opts?.domain ?? "map";
  const batches = chunk<File>(all, MAX_FILES_PER_REQUEST);

  const metas: UploadedFileMeta[] = [];
  for (const batch of batches) {
    const fd = new FormData();
    batch.forEach((f: File) => fd.append("files", f));

    const { data } = await api.post<UploadResponseOk>(
      `/photo/upload?domain=${encodeURIComponent(domain)}`,
      fd,
      { withCredentials: true, signal }
    );

    const urls: string[] = Array.isArray(data?.data?.urls)
      ? data.data.urls
      : [];
    metas.push(...urls.map((u: string) => ({ url: u })));
  }
  return metas;
}

/** URL 배열만 필요할 때 */
export async function uploadPhotosAndGetUrls(
  files: File[] | FileList,
  opts?: { domain?: UploadDomain },
  signal?: AbortSignal
): Promise<string[]> {
  const metas = await uploadPhotos(files, opts, signal);
  // 타입가드로 정확히 string[] 반환
  return metas
    .map((m: UploadedFileMeta) => m.url)
    .filter((u: string | undefined): u is string => typeof u === "string");
}
