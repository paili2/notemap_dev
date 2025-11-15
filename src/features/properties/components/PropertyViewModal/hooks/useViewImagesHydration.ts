"use client";

import { useEffect, useMemo, useState } from "react";
import { hydrateRefsToMedia } from "@/lib/media/refs";

/* 🔧 import 분리: 그룹/사진 API */
import { listGroupPhotos } from "@/shared/api/photos";
import { listPhotoGroupsByPin } from "@/shared/api/photoGroups";

/* ───────── 상수: 세로 그룹 식별 프리픽스 ───────── */
const VERT_PREFIX = "__V__";

/* ───────── 타입 ───────── */
type AnyImg = {
  url?: string | null;
  signedUrl?: string | null;
  publicUrl?: string | null;
  name?: string | null;
  caption?: string | null;
};

type AnyCard =
  | AnyImg[]
  | { title?: string | null; items?: AnyImg[]; images?: AnyImg[] }
  | null
  | undefined;

export type HydratedImg = { url: string; name: string; caption?: string };

/** 화면에서 쓰기 편한 그룹 단위 (⚠️ images 키로 통일) */
export type ImagesGroup = { title?: string | null; images: HydratedImg[] };

/* ───────── 헬퍼 ───────── */
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

/** 카드(가로/세로 공통) → {title?, images[]} 정규화 */
function normCard(card: AnyCard): ImagesGroup | null {
  if (!card) return null;

  // 객체형: { title?, items?/images? }
  if (!Array.isArray(card) && typeof card === "object") {
    const title = (card.title ?? "").toString().trim();
    const src = (Array.isArray(card.items) ? card.items : card.images) ?? [];
    const images = (src ?? []).map(normImg).filter(Boolean) as HydratedImg[];
    return images.length ? { title: title || undefined, images } : null;
  }

  // 배열형: AnyImg[]
  const images = (card as AnyImg[])
    .map(normImg)
    .filter(Boolean) as HydratedImg[];
  return images.length ? { images } : null;
}

/** AnyCard[] → ImagesGroup[] */
function normCardList(list?: AnyCard[] | null | undefined): ImagesGroup[] {
  if (!Array.isArray(list)) return [];
  return (list.map(normCard).filter(Boolean) as ImagesGroup[]).filter(
    (g) => (g?.images?.length ?? 0) > 0
  );
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

  /* 1) 서버/레거시 스키마를 우선 로컬에서 ImagesGroup 형태로 정규화 */
  const normalized = useMemo(() => {
    // 새 포맷: imageFolders: (AnyCard[])  — title 지원
    const fromImageFolders: ImagesGroup[] = normCardList(
      Array.isArray(data?.imageFolders) ? (data.imageFolders as AnyCard[]) : []
    );

    // 레거시 카드: imagesByCard | imageCards : AnyImg[][]
    const legacyCardsSrc = (data?.imagesByCard ?? data?.imageCards) as
      | AnyImg[][]
      | undefined;
    const fromLegacyCards: ImagesGroup[] = Array.isArray(legacyCardsSrc)
      ? legacyCardsSrc
          .map(
            (arr) => (arr ?? []).map(normImg).filter(Boolean) as HydratedImg[]
          )
          .filter((images) => images.length)
          .map((images) => ({ images }))
      : [];

    // 레거시 단일 배열(images:string[]) → 1개 카드로 포장
    const fromFlat: ImagesGroup[] =
      Array.isArray(data?.images) && data.images.length
        ? [
            {
              images: (data.images as string[])
                .filter(Boolean)
                .map((u) => ({ url: u, name: "" })),
            },
          ]
        : [];

    // 세로(파일) 기본값: verticalImages | fileItems
    // - 단일 배열(AnyImg[]) | 배열의 배열(AnyImg[][]) | 객체배열({title,items/images})
    let filesBase: ImagesGroup[] = [];
    const filesSrc = data?.verticalImages ?? data?.fileItems;

    if (Array.isArray(filesSrc)) {
      const first = filesSrc[0];
      if (Array.isArray(first)) {
        // AnyImg[][]
        filesBase = (filesSrc as AnyImg[][])
          .map(
            (arr) => (arr ?? []).map(normImg).filter(Boolean) as HydratedImg[]
          )
          .filter((images) => images.length)
          .map((images) => ({ images }));
      } else if (first && typeof first === "object" && !Array.isArray(first)) {
        // {title?, items?/images?}[]
        filesBase = normCardList(filesSrc as AnyCard[]);
      } else {
        // AnyImg[] (단일 세로 카드)
        const single = (filesSrc as AnyImg[])
          .map(normImg)
          .filter(Boolean) as HydratedImg[];
        filesBase = single.length ? [{ images: single }] : [];
      }
    }

    // 카드 우선순위: imageFolders → legacyCards → flat
    const cardsBase: ImagesGroup[] =
      (fromImageFolders.length && fromImageFolders) ||
      (fromLegacyCards.length && fromLegacyCards) ||
      fromFlat;

    return { cardsBase, filesBase };
  }, [data]);

  /* 2) refs 있으면 IndexedDB 등에서 재-하이드레이션 */
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
              .map((arr) => ({ images: (arr ?? []) as HydratedImg[] }))
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

  /* 3) 서버 사진 그룹/사진 조회 (열렸을 때만) — 그룹 제목 + 세로 그룹 분리 */
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

        const isVerticalGroup = (g: any) =>
          typeof g?.title === "string" && g.title.startsWith(VERT_PREFIX);

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
          const isVert = isVerticalGroup(g);
          const title = isVert
            ? rawTitle.replace(new RegExp(`^${VERT_PREFIX}`), "").trim() ||
              undefined
            : rawTitle || undefined;

          const groupObj: ImagesGroup = { title, images };

          if (isVert) {
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

  /* 4) 우선순위: 서버 → refs → normalized */
  const cardsHydrated: ImagesGroup[] =
    _cardsFromServer.length > 0
      ? _cardsFromServer
      : _cardsFromRefs.length > 0
      ? _cardsFromRefs
      : normalized.cardsBase;

  const filesHydrated: ImagesGroup[] =
    _filesFromServer.length > 0
      ? _filesFromServer
      : _filesFromRefs.length > 0
      ? _filesFromRefs
      : normalized.filesBase;

  const preferCards = cardsHydrated.length > 0;

  // 레거시 폴백(flat) — 필요 시 DisplayImagesSection에서 images로 사용
  const legacyImagesHydrated: HydratedImg[] =
    Array.isArray(data?.images) && data.images.length
      ? (data.images as string[])
          .filter(Boolean)
          .map((u) => ({ url: u, name: "" }))
      : cardsHydrated[0]?.images ?? [];

  return {
    preferCards,
    /** 가로 카드 그룹(제목 포함 가능) */
    cardsHydrated,
    /** 세로(파일) 카드 그룹(제목 포함 가능). 없으면 [] */
    filesHydrated,
    /** 레거시 단일 배열 폴백 */
    legacyImagesHydrated,
  };
}
