import type { ImageItem } from "@/features/properties/types/media";
import type { ImageRef } from "@/lib/imageStore";
import { isHttpLike, isDataLike, isBlobLike } from "@/lib/media/utils";

export const okUrl = (u: string) =>
  isHttpLike(u) || isDataLike(u) || isBlobLike(u);

export const isImageRefLike = (x: any): x is ImageRef =>
  !!x && typeof x === "object" && typeof x.idbKey === "string";

export function normalizeOneImage(it: any): ImageItem | null {
  if (!it) return null;
  if (isImageRefLike(it)) return null; // ref는 여기서 제외 (표준화 단계에서만 URL 객체)
  if (typeof it === "string")
    return okUrl(it) ? { url: it, name: "", caption: "" } : null;

  if (typeof it === "object") {
    const url =
      typeof it.url === "string"
        ? it.url
        : typeof it.dataUrl === "string"
        ? it.dataUrl
        : "";
    if (!okUrl(url)) return null;
    return {
      url,
      name: typeof it.name === "string" ? it.name : "",
      caption: typeof it.caption === "string" ? it.caption : "",
      dataUrl:
        typeof (it as any).dataUrl === "string"
          ? (it as any).dataUrl
          : undefined,
    };
  }
  return null;
}

export function normalizeImages(imgs: unknown): ImageItem[] {
  if (!Array.isArray(imgs)) return [];
  return imgs.map(normalizeOneImage).filter(Boolean) as ImageItem[];
}

export function normalizeImageCards(cards: unknown): ImageItem[][] {
  if (!Array.isArray(cards)) return [];
  return cards.map((g) => normalizeImages(g)).filter((g) => g.length > 0);
}

export function flattenCards(cards: ImageItem[][]): ImageItem[] {
  const out: ImageItem[] = [];
  const seen = new Set<string>();
  for (const g of cards) {
    for (const it of g) {
      const key = (it as any).dataUrl || it.url;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}
