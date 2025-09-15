"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_FILES, MAX_PER_CARD } from "../../constants";
import type { AnyImageRef, ImageItem } from "../../../types/media";
import { makeImgKey } from "@/features/properties/lib/mediaKeys";
import { putBlobToIDB } from "@/lib/imageStore";
import {
  hydrateCards,
  hydrateFlatToCards,
  hydrateFlatUsingCounts,
  hydrateVertical,
} from "@/features/properties/lib/media/hydrate";

type UseEditImagesArgs = {
  /** 기존 데이터 id (이미지 키 prefix 용) */
  propertyId: string;
  /** 초기 데이터에서 이미지 관련 원본 필드들 */
  initial: {
    imageFolders?: AnyImageRef[][];
    imagesByCard?: AnyImageRef[][];
    imageCards?: AnyImageRef[][];
    images?: AnyImageRef[];
    imageCardCounts?: number[];
    verticalImages?: AnyImageRef[];
    imagesVertical?: AnyImageRef[];
    fileItems?: AnyImageRef[];
  } | null;
};

export function useEditImages({ propertyId, initial }: UseEditImagesArgs) {
  // 좌측 카드형
  const [imageFolders, setImageFolders] = useState<ImageItem[][]>([[]]);
  // 우측 세로
  const [verticalImages, setVerticalImages] = useState<ImageItem[]>([]);

  // 초기 하이드레이션
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!initial) {
        if (mounted) {
          setImageFolders([[]]);
          setVerticalImages([]);
        }
        return;
      }

      // 카드형
      const foldersRaw =
        initial.imageFolders ??
        initial.imagesByCard ??
        initial.imageCards ??
        null;

      if (Array.isArray(foldersRaw) && foldersRaw.length > 0) {
        const hydrated = await hydrateCards(
          foldersRaw as AnyImageRef[][],
          MAX_PER_CARD
        );
        if (mounted) setImageFolders(hydrated);
      } else {
        const flat = Array.isArray(initial.images)
          ? (initial.images as AnyImageRef[])
          : null;
        const counts: number[] | undefined = initial.imageCardCounts;

        if (flat && flat.length > 0) {
          const hydrated =
            Array.isArray(counts) && counts.length > 0
              ? await hydrateFlatUsingCounts(flat, counts)
              : await hydrateFlatToCards(flat, MAX_PER_CARD);
          if (mounted) setImageFolders(hydrated);
        } else {
          if (mounted) setImageFolders([[]]);
        }
      }

      // 세로형
      const verticalRaw =
        initial.verticalImages ??
        initial.imagesVertical ??
        initial.fileItems ??
        null;
      if (Array.isArray(verticalRaw) && verticalRaw.length > 0) {
        const hydrated = await hydrateVertical(
          verticalRaw as AnyImageRef[],
          MAX_FILES
        );
        if (mounted) setVerticalImages(hydrated);
      } else {
        if (mounted) setVerticalImages([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initial]);

  // input refs
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const registerImageInput = (idx: number, el: HTMLInputElement | null) => {
    imageInputRefs.current[idx] = el;
  };
  const openImagePicker = (idx: number) => imageInputRefs.current[idx]?.click();

  // 카드형: 이미지 삭제
  const handleRemoveImage = (folderIdx: number, imageIdx: number) => {
    setImageFolders((prev) => {
      const next = prev.map((arr) => [...arr]);
      const removed = next[folderIdx]?.splice(imageIdx, 1)?.[0];
      if (removed?.url?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(removed.url);
        } catch {}
      }
      return next;
    });
  };

  // 카드형: 캡션
  const onChangeImageCaption = (
    folderIdx: number,
    imageIdx: number,
    text: string
  ) => {
    setImageFolders((prev) =>
      prev.map((arr, i) =>
        i !== folderIdx
          ? arr
          : arr.map((img, j) =>
              j === imageIdx ? { ...img, caption: text } : img
            )
      )
    );
  };

  // 카드형: 파일 추가(IndexedDB 저장 & blob 미리보기)
  const onPickFilesToFolder = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: ImageItem[] = [];
    for (const f of Array.from(files)) {
      const key = makeImgKey(propertyId, "card");
      await putBlobToIDB(key, f);
      newItems.push({ idbKey: key, url: URL.createObjectURL(f), name: f.name });
    }

    setImageFolders((prev) => {
      const next = [...prev];
      const current = next[idx] ?? [];
      next[idx] = [...current, ...newItems].slice(0, MAX_PER_CARD);
      return next;
    });

    // 같은 파일 다시 선택 가능
    e.target.value = "";
  };

  // ✅ 카드형: 폴더(카드) 추가
  const addPhotoFolder = () => setImageFolders((prev) => [...prev, []]);

  // ✅ 카드형: 폴더(카드) 삭제
  // 기본 동작: 최소 1개의 빈 폴더는 남김(UX 안전장치)
  const removePhotoFolder = (
    folderIdx: number,
    opts?: { keepAtLeastOne?: boolean }
  ) => {
    const keepAtLeastOne = opts?.keepAtLeastOne ?? true;

    setImageFolders((prev) => {
      // 삭제 대상 폴더의 blob URL 먼저 정리
      const target = prev[folderIdx] ?? [];
      target.forEach((img) => {
        if (img?.url?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(img.url);
          } catch {}
        }
      });

      const next = prev.map((arr) => [...arr]);
      next.splice(folderIdx, 1);

      // refs도 동일한 인덱스에서 제거
      imageInputRefs.current.splice(folderIdx, 1);

      if (next.length === 0 && keepAtLeastOne) {
        next.push([]);
      }
      return next;
    });
  };

  // 세로형: 삭제
  const handleRemoveFileItem = (index: number) => {
    setVerticalImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.url?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(removed.url);
        } catch {}
      }
      return next;
    });
  };

  // 세로형: 추가
  const onAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const items: ImageItem[] = [];
    for (const f of Array.from(files)) {
      const key = makeImgKey(propertyId, "vertical");
      await putBlobToIDB(key, f);
      items.push({ idbKey: key, url: URL.createObjectURL(f), name: f.name });
    }
    setVerticalImages((prev) => [...prev, ...items].slice(0, MAX_FILES));
  };

  // 세로형: 캡션
  const onChangeFileItemCaption = (index: number, text: string) => {
    setVerticalImages((prev) =>
      prev.map((f, i) => (i === index ? { ...f, caption: text } : f))
    );
  };

  // 언마운트 시 blob URL 정리
  useEffect(() => {
    return () => {
      imageFolders.flat().forEach((f) => {
        if (f?.url?.startsWith("blob:")) URL.revokeObjectURL(f.url);
      });
      verticalImages.forEach((f) => {
        if (f?.url?.startsWith("blob:")) URL.revokeObjectURL(f.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    imageFolders,
    verticalImages,
    registerImageInput,
    openImagePicker,
    onPickFilesToFolder,
    addPhotoFolder,
    /** ✅ 새로 추가됨 */
    removePhotoFolder,
    onChangeImageCaption,
    handleRemoveImage,
    onAddFiles,
    onChangeFileItemCaption,
    handleRemoveFileItem,
  };
}

export type EditImagesAPI = ReturnType<typeof useEditImages>;
