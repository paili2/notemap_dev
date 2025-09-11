"use client";

import { useEffect, useState } from "react";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { persistToLocalStorage } from "@/features/map/utils/storage";
import { hydrateRefsToMedia } from "@/lib/media/refs";

type Opts = { storageKey: string };

export function useLocalItems({ storageKey }: Opts) {
  const [items, setItems] = useState<PropertyItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as PropertyItem[]) : [];
    } catch {
      return [];
    }
  });

  // refs → url 수화
  useEffect(() => {
    (async () => {
      if (!items.length) return;
      // 이미 수화된 아이템은 스킵: 첫 그룹에 url이 있으면 스킵
      const needHydrate = items.some((p) => {
        const v: any = (p as any).view ?? {};
        const cardRefs = Array.isArray(v._imageCardRefs)
          ? v._imageCardRefs
          : [];
        const fileRefs = Array.isArray(v._fileItemRefs) ? v._fileItemRefs : [];
        return cardRefs.length || fileRefs.length;
      });
      if (!needHydrate) return;

      const hydrated = await Promise.all(
        items.map(async (p) => {
          const v: any = (p as any).view ?? {};
          const cardRefs = Array.isArray(v._imageCardRefs)
            ? v._imageCardRefs
            : [];
          const fileRefs = Array.isArray(v._fileItemRefs)
            ? v._fileItemRefs
            : [];
          if (!cardRefs.length && !fileRefs.length) return p;

          const { hydratedCards, hydratedFiles } = await hydrateRefsToMedia(
            cardRefs,
            fileRefs
          );
          return {
            ...p,
            view: {
              ...v,
              imageCards: hydratedCards,
              images: hydratedCards.flat(),
              fileItems: hydratedFiles,
            },
          } as PropertyItem;
        })
      );
      setItems(hydrated);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 저장
  useEffect(() => {
    persistToLocalStorage(storageKey, items);
  }, [storageKey, items]);

  return { items, setItems };
}
