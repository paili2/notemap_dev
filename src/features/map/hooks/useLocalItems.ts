"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { persistToLocalStorage } from "@/features/map/utils/storage";
import { hydrateRefsToMedia } from "@/lib/media/refs";

type Opts = { storageKey: string };

// 로컬스토리지 구조: 과거 배열형/향후 버전형 둘 다 허용
type PersistShape =
  | PropertyItem[]
  | {
      v: number;
      items: PropertyItem[];
    };

function loadFromLS(key: string): PropertyItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistShape;
    if (Array.isArray(parsed)) return parsed as PropertyItem[];
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as any).items)
    ) {
      return (parsed as any).items as PropertyItem[];
    }
    return [];
  } catch {
    return [];
  }
}

export function useLocalItems({ storageKey }: Opts) {
  // 최초 로드(SSR 안전)
  const [items, setItems] = useState<PropertyItem[]>(() =>
    loadFromLS(storageKey)
  );

  // 수화(이미지/파일 참조 → 실데이터) 필요 여부 판단
  const needsHydration = useMemo(() => {
    if (!items.length) return false;
    return items.some((p) => {
      const v: any = (p as any).view ?? {};
      const cardRefs = Array.isArray(v._imageCardRefs) ? v._imageCardRefs : [];
      const fileRefs = Array.isArray(v._fileItemRefs) ? v._fileItemRefs : [];
      // 이미 수화된 경우(imageCards/fileItems)가 있으면 스킵
      const already = Array.isArray(v.imageCards) || Array.isArray(v.fileItems);
      return !already && (cardRefs.length > 0 || fileRefs.length > 0);
    });
  }, [items]);

  // 중복 수화 방지
  const hydratedOnceRef = useRef(false);

  // refs → url 수화 (마운트 직후 1회, 또는 items가 바뀌어 수화가 정말 필요할 때만)
  useEffect(() => {
    if (!needsHydration || hydratedOnceRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const next = await Promise.all(
          items.map(async (p) => {
            const v: any = (p as any).view ?? {};
            const cardRefs = Array.isArray(v._imageCardRefs)
              ? v._imageCardRefs
              : [];
            const fileRefs = Array.isArray(v._fileItemRefs)
              ? v._fileItemRefs
              : [];
            const already =
              Array.isArray(v.imageCards) || Array.isArray(v.fileItems);

            if (already || (!cardRefs.length && !fileRefs.length)) return p;

            const { hydratedCards, hydratedFiles } = await hydrateRefsToMedia(
              cardRefs,
              fileRefs
            );
            return {
              ...p,
              view: {
                ...v,
                imageCards: hydratedCards,
                images: hydratedCards.flat(), // 기존 호환 필드 유지
                fileItems: hydratedFiles,
              },
            } as PropertyItem;
          })
        );
        if (!cancelled) {
          hydratedOnceRef.current = true;
          setItems(next);
        }
      } catch {
        // 수화 실패 시 조용히 무시 (기존 동작과 동일)
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsHydration, items]);

  // 저장(에러 무시, 기존 동작 동일)
  useEffect(() => {
    try {
      // 향후 호환을 위해 버전 래핑 저장(읽기는 배열/래핑 모두 지원)
      persistToLocalStorage(storageKey, items);
      // 필요하면 이렇게도 가능: persistToLocalStorage(storageKey, { v: 1, items });
    } catch {
      // quota 초과 등은 무시
    }
  }, [storageKey, items]);

  // 편의 헬퍼(기존 API 유지 + 확장)
  const appendItem = (item: PropertyItem) =>
    setItems((prev) => [item, ...prev]);
  const updateItem = (id: string, patch: Partial<PropertyItem>) =>
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  return { items, setItems, appendItem, updateItem, removeItem };
}
