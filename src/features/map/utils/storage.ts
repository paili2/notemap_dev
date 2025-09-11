import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { isBlobLike, isDataLike } from "@/lib/media/utils";

/** 문자열에 data:/blob: 들어가면 제거하면서 stringify */
export function safeStringify(obj: any) {
  return JSON.stringify(obj, (_k, v) => {
    if (typeof v === "string" && (isDataLike(v) || isBlobLike(v)))
      return undefined;
    return v;
  });
}

export function persistToLocalStorage(key: string, items: PropertyItem[]) {
  try {
    const json = safeStringify(items);
    window.localStorage.setItem(key, json);
  } catch (e) {
    console.warn("localStorage quota exceeded", e);
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          updatedAt: Date.now(),
          count: items.length,
        })
      );
    } catch {}
  }
}
