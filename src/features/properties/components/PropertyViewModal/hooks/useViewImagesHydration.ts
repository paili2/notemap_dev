"use client";

import { useEffect, useMemo, useState } from "react";
import { hydrateRefsToMedia } from "@/lib/media/refs";
import { listPhotoGroupsByPin, listGroupPhotos } from "@/shared/api/photos";

type AnyImg = {
  url?: string | null;
  signedUrl?: string | null;
  publicUrl?: string | null;
  name?: string | null;
  caption?: string | null;
};
type AnyCard = AnyImg[] | { items?: AnyImg[] } | null | undefined;
type HydratedImg = { url: string; name: string; caption?: string };

function pickUrl(it: AnyImg | null | undefined): string | null {
  if (!it) return null;
  return it.url ?? it.signedUrl ?? it.publicUrl ?? null;
}

function normImg(it: AnyImg | null | undefined): HydratedImg | null {
  const u = pickUrl(it);
  if (!u) return null;
  return {
    url: u,
    name: (it?.name ?? "") || "",
    ...(it?.caption ? { caption: it.caption! } : {}),
  };
}

function normCard(card: AnyCard): HydratedImg[] {
  if (!card) return [];
  const arr = Array.isArray(card) ? card : card.items ?? [];
  return (arr ?? []).map(normImg).filter(Boolean) as HydratedImg[];
}

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
  /* 0) pinId 추정 */
  const pinId = pinIdArg ?? data?.pinId ?? data?.id ?? null;

  /* 1) 서버/레거시 스키마 정규화(로컬) */
  const normalized = useMemo(() => {
    const fromImageFolders: HydratedImg[][] = Array.isArray(data?.imageFolders)
      ? (data.imageFolders as AnyCard[]).map(normCard)
      : [];

    const legacyCardsSrc = (data?.imagesByCard ?? data?.imageCards) as
      | AnyImg[][]
      | undefined;
    const fromLegacyCards: HydratedImg[][] = Array.isArray(legacyCardsSrc)
      ? legacyCardsSrc.map(
          (card) => (card ?? []).map(normImg).filter(Boolean) as HydratedImg[]
        )
      : [];

    const fromFlat: HydratedImg[][] =
      Array.isArray(data?.images) && data.images.length
        ? [
            (data.images as string[])
              .filter(Boolean)
              .map((u) => ({ url: u, name: "" })),
          ]
        : [];

    const filesSrc = (data?.verticalImages ?? data?.fileItems) as
      | AnyImg[]
      | undefined;
    const filesHydrated: HydratedImg[] = Array.isArray(filesSrc)
      ? ((filesSrc ?? []).map(normImg).filter(Boolean) as HydratedImg[])
      : [];

    const cardsBase =
      (fromImageFolders.some((c) => c.length) && fromImageFolders) ||
      (fromLegacyCards.some((c) => c.length) && fromLegacyCards) ||
      fromFlat;

    return {
      cardsBase,
      filesBase: filesHydrated,
    };
  }, [data]);

  /* 2) refs 있으면 IndexedDB 등에서 재-하이드레이션 (저장 직후/새로고침 복원) */
  const [_cardsFromRefs, setCardsFromRefs] = useState<HydratedImg[][]>([]);
  const [_filesFromRefs, setFilesFromRefs] = useState<HydratedImg[]>([]);

  useEffect(() => {
    let cancelled = false;

    const cardRefs = data?.view?._imageCardRefs ?? data?._imageCardRefs ?? null;
    const fileRefs = data?.view?._fileItemRefs ?? data?._fileItemRefs ?? null;

    // refs가 없으면 초기화
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
        if (!cancelled) {
          setCardsFromRefs(hydratedCards || []);
          setFilesFromRefs(hydratedFiles || []);
        }
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
    // 저장 직후 refs가 바뀌면 즉시 재-하이드레이션
  }, [
    open,
    data?.id,
    data?._imageCardRefs,
    data?.view?._imageCardRefs,
    data?._fileItemRefs,
    data?.view?._fileItemRefs,
  ]);

  /* 3) 서버에서 사진 그룹/사진 조회 (열렸을 때만) */
  const [_cardsFromServer, setCardsFromServer] = useState<HydratedImg[][]>([]);
  useEffect(() => {
    let cancelled = false;
    // 열려 있고 pinId가 확인될 때만 호출
    if (!open || !pinId) {
      setCardsFromServer([]);
      return;
    }

    (async () => {
      try {
        // 그룹 목록
        const groups = await listPhotoGroupsByPin(pinId);
        if (!groups?.length) {
          if (!cancelled) setCardsFromServer([]);
          return;
        }

        // 각 그룹의 사진 병렬 조회
        const photosList = await Promise.all(
          groups.map((g) =>
            listGroupPhotos(g.id as any).catch(() => [] as any[])
          )
        );

        const serverCards: HydratedImg[][] = groups
          .map((g, idx) => {
            const items = (photosList[idx] ?? []) as Array<{
              url: string;
              sortOrder?: number;
            }>;
            return items
              .slice()
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((p) => ({
                url: p.url,
                name: "",
              }));
          })
          .filter((arr) => arr.length > 0);

        if (!cancelled) {
          setCardsFromServer(serverCards);
        }
      } catch (e) {
        console.warn("[useViewImagesHydration] server fetch failed:", e);
        if (!cancelled) setCardsFromServer([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, pinId]);

  /* 4) 우선순위: 서버 → refs → normalized */
  const cardsHydrated =
    _cardsFromServer.length > 0
      ? _cardsFromServer
      : _cardsFromRefs.length > 0
      ? _cardsFromRefs
      : normalized.cardsBase;

  const filesHydrated =
    _filesFromRefs.length > 0 ? _filesFromRefs : normalized.filesBase;

  const preferCards = cardsHydrated.length > 0;

  // Flat 이미지는 레거시 폴백용
  const legacyImagesHydrated: HydratedImg[] =
    Array.isArray(data?.images) && data.images.length
      ? (data.images as string[])
          .filter(Boolean)
          .map((u) => ({ url: u, name: "" }))
      : cardsHydrated[0] ?? [];

  return {
    preferCards,
    cardsHydrated,
    filesHydrated,
    legacyImagesHydrated,
  };
}
