"use client";

import { useEffect, useRef, useState } from "react";
import { get as idbGet } from "idb-keyval";
import type { AnyImageRef } from "@/features/properties/types/media";
import { UIImg } from "../types";

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

  const resolveImageRef = async (u: AnyImageRef): Promise<UIImg | null> => {
    if (typeof u === "string") return { url: u };

    if (u && typeof u === "object") {
      // idbKey 케이스
      if ("idbKey" in (u as any) && typeof (u as any).idbKey === "string") {
        try {
          const key = (u as any).idbKey as string;
          if (key.startsWith("url:")) {
            const url = key.slice(4);
            return {
              url,
              name: (u as any).name,
              ...((u as any).caption ? { caption: (u as any).caption } : {}),
            };
          }
          const blob = await idbGet(key);
          if (!blob) return null;
          const objectUrl = URL.createObjectURL(blob);
          createdObjectUrlsRef.current.push(objectUrl);
          return {
            url: objectUrl,
            name: (u as any).name,
            ...((u as any).caption ? { caption: (u as any).caption } : {}),
          };
        } catch {
          return null;
        }
      }

      // url 케이스
      if ("url" in (u as any) && typeof (u as any).url === "string") {
        return {
          url: (u as any).url,
          name: (u as any).name,
          ...((u as any).caption ? { caption: (u as any).caption } : {}),
        };
      }
    }

    return null;
  };

  const hydrateCards = async (src: AnyImageRef[][]): Promise<UIImg[][]> => {
    const cards = await Promise.all(
      src.map(async (card) => {
        const resolved = await Promise.all(card.map(resolveImageRef));
        return resolved.filter(Boolean) as UIImg[];
      })
    );
    return cards.length ? cards : [[]];
  };

  const hydrateFlatUsingCounts = async (
    src: AnyImageRef[],
    counts: number[]
  ): Promise<UIImg[][]> => {
    const resolved = (await Promise.all(src.map(resolveImageRef))).filter(
      Boolean
    ) as UIImg[];
    const out: UIImg[][] = [];
    let offset = 0;
    for (const c of counts) {
      out.push(resolved.slice(offset, offset + c));
      offset += c;
    }
    if (offset < resolved.length) out.push(resolved.slice(offset));
    return out.length ? out : [[]];
  };

  const hydrateFlatToCards = async (
    src: AnyImageRef[],
    chunk = 20
  ): Promise<UIImg[][]> => {
    const resolved = (await Promise.all(src.map(resolveImageRef))).filter(
      Boolean
    ) as UIImg[];
    const out: UIImg[][] = [];
    for (let i = 0; i < resolved.length; i += chunk) {
      out.push(resolved.slice(i, i + chunk));
    }
    return out.length ? out : [[]];
  };

  const hydrateVertical = async (src: AnyImageRef[]): Promise<UIImg[]> => {
    const resolved = (await Promise.all(src.map(resolveImageRef))).filter(
      Boolean
    ) as UIImg[];
    return resolved;
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
        setCardsHydrated(await hydrateCards(foldersRaw as AnyImageRef[][]));
      } else if (
        flat &&
        flat.length > 0 &&
        Array.isArray(counts) &&
        counts.length > 0
      ) {
        setPreferCards(true);
        setCardsHydrated(await hydrateFlatUsingCounts(flat, counts));
      } else if (flat && flat.length > 0) {
        setPreferCards(true);
        setCardsHydrated(await hydrateFlatToCards(flat, 20));
      } else {
        setPreferCards(false);
        setCardsHydrated([[]]);
      }

      // 세로 카드: verticalImages > imagesVertical > fileItems
      const verticalRaw =
        (data as any).verticalImages ??
        (data as any).imagesVertical ??
        (data as any).fileItems ??
        (data as any)._fileItemRefs ??
        null;

      if (Array.isArray(verticalRaw) && verticalRaw.length > 0) {
        setFilesHydrated(await hydrateVertical(verticalRaw as AnyImageRef[]));
      } else {
        setFilesHydrated([]);
      }

      // 카드 소스가 전혀 없는 “레거시-only”에서만 images를 따로 뽑아둔다
      if (flat && flat.length > 0 && !Array.isArray(foldersRaw)) {
        const resolved = (await Promise.all(flat.map(resolveImageRef))).filter(
          Boolean
        ) as UIImg[];
        setLegacyImagesHydrated(resolved.map((r) => r.url));
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
