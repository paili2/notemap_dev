"use client";

import { useMemo } from "react";
import DisplayImagesSection from "../components/DisplayImagesSection/DisplayImagesSection";
import type { AnyImg } from "../components/DisplayImagesSection/types";

/** 최소 표시용 타입 (필요 시 확장 가능) */
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

/** 개별 파일(세로 리스트용) */
export type DisplayFile = {
  id?: string | number;
  url?: string;
  name?: string;
  sortOrder?: number;
  caption?: string;
  [k: string]: unknown;
};

type Props = {
  /** 카드(그룹) 배열 – 상위에서 가공되어 내려온다고 가정 (객체 배열 또는 AnyImg[][] 모두 허용) */
  cards?: unknown[];
  /** 평면 이미지 배열 (옵션) */
  images?: unknown[];
  /** 세로 파일/개별 파일 배열 (옵션) */
  files?: unknown[];
};

/* ─────────────────────────────────────────
 * 유틸
 * ───────────────────────────────────────── */

/** sortOrder 정렬 유틸 (없으면 원래 순서 유지, 안정 정렬) */
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

const numOrUndef = (v: unknown) =>
  typeof v === "number" ? v : Number.isFinite(v as any) ? Number(v) : undefined;

/** url | signedUrl | publicUrl 우선순위 */
function pickUrlLike(o: any): string | undefined {
  if (!o) return undefined;
  if (typeof o.url === "string" && o.url) return o.url;
  if (typeof o.signedUrl === "string" && o.signedUrl) return o.signedUrl;
  if (typeof o.publicUrl === "string" && o.publicUrl) return o.publicUrl;
  return undefined;
}

/** 얕은 정규화: unknown → DisplayImage */
function toImage(x: unknown): DisplayImage {
  const o = (x ?? {}) as any;
  const url = pickUrlLike(o);

  return {
    id: o.id ?? o.photoId ?? o.key ?? undefined,
    url,
    sortOrder: numOrUndef(o.sortOrder),
    isCover: !!o.isCover,
    caption:
      typeof o.caption === "string"
        ? o.caption
        : typeof o.alt === "string"
        ? o.alt
        : undefined,
    name: typeof o.name === "string" ? o.name : undefined,
    // 필요한 원본 필드가 있을 수 있으니 마지막에 얕게 병합
    ...o,
  };
}

/** 얕은 정규화: unknown → DisplayCard (배열 형태도 지원) */
function toCard(x: unknown): DisplayCard {
  // ① 카드가 이미지 배열(AnyImg[])로 주어지는 경우(HydratedImg[][])
  if (Array.isArray(x)) {
    const images = sortByOrderStable((x as unknown[]).map(toImage));
    return {
      id: undefined,
      title: null,
      images,
      sortOrder: undefined,
    };
  }

  // ② 일반 카드 객체 형태
  const o = (x ?? {}) as any;
  const rawImages: unknown[] = Array.isArray(o.images) ? o.images : [];
  const images = sortByOrderStable(rawImages.map(toImage));

  return {
    id: o.id ?? o.groupId ?? undefined,
    title:
      typeof o.title === "string"
        ? o.title
        : typeof o.name === "string"
        ? o.name
        : null,
    images,
    sortOrder: numOrUndef(o.sortOrder),
    ...o,
  };
}

/** 얕은 정규화: unknown → DisplayFile */
function toFile(x: unknown): DisplayFile {
  const o = (x ?? {}) as any;
  const url = pickUrlLike(o);

  return {
    id: o.id ?? o.fileId ?? o.key ?? undefined,
    url,
    name: typeof o.name === "string" ? o.name : undefined,
    sortOrder: numOrUndef(o.sortOrder),
    caption:
      typeof o.caption === "string"
        ? o.caption
        : typeof o.alt === "string"
        ? o.alt
        : undefined,
    ...o,
  };
}

/* ─────────────────────────────────────────
 * 컴포넌트
 * ───────────────────────────────────────── */

export default function DisplayImagesContainer({
  cards,
  images,
  files,
}: Props) {
  // 1) 카드 객체 정규화 & 정렬 (객체 배열/배열의 배열 모두 허용)
  const safeCards = useMemo<DisplayCard[]>(
    () =>
      sortByOrderStable(
        Array.isArray(cards) ? cards.map(toCard) : ([] as DisplayCard[])
      ),
    [cards]
  );

  // 2) 평면 이미지 정규화 & 정렬
  const safeImages = useMemo<DisplayImage[]>(
    () =>
      sortByOrderStable(
        Array.isArray(images) ? images.map(toImage) : ([] as DisplayImage[])
      ),
    [images]
  );

  // 3) 파일(세로) 정규화 & 정렬
  const safeFiles = useMemo<DisplayFile[]>(
    () =>
      sortByOrderStable(
        Array.isArray(files) ? files.map(toFile) : ([] as DisplayFile[])
      ),
    [files]
  );

  // 4) DisplayImagesSection이 기대하는 형태로 변환
  //    - cards: AnyImg[][]  (각 카드의 images 배열만 전달)
  //    - images: AnyImg[]   (그대로)
  //    - files: AnyImg[]    (그대로)
  const cardsForSection = useMemo<AnyImg[][]>(
    () =>
      safeCards
        .map((c) => (Array.isArray(c.images) ? (c.images as AnyImg[]) : []))
        .filter((g) => g.length > 0),
    [safeCards]
  );

  const imagesForSection = safeImages as unknown as AnyImg[];
  const filesForSection = safeFiles as unknown as AnyImg[];

  return (
    <DisplayImagesSection
      cards={cardsForSection}
      images={imagesForSection}
      files={filesForSection}
    />
  );
}
