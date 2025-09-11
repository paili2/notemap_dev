"use client";

import { useEffect, useRef, useState } from "react";

import { UIImg } from "../types";
import type { AnyImageRef, ImageItem } from "@/features/properties/types/media";
import {
  hydrateCards as hydrateCardsDomain,
  hydrateFlatToCards as hydrateFlatToCardsDomain,
  hydrateFlatUsingCounts as hydrateFlatUsingCountsDomain,
  hydrateVertical as hydrateVerticalDomain,
} from "@/features/properties/lib/media/hydrate";

type UseViewImagesHydrationArgs = {
  open: boolean;
  data: any; // PropertyViewDetails 형태이지만, 레거시 키 접근 위해 any
};

export function useViewImagesHydration({
  open,
  data,
}: UseViewImagesHydrationArgs) {
  const [preferCards, setPreferCards] = useState(false);
  const [cardsHydrated, setCardsHydrated] = useState<UIImg[][]>([[]]);
  const [filesHydrated, setFilesHydrated] = useState<UIImg[]>([]);
  const [legacyImagesHydrated, setLegacyImagesHydrated] = useState<
    string[] | undefined
  >(undefined);

  // 생성된 objectURL 정리용
  const createdObjectUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      createdObjectUrlsRef.current.forEach((u) => {
        if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
      });
      createdObjectUrlsRef.current = [];
    };
  }, []);

  // ImageItem[] -> UIImg[] 로 얇은 매핑
  const toUI = (items: ImageItem[]): UIImg[] =>
    items.map(({ url, name, caption }) => ({
      url,
      ...(name ? { name } : {}),
      ...(caption ? { caption } : {}),
    }));

  // blob URL 정리 목록에 추가
  const trackBlobUrls = (urls: string[]) => {
    urls.forEach((u) => {
      if (u?.startsWith("blob:")) createdObjectUrlsRef.current.push(u);
    });
  };

  useEffect(() => {
    if (!open || !data) return;

    (async () => {
      const foldersRaw =
        (data as any).imageFolders ??
        (data as any).imagesByCard ??
        (data as any).imageCards ??
        (data as any)._imageCardRefs ??
        null;

      const flat = Array.isArray((data as any).images)
        ? ((data as any).images as AnyImageRef[])
        : null;
      const counts: number[] | undefined = (data as any).imageCardCounts;

      if (Array.isArray(foldersRaw) && foldersRaw.length > 0) {
        setPreferCards(true);
        const cards = await hydrateCardsDomain(
          foldersRaw as AnyImageRef[][],
          Number.MAX_SAFE_INTEGER // 뷰에서는 카드 내 최대치 제한 없음
        );
        const ui = cards.map(toUI);
        trackBlobUrls(ui.flat().map((x) => x.url));
        setCardsHydrated(ui);
      } else if (
        flat &&
        flat.length > 0 &&
        Array.isArray(counts) &&
        counts.length > 0
      ) {
        setPreferCards(true);
        const cards = await hydrateFlatUsingCountsDomain(flat, counts);
        const ui = cards.map(toUI);
        trackBlobUrls(ui.flat().map((x) => x.url));
        setCardsHydrated(ui);
      } else if (flat && flat.length > 0) {
        setPreferCards(true);
        const cards = await hydrateFlatToCardsDomain(flat, 20);
        const ui = cards.map(toUI);
        trackBlobUrls(ui.flat().map((x) => x.url));
        setCardsHydrated(ui);
      } else {
        setPreferCards(false);
        setCardsHydrated([[]]);
      }

      // 세로 카드: verticalImages > imagesVertical > fileItems > _fileItemRefs
      const verticalRaw =
        (data as any).verticalImages ??
        (data as any).imagesVertical ??
        (data as any).fileItems ??
        (data as any)._fileItemRefs ??
        null;

      if (Array.isArray(verticalRaw) && verticalRaw.length > 0) {
        const files = await hydrateVerticalDomain(
          verticalRaw as AnyImageRef[],
          Number.MAX_SAFE_INTEGER
        );
        const ui = toUI(files);
        trackBlobUrls(ui.map((x) => x.url));
        setFilesHydrated(ui);
      } else {
        setFilesHydrated([]);
      }

      // 카드 소스가 전혀 없는 “레거시-only”에서만 images를 따로 뽑아둔다
      if (flat && flat.length > 0 && !Array.isArray(foldersRaw)) {
        const cards = await hydrateFlatToCardsDomain(
          flat,
          Number.MAX_SAFE_INTEGER
        );
        const ui = cards.flatMap(toUI);
        trackBlobUrls(ui.map((x) => x.url));
        setLegacyImagesHydrated(ui.map((r) => r.url));
      } else {
        setLegacyImagesHydrated(undefined);
      }
    })();
  }, [open, data]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    preferCards,
    cardsHydrated,
    filesHydrated,
    legacyImagesHydrated,
  };
}
