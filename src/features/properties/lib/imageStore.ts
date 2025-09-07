import { get as idbGet, set as idbSet } from "idb-keyval";
import type { AnyImageRef, ImageItem } from "@/features/properties/types/media";

/** idbKey가 url:* 인 경우 외부 URL을 의미 (네트워크/데이터URL/BlobURL 아님) */
const URL_PREFIX = "url:";

/** AnyImageRef → 미리보기/렌더용 이미지 객체 */
export async function resolveImageRef(
  u: AnyImageRef
): Promise<{ url: string; name: string; caption?: string } | null> {
  if (typeof u === "string") return { url: u, name: "" };

  if (u && "idbKey" in (u as any) && typeof (u as any).idbKey === "string") {
    try {
      const key = (u as any).idbKey as string;
      if (key.startsWith(URL_PREFIX)) {
        return {
          url: key.slice(URL_PREFIX.length),
          name: (u as any).name ?? "",
          ...((u as any).caption ? { caption: (u as any).caption } : {}),
        };
      }
      const blob = await idbGet(key);
      if (!blob) return null;
      const objectUrl = URL.createObjectURL(blob);
      return {
        url: objectUrl,
        name: (u as any).name ?? "",
        ...((u as any).caption ? { caption: (u as any).caption } : {}),
      };
    } catch {
      return null;
    }
  }

  if (
    u &&
    typeof u === "object" &&
    "url" in u &&
    typeof (u as any).url === "string"
  ) {
    return {
      url: (u as any).url,
      name: (u as any).name ?? "",
      ...((u as any).caption ? { caption: (u as any).caption } : {}),
    };
  }
  return null;
}

/** 카드 형태의 2차원 이미지 배열을 UI용으로 수화 */
export async function hydrateCards(src: AnyImageRef[][], maxPerCard: number) {
  const cards = await Promise.all(
    src.map(async (card) => {
      const resolved = await Promise.all(card.map(resolveImageRef));
      const clean = resolved.filter(Boolean) as {
        url: string;
        name: string;
        caption?: string;
      }[];
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
  ) as {
    url: string;
    name: string;
    caption?: string;
  }[];
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
  ) as {
    url: string;
    name: string;
    caption?: string;
  }[];
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
  ) as {
    url: string;
    name: string;
    caption?: string;
  }[];
  return resolved.slice(0, maxFiles).map((f) => ({
    url: f.url,
    name: f.name ?? "",
    ...(f.caption ? { caption: f.caption } : {}),
  }));
}

/** 신규 생성용 키: propertyId 없이도 사용 (prop:new:...) */
export const makeNewImgKey = (scope: "card" | "vertical") =>
  `prop:new:${scope}:${crypto.randomUUID()}`;

/** 수정/기존 레코드용 키: propertyId 필요 (prop:{id}:...) */
export const makeImgKey = (propertyId: string, scope: "card" | "vertical") =>
  `prop:${propertyId}:${scope}:${crypto.randomUUID()}`;

export async function putBlobToIDB(key: string, blob: Blob) {
  await idbSet(key, blob);
}

/** 외부 URL을 idbKey 형식으로 보관하고 싶을 때 사용 (역수화 시 원본 URL로 복원) */
export const asUrlRef = (url: string) => `${URL_PREFIX}${url}`;
