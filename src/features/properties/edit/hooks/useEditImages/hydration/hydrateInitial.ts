import type { MutableRefObject, Dispatch, SetStateAction } from "react";

import {
  hydrateCards,
  hydrateFlatToCards,
  hydrateFlatUsingCounts,
  hydrateVertical,
} from "@/features/properties/lib/media/hydrate";
import type { AnyImageRef, ImageItem } from "@/features/properties/types/media";
import { normalizeCardsInput, normalizeVerticalInput } from "./normalize";
import { dropEmptyCards } from "../utils/dropEmptyCards";
import {
  MAX_FILES,
  MAX_PER_CARD,
} from "@/features/properties/components/constants";

type InitialShape = {
  _imageCardRefs?: AnyImageRef[][];
  _fileItemRefs?: AnyImageRef[];

  imageFolders?:
    | AnyImageRef[]
    | AnyImageRef[][]
    | Record<string, AnyImageRef[]>;
  imageCards?: AnyImageRef[][] | Record<string, AnyImageRef[]>;

  images?: AnyImageRef[];
  imageCardCounts?: number[];

  verticalImages?: AnyImageRef[] | Record<string, AnyImageRef>;
  imagesVertical?: AnyImageRef[] | Record<string, AnyImageRef>;
  fileItems?: AnyImageRef[] | Record<string, AnyImageRef>;
} | null;

export async function hydrateInitial({
  initial,
  setImageFolders,
  setVerticalImages,
  hasServerHydratedRef,
  isMounted,
}: {
  initial: InitialShape | null;
  setImageFolders: Dispatch<SetStateAction<ImageItem[][]>>;
  setVerticalImages: Dispatch<SetStateAction<ImageItem[]>>;
  hasServerHydratedRef: MutableRefObject<boolean>;
  isMounted: () => boolean;
}) {
  // 🔥 initial 이 { raw, view } 형태면 view 만 뽑아서 사용
  const effectiveInitial: any =
    initial && (initial as any).view ? (initial as any).view : initial;

  if (!effectiveInitial) {
    if (hasServerHydratedRef.current) return;
    if (isMounted()) {
      setImageFolders([[]]);
      setVerticalImages([]);
    }
    return;
  }

  // 1) 카드형
  const cardRefs = effectiveInitial._imageCardRefs;
  if (Array.isArray(cardRefs) && cardRefs.length > 0) {
    if (hasServerHydratedRef.current) return;

    const safe = cardRefs.map((c: any) => (Array.isArray(c) ? c : [c]));
    const hydrated = await hydrateCards(safe, MAX_PER_CARD);

    if (isMounted()) {
      const cleaned = dropEmptyCards(hydrated);
      setImageFolders(cleaned.length ? cleaned : [[]]);
    }
  } else {
    const foldersRaw =
      normalizeCardsInput(
        effectiveInitial.imageFolders ?? effectiveInitial.imageCards
      ) ?? null;

    if (Array.isArray(foldersRaw) && foldersRaw.length > 0) {
      if (hasServerHydratedRef.current) return;

      const safe = (foldersRaw as any[]).map((c) =>
        Array.isArray(c) ? c : [c]
      );
      const hydrated = await hydrateCards(
        safe as AnyImageRef[][],
        MAX_PER_CARD
      );

      if (isMounted()) {
        const cleaned = dropEmptyCards(hydrated);
        setImageFolders(cleaned.length ? cleaned : [[]]);
      }
    } else {
      const flat =
        normalizeVerticalInput(effectiveInitial.images)?.filter(Boolean) ??
        null;
      const counts: number[] | undefined = effectiveInitial.imageCardCounts;

      if (flat && flat.length > 0) {
        if (hasServerHydratedRef.current) return;

        const hydrated =
          Array.isArray(counts) && counts.length > 0
            ? await hydrateFlatUsingCounts(flat, counts)
            : await hydrateFlatToCards(flat, MAX_PER_CARD);

        if (isMounted()) {
          const cleaned = dropEmptyCards(hydrated);
          setImageFolders(cleaned.length ? cleaned : [[]]);
        }
      } else {
        if (hasServerHydratedRef.current) return;
        if (isMounted()) setImageFolders([[]]);
      }
    }

    // 2) 세로형
    const fileRefs = effectiveInitial._fileItemRefs;
    if (Array.isArray(fileRefs) && fileRefs.length > 0) {
      if (hasServerHydratedRef.current) return;

      const hydrated = await hydrateVertical(
        fileRefs as AnyImageRef[],
        MAX_FILES
      );
      if (isMounted()) setVerticalImages(hydrated);
    } else {
      const verticalRaw =
        normalizeVerticalInput(
          effectiveInitial.verticalImages ??
            effectiveInitial.imagesVertical ??
            effectiveInitial.fileItems
        ) ?? null;

      if (Array.isArray(verticalRaw) && verticalRaw.length > 0) {
        if (hasServerHydratedRef.current) return;

        const hydrated = await hydrateVertical(
          verticalRaw as AnyImageRef[],
          MAX_FILES
        );
        if (isMounted()) setVerticalImages(hydrated);
      } else {
        if (hasServerHydratedRef.current) return;
        if (isMounted()) setVerticalImages([]);
      }
    }
  }
}
