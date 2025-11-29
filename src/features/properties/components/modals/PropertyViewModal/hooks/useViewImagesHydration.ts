"use client";

import { useEffect, useState } from "react";
import { hydrateRefsToMedia } from "@/lib/media/refs";

/* 🔧 그룹/사진 API */
import { listGroupPhotos } from "@/shared/api/photos";
import { listPhotoGroupsByPin } from "@/shared/api/photoGroups";

/* ───────── 타입 ───────── */
export type HydratedImg = { url: string; name: string; caption?: string };

/** 화면에서 쓰기 편한 그룹 단위 (images 키로 통일) */
export type ImagesGroup = { title?: string | null; images: HydratedImg[] };

export function useViewImagesHydration({
  open,
  data,
  pinId: pinIdArg,
}: {
  open: boolean;
  data: any;
  /** 명시적 pinId가 있으면 사용, 없으면 data에서 추정 */
  pinId?: number | string;
}) {
  /* 0) pinId 추정 — 뷰 데이터에서 가져오거나 props 우선 */
  const pinId = pinIdArg ?? data?.pinId ?? data?.id ?? null;

  /* 1) refs 있으면 IndexedDB 등에서 재-하이드레이션 */
  const [_cardsFromRefs, setCardsFromRefs] = useState<ImagesGroup[]>([]);
  const [_filesFromRefs, setFilesFromRefs] = useState<ImagesGroup[]>([]);

  useEffect(() => {
    let cancelled = false;

    const cardRefs = data?.view?._imageCardRefs ?? data?._imageCardRefs ?? null;
    const fileRefs = data?.view?._fileItemRefs ?? data?._fileItemRefs ?? null;

    if (!cardRefs && !fileRefs) {
      setCardsFromRefs([]);
      setFilesFromRefs([]);
      return;
    }

    (async () => {
      try {
        const { hydratedCards, hydratedFiles } = await hydrateRefsToMedia(
          cardRefs || [],
          fileRefs || []
        );
        if (cancelled) return;

        // hydratedCards: HydratedImg[][] → ImagesGroup[]
        const cards: ImagesGroup[] = Array.isArray(hydratedCards)
          ? hydratedCards
              .map((arr) => ({
                images: (arr ?? []) as HydratedImg[],
              }))
              .filter((g) => g.images.length)
          : [];

        // hydratedFiles: HydratedImg[] → ImagesGroup[1]
        const files: ImagesGroup[] =
          Array.isArray(hydratedFiles) && hydratedFiles.length
            ? [{ images: hydratedFiles as HydratedImg[] }]
            : [];

        setCardsFromRefs(cards);
        setFilesFromRefs(files);
      } catch (e) {
        console.warn("[useViewImagesHydration] hydrate failed:", e);
        if (!cancelled) {
          setCardsFromRefs([]);
          setFilesFromRefs([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    data?.id,
    data?._imageCardRefs,
    data?.view?._imageCardRefs,
    data?._fileItemRefs,
    data?.view?._fileItemRefs,
  ]);

  /* 2) 서버 사진 그룹/사진 조회 (열렸을 때만) — isDocument 기준으로 세로/가로 분리 */
  const [_cardsFromServer, setCardsFromServer] = useState<ImagesGroup[]>([]);
  const [_filesFromServer, setFilesFromServer] = useState<ImagesGroup[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!open || !pinId) {
      setCardsFromServer([]);
      setFilesFromServer([]);
      return;
    }

    (async () => {
      try {
        const groups = await listPhotoGroupsByPin(pinId);
        if (!groups?.length) {
          if (!cancelled) {
            setCardsFromServer([]);
            setFilesFromServer([]);
          }
          return;
        }

        const photosList = await Promise.all(
          groups.map((g) =>
            listGroupPhotos(g.id as any).catch(() => [] as any[])
          )
        );

        const serverCards: ImagesGroup[] = [];
        const serverFiles: ImagesGroup[] = [];

        // ✅ 세로 그룹 판별: isDocument만 사용
        const isVerticalGroup = (g: any) => g?.isDocument === true;

        groups.forEach((g, idx) => {
          const items = (photosList[idx] ?? []) as Array<{
            url: string;
            sortOrder?: number;
            name?: string;
            caption?: string;
          }>;

          const images = items
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((p) => ({
              url: p.url,
              name: p.name ?? "",
              ...(p.caption ? { caption: p.caption } : {}),
            })) as HydratedImg[];

          if (!images.length) return;

          const rawTitle =
            typeof (g as any)?.title === "string"
              ? (g as any).title.trim()
              : "";

          const vertical = isVerticalGroup(g);
          const title: string | undefined = rawTitle || undefined;

          const groupObj: ImagesGroup = { title, images };

          if (vertical) {
            serverFiles.push(groupObj);
          } else {
            serverCards.push(groupObj);
          }
        });

        if (!cancelled) {
          setCardsFromServer(serverCards);
          setFilesFromServer(serverFiles);
        }
      } catch (e) {
        console.warn("[useViewImagesHydration] server fetch failed:", e);
        if (!cancelled) {
          setCardsFromServer([]);
          setFilesFromServer([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, pinId]);

  /* 3) 우선순위: 서버 → refs */
  const cardsHydrated: ImagesGroup[] =
    _cardsFromServer.length > 0
      ? _cardsFromServer
      : _cardsFromRefs.length > 0
      ? _cardsFromRefs
      : [];

  const filesHydrated: ImagesGroup[] =
    _filesFromServer.length > 0
      ? _filesFromServer
      : _filesFromRefs.length > 0
      ? _filesFromRefs
      : [];

  const preferCards = cardsHydrated.length > 0;

  // 타입 호환용: 단일 배열 — 첫 카드의 images만 사용
  const legacyImagesHydrated: HydratedImg[] = cardsHydrated[0]?.images ?? [];

  return {
    preferCards,
    /** 가로 카드 그룹(제목 포함 가능) */
    cardsHydrated,
    /** 세로(파일) 카드 그룹(제목 포함 가능). 없으면 [] */
    filesHydrated,
    /** 타입 유지용 단일 배열 */
    legacyImagesHydrated,
  };
}
