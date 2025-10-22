import { getImageUrlFromRef, URL_PREFIX } from "@/lib/imageStore";
import type { AnyImageRef, ImageItem } from "@/features/properties/types/media";

type Resolved = { url: string; name: string; caption?: string };

async function resolveImageRef(u: AnyImageRef): Promise<Resolved | null> {
  if (typeof u === "string") return { url: u, name: "" };

  if (u && typeof (u as any).idbKey === "string") {
    const key = (u as any).idbKey as string;
    if (key.startsWith(URL_PREFIX)) {
      return {
        url: key.slice(URL_PREFIX.length),
        name: (u as any).name ?? "",
        ...((u as any).caption ? { caption: (u as any).caption } : {}),
      };
    }
    const url = await getImageUrlFromRef(u as any);
    if (!url) return null;
    return {
      url,
      name: (u as any).name ?? "",
      ...((u as any).caption ? { caption: (u as any).caption } : {}),
    };
  }

  if (u && typeof u === "object" && typeof (u as any).url === "string") {
    return {
      url: (u as any).url,
      name: (u as any).name ?? "",
      ...((u as any).caption ? { caption: (u as any).caption } : {}),
    };
  }
  return null;
}

/** 카드 형태의 2차원 이미지 배열을 UI용으로 수화 */
export async function hydrateCards(
  src: AnyImageRef[][],
  maxPerCard: number
): Promise<ImageItem[][]> {
  const cards = await Promise.all(
    src.map(async (card) => {
      const resolved = await Promise.all(card.map(resolveImageRef));
      const clean = resolved.filter(Boolean) as Resolved[];
      return clean.slice(0, maxPerCard).map((f) => ({
        url: f.url,
        name: f.name,
        ...(f.caption ? { caption: f.caption } : {}),
      }));
    })
  );
  return cards.length ? cards : [[]];
}

/** 1차원 배열 + 카드별 개수로 2차원 카드로 복원 */
export async function hydrateFlatUsingCounts(
  src: AnyImageRef[],
  counts: number[]
): Promise<ImageItem[][]> {
  const resolved = (await Promise.all(src.map(resolveImageRef))).filter(
    Boolean
  ) as Resolved[];
  const out: ImageItem[][] = [];
  let offset = 0;
  for (const c of counts) {
    const slice = resolved.slice(offset, offset + c);
    out.push(
      slice.map((f) => ({
        url: f.url,
        name: f.name,
        ...(f.caption ? { caption: f.caption } : {}),
      }))
    );
    offset += c;
  }
  if (offset < resolved.length) {
    out.push(
      resolved.slice(offset).map((f) => ({
        url: f.url,
        name: f.name,
        ...(f.caption ? { caption: f.caption } : {}),
      }))
    );
  }
  return out.length ? out : [[]];
}

/** 1차원 배열을 maxPerCard 덩어리로 쪼개 2차원 카드로 복원 */
export async function hydrateFlatToCards(
  src: AnyImageRef[],
  maxPerCard: number
): Promise<ImageItem[][]> {
  const resolved = (await Promise.all(src.map(resolveImageRef))).filter(
    Boolean
  ) as Resolved[];
  const cards: ImageItem[][] = [];
  for (let i = 0; i < resolved.length; i += maxPerCard) {
    cards.push(
      resolved.slice(i, i + maxPerCard).map((f) => ({
        url: f.url,
        name: f.name,
        ...(f.caption ? { caption: f.caption } : {}),
      }))
    );
  }
  return cards.length ? cards : [[]];
}

/** 세로 파일 리스트 수화 */
export async function hydrateVertical(
  src: AnyImageRef[],
  maxFiles: number
): Promise<ImageItem[]> {
  const resolved = (await Promise.all(src.map(resolveImageRef))).filter(
    Boolean
  ) as Resolved[];
  return resolved.slice(0, maxFiles).map((f) => ({
    url: f.url,
    name: f.name ?? "",
    ...(f.caption ? { caption: f.caption } : {}),
  }));
}
