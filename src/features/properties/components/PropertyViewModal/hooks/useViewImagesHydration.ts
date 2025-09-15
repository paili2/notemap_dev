"use client";

import { useEffect, useMemo, useState } from "react";
import { hydrateRefsToMedia } from "@/lib/media/refs";

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
}: {
  open: boolean;
  data: any;
}) {
  // 1) 서버/레거시 스키마 정규화
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

  // 2) refs 있으면 IndexedDB 등에서 재-하이드레이션 (저장 직후/새로고침 복원)
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
    // 🔧 저장 직후 refs가 바뀌면 즉시 재-하이드레이션되도록 의존성에 refs를 포함
  }, [
    open,
    data?.id,
    data?._imageCardRefs,
    data?.view?._imageCardRefs,
    data?._fileItemRefs,
    data?.view?._fileItemRefs,
  ]);

  // 3) 우선순위: refs 결과(있으면 우선) → normalized
  const cardsHydrated = _cardsFromRefs.length
    ? _cardsFromRefs
    : normalized.cardsBase;

  const filesHydrated = _filesFromRefs.length
    ? _filesFromRefs
    : normalized.filesBase;

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
