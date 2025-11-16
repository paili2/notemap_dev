"use client";

import { useMemo } from "react";
import DisplayImagesSection from "../components/DisplayImagesSection/DisplayImagesSection";
import type {
  AnyImg,
  ImagesGroup,
} from "../components/DisplayImagesSection/types";

/** 최소 표시용 타입들 */
export type DisplayImage = {
  id?: string | number;
  url?: string;
  sortOrder?: number;
  isCover?: boolean;
  caption?: string;
  name?: string;
  [k: string]: unknown;
};

export type DisplayCard = {
  id?: string | number;
  title?: string | null;
  images?: DisplayImage[];
  sortOrder?: number;
  [k: string]: unknown;
};

export type DisplayFile = {
  id?: string | number;
  url?: string;
  name?: string;
  sortOrder?: number;
  caption?: string;
  [k: string]: unknown;
};

type Props = {
  /** 가로 카드 원본(그룹) */
  cards?: unknown[];
  /** 레거시 평면 이미지(가로 폴백용) */
  images?: unknown[];
  /** 세로 카드 원본(그룹 또는 평면 배열) */
  files?: unknown[];
};

/* ---------- 유틸 ---------- */
const MAX_PER_GROUP = 20;

function sortByOrderStable<T extends { sortOrder?: number }>(arr: T[]): T[] {
  let hasOrder = false;
  for (const a of arr) {
    if (typeof a?.sortOrder === "number") {
      hasOrder = true;
      break;
    }
  }
  if (!hasOrder) return arr;
  return [...arr]
    .map((v, i) => ({ v, i }))
    .sort((a, b) => {
      const ao = a.v.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b.v.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.i - b.i;
    })
    .map((x) => x.v);
}

function toImage(x: unknown): DisplayImage {
  const o = (x ?? {}) as any;
  const n = (v: unknown) =>
    typeof v === "number"
      ? v
      : Number.isFinite(v as any)
      ? Number(v)
      : undefined;
  return {
    id: o.id ?? o.photoId ?? o.key ?? undefined,
    url: typeof o.url === "string" ? o.url : undefined,
    sortOrder: n(o.sortOrder),
    isCover: !!o.isCover,
    caption: typeof o.caption === "string" ? o.caption : undefined,
    name: typeof o.name === "string" ? o.name : undefined,
    ...o,
  };
}

function toCard(x: unknown): DisplayCard | null {
  const o = (x ?? {}) as any;
  if (!Array.isArray(o.images)) return null;

  const imgs = sortByOrderStable(o.images.map(toImage)).slice(0, MAX_PER_GROUP);
  const n = (v: unknown) =>
    typeof v === "number"
      ? v
      : Number.isFinite(v as any)
      ? Number(v)
      : undefined;

  return {
    id: o.id ?? o.groupId ?? undefined,
    // ✅ 서버/훅에서 내려준 title 그대로 사용
    title: typeof o.title === "string" ? o.title : null,
    images: imgs,
    sortOrder: n(o.sortOrder),
    ...o,
  };
}

function toFile(x: unknown): DisplayFile {
  const o = (x ?? {}) as any;
  const n = (v: unknown) =>
    typeof v === "number"
      ? v
      : Number.isFinite(v as any)
      ? Number(v)
      : undefined;
  return {
    id: o.id ?? o.fileId ?? o.key ?? undefined,
    url: typeof o.url === "string" ? o.url : undefined,
    name: typeof o.name === "string" ? o.name : undefined,
    sortOrder: n(o.sortOrder),
    caption: typeof o.caption === "string" ? o.caption : undefined,
    ...o,
  };
}

/* ---------- 컴포넌트 ---------- */
export default function DisplayImagesContainer({
  cards,
  images,
  files,
}: Props) {
  /** 0) 세로 파일 URL 집합 (가로 폴백에서 제외용) */
  const fileUrlSet = useMemo(() => {
    if (!Array.isArray(files)) return new Set<string>();
    // 그룹형({images})/평면 혼용 방어
    const urls: string[] = [];
    for (const f of files as any[]) {
      if (f && Array.isArray(f.images)) {
        for (const it of f.images) {
          const u = (it as any)?.url;
          if (typeof u === "string" && u) urls.push(u);
        }
      } else {
        const u = (f as any)?.url;
        if (typeof u === "string" && u) urls.push(u);
      }
    }
    return new Set(urls);
  }, [files]);

  /** 1) 가로 카드(그룹) */
  const safeCards = useMemo<DisplayCard[]>(() => {
    if (!Array.isArray(cards)) return [];
    const mapped = cards.map(toCard).filter(Boolean) as DisplayCard[];
    return sortByOrderStable(mapped);
  }, [cards]);

  /** 2) 레거시 평면(가로 폴백) — 세로 URL은 제외 */
  const safeImages = useMemo<DisplayImage[]>(() => {
    const base = Array.isArray(images)
      ? images.map(toImage)
      : ([] as DisplayImage[]);
    const filtered = base.filter(
      (img) => !!img.url && !fileUrlSet.has(img.url!)
    );
    return sortByOrderStable(filtered).slice(0, MAX_PER_GROUP);
  }, [images, fileUrlSet]);

  /** 3) 세로 파일을 그룹 형태로 변환 */
  const filesAsGroups = useMemo<
    { title: string | null; images: DisplayImage[] }[]
  >(() => {
    if (!Array.isArray(files) || files.length === 0) return [];
    const first: any = files[0];

    // 이미 [{ title, images }] 그룹 형태
    if (first && Array.isArray(first.images)) {
      return (files as any[])
        .map((g) => {
          const items = sortByOrderStable((g.images ?? []).map(toImage)).slice(
            0,
            MAX_PER_GROUP
          );
          if (!items.length) return null;

          const title =
            typeof g.title === "string" && g.title.trim().length > 0
              ? g.title
              : null;

          return { title, images: items };
        })
        .filter(Boolean) as { title: string | null; images: DisplayImage[] }[];
    }

    // 평면 배열 → 단일 그룹 (타이틀 없음)
    const flat = sortByOrderStable((files as unknown[]).map(toFile)).slice(
      0,
      MAX_PER_GROUP
    );
    return flat.length ? [{ title: null, images: flat }] : [];
  }, [files]);

  /** 4) 섹션 입력 형태로 변환 */
  const cardsForSection = useMemo<ImagesGroup[]>(() => {
    const groups: ImagesGroup[] = safeCards
      .map((c) => ({
        // ✅ 가로 폴더 제목
        title:
          typeof c.title === "string" && c.title.trim().length > 0
            ? c.title
            : null,
        images: (c.images ?? []).slice(0, MAX_PER_GROUP) as unknown as AnyImg[],
      }))
      .filter((g) => g.images.length > 0);

    // 가로카드가 전혀 없을 때만 레거시 폴백 사용 (세로 URL 제외된 상태)
    if (groups.length === 0 && safeImages.length > 0) {
      groups.push({
        title: null,
        images: safeImages.slice(0, MAX_PER_GROUP) as unknown as AnyImg[],
      });
    }
    return groups;
  }, [safeCards, safeImages]);

  const filesForSection = useMemo<ImagesGroup[]>(
    () =>
      filesAsGroups.map((g) => ({
        // ✅ 세로 그룹도 title 있으면 그대로 전달
        title: g.title,
        images: g.images as unknown as AnyImg[],
      })),
    [filesAsGroups]
  );

  return (
    <DisplayImagesSection
      cards={cardsForSection}
      images={undefined} // 가로 폴백은 위에서 cardsForSection에 반영
      files={filesForSection}
    />
  );
}
