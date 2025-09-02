// IndexedDB에 Blob 저장/복원 (idb-keyval 사용)
import { set, get, del } from "idb-keyval";

export type ImageRef = { idbKey: string; name?: string; caption?: string };

// Blob 저장 (key는 고유하게 생성해서 전달)
export async function putImageBlob(key: string, blob: Blob) {
  await set(key, blob);
  return key;
}

// 레퍼런스 -> object URL (UI에서 사용)
export async function getImageUrlFromRef(
  ref: ImageRef
): Promise<string | null> {
  try {
    if (!ref?.idbKey) return null;
    if (ref.idbKey.startsWith("url:")) {
      // http(s) 원격 URL 은 그대로 사용
      return ref.idbKey.slice(4);
    }
    const blob = await get<Blob>(ref.idbKey);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export async function removeImageRef(ref: ImageRef) {
  if (!ref?.idbKey) return;
  if (ref.idbKey.startsWith("url:")) return; // 원격 URL은 삭제 없음
  await del(ref.idbKey);
}

// dataURL → Blob 변환
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1] || "");
  const u8 = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
  return new Blob([u8], { type: mime });
}
