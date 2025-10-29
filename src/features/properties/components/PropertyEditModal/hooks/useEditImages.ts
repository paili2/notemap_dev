"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
    // 🔹 레퍼런스 우선 (있다면 최우선 사용)
    _imageCardRefs?: AnyImageRef[][];
    _fileItemRefs?: AnyImageRef[];

    // 🔹 최신/레거시 저장 필드들
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

      // ───────────── 카드형 (레퍼런스 → 최신/레거시 → 평면) ─────────────
      const cardRefs = initial._imageCardRefs;

      if (Array.isArray(cardRefs) && cardRefs.length > 0) {
        // ✅ 1) refs 최우선
        const hydrated = await hydrateCards(cardRefs, MAX_PER_CARD);
        if (mounted) setImageFolders(hydrated);
      } else {
        // ✅ 2) 최신/레거시 2D
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
          // ✅ 3) 레거시 1D + (선택) 카드 개수
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
      }

      // ───────────── 세로형 (레퍼런스 → 최신/레거시) ─────────────
      const fileRefs = initial._fileItemRefs;
      if (Array.isArray(fileRefs) && fileRefs.length > 0) {
        const hydrated = await hydrateVertical(
          fileRefs as AnyImageRef[],
          MAX_FILES
        );
        if (mounted) setVerticalImages(hydrated);
      } else {
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
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initial]);

  /* ───────────── input refs (안정화) ─────────────
     - 동일 DOM 노드면 무시하여 불필요한 업데이트 방지
     - 인라인 콜백을 피하기 위해 인덱스별 콜백을 캐시
  */
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const inputRefCallbacks = useRef<
    Array<((el: HTMLInputElement | null) => void) | null>
  >([]);

  /** ref={registerImageInput(idx)} 형태로 사용할 수 있는 안정 콜백 반환 */
  const getRegisterImageInput = useCallback((idx: number) => {
    if (inputRefCallbacks.current[idx]) return inputRefCallbacks.current[idx]!;
    const cb = (el: HTMLInputElement | null) => {
      // 동일 참조면 아무 것도 안 함
      if (imageInputRefs.current[idx] === el) return;
      imageInputRefs.current[idx] = el;
    };
    inputRefCallbacks.current[idx] = cb;
    return cb;
  }, []);

  /**
   * 과거 사용 호환: ref={(el)=>registerImageInput(idx, el)} 도 지원
   * - el 인자가 있으면 직접 세팅
   * - el 인자가 없으면 getRegisterImageInput(idx)를 돌려줌
   */
  const registerImageInput = useCallback(
    (idx: number, el?: HTMLInputElement | null) => {
      if (arguments.length >= 2) {
        if (imageInputRefs.current[idx] !== el) {
          imageInputRefs.current[idx] = el ?? null;
        }
        return;
      }
      return getRegisterImageInput(idx);
    },
    [getRegisterImageInput]
  ) as unknown as {
    (idx: number): (el: HTMLInputElement | null) => void;
    (idx: number, el: HTMLInputElement | null): void;
  };

  /** 파일 선택창 열기 (안정 콜백) */
  const openImagePicker = useCallback(
    (idx: number) => imageInputRefs.current[idx]?.click(),
    []
  );

  // 카드형: 이미지 삭제
  const handleRemoveImage = useCallback(
    (folderIdx: number, imageIdx: number) => {
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
    },
    []
  );

  // 카드형: 캡션
  const onChangeImageCaption = useCallback(
    (folderIdx: number, imageIdx: number, text: string) => {
      setImageFolders((prev) =>
        prev.map((arr, i) =>
          i !== folderIdx
            ? arr
            : arr.map((img, j) =>
                j === imageIdx ? { ...img, caption: text } : img
              )
        )
      );
    },
    []
  );

  // 카드형: 파일 추가(IndexedDB 저장 & blob 미리보기)
  const onPickFilesToFolder = useCallback(
    async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newItems: ImageItem[] = [];
      for (const f of Array.from(files)) {
        const key = makeImgKey(propertyId, "card");
        await putBlobToIDB(key, f);
        newItems.push({
          idbKey: key,
          url: URL.createObjectURL(f),
          name: f.name,
        });
      }

      setImageFolders((prev) => {
        const next = [...prev];
        const current = next[idx] ?? [];
        next[idx] = [...current, ...newItems].slice(0, MAX_PER_CARD);
        return next;
      });

      // 같은 파일 다시 선택 가능
      e.target.value = "";
    },
    [propertyId]
  );

  // 카드형: 폴더 추가/삭제
  const addPhotoFolder = useCallback(() => {
    setImageFolders((prev) => [...prev, []]);
    // ref 콜백/실제 ref 배열도 인덱스에 맞춰 확장되므로 별도 처리 불필요
  }, []);

  const removePhotoFolder = useCallback(
    (folderIdx: number, opts?: { keepAtLeastOne?: boolean }) => {
      const keepAtLeastOne = opts?.keepAtLeastOne ?? true;

      setImageFolders((prev) => {
        // 삭제 대상 폴더의 blob URL 정리
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

        // ref/콜백 배열도 동일하게 정렬 유지
        imageInputRefs.current.splice(folderIdx, 1);
        inputRefCallbacks.current.splice(folderIdx, 1);

        if (next.length === 0 && keepAtLeastOne) next.push([]);
        return next;
      });
    },
    []
  );

  // 세로형: 삭제/추가/캡션
  const handleRemoveFileItem = useCallback((index: number) => {
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
  }, []);

  const onAddFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const items: ImageItem[] = [];
      for (const f of Array.from(files)) {
        const key = makeImgKey(propertyId, "vertical");
        await putBlobToIDB(key, f);
        items.push({ idbKey: key, url: URL.createObjectURL(f), name: f.name });
      }
      setVerticalImages((prev) => [...prev, ...items].slice(0, MAX_FILES));
    },
    [propertyId]
  );

  const onChangeFileItemCaption = useCallback((index: number, text: string) => {
    setVerticalImages((prev) =>
      prev.map((f, i) => (i === index ? { ...f, caption: text } : f))
    );
  }, []);

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
    /** ref={registerImageInput(idx)} 또는 ref={(el)=>registerImageInput(idx, el)} 모두 지원 */
    registerImageInput,
    openImagePicker,
    onPickFilesToFolder,
    addPhotoFolder,
    removePhotoFolder,
    onChangeImageCaption,
    handleRemoveImage,
    onAddFiles,
    onChangeFileItemCaption,
    handleRemoveFileItem,
  };
}

export type EditImagesAPI = ReturnType<typeof useEditImages>;
