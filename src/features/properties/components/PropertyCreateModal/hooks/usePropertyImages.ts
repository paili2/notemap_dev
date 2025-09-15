"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_FILES, MAX_PER_CARD } from "../../constants";
import { ImageItem } from "../../../types/media";
import { putBlobToIDB } from "@/lib/imageStore";
import { makeNewImgKey } from "@/features/properties/lib/mediaKeys";

/** 이미지 카드(좌) & 세로열(우) 전부 관리 */
type SeedOpts = {
  /** 수정 모달 초기 카드 시드 */
  seedFolders?: ImageItem[][];
  /** 수정 모달 초기 세로열 시드 */
  seedFiles?: ImageItem[];
  /** 이 값이 바뀌면 시드를 다시 주입 (ex: `${open}-${data?.id}`) */
  resetKey?: unknown;
};

export function usePropertyImages(opts?: SeedOpts) {
  // 카드형(좌): 카드1, 카드2, ...
  const [imageFolders, setImageFolders] = useState<ImageItem[][]>([[]]);
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  /** 수정 모달용: 시드 주입 */
  useEffect(() => {
    if (opts?.seedFolders) setImageFolders(opts.seedFolders);
    if (opts?.seedFiles) setFileItems(opts.seedFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.resetKey]); // resetKey 바뀔 때만 재적용

  const registerImageInput = (idx: number, el: HTMLInputElement | null) => {
    imageInputRefs.current[idx] = el;
  };
  const openImagePicker = (idx: number) => imageInputRefs.current[idx]?.click();

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

  /** 선택 파일을 카드에 추가하면서 즉시 IndexedDB에 저장 */
  const onPickFilesToFolder = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: ImageItem[] = [];
    for (const f of Array.from(files)) {
      const key = makeNewImgKey("card");
      await putBlobToIDB(key, f);
      newItems.push({ idbKey: key, url: URL.createObjectURL(f), name: f.name });
    }

    setImageFolders((prev) => {
      const next = [...prev];
      const cur = next[idx] ?? [];
      next[idx] = [...cur, ...newItems].slice(0, MAX_PER_CARD);
      return next;
    });

    // 같은 파일 재선택 허용
    e.target.value = "";
  };

  const addPhotoFolder = () => setImageFolders((prev) => [...prev, []]);
  const removePhotoFolder = (
    folderIdx: number,
    optsInner?: { keepAtLeastOne?: boolean }
  ) => {
    const keepAtLeastOne = optsInner?.keepAtLeastOne ?? true;

    setImageFolders((prev) => {
      // 삭제 폴더 blob URL 정리
      (prev[folderIdx] ?? []).forEach((img) => {
        if (img?.url?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(img.url);
          } catch {}
        }
      });

      const next = prev.map((arr) => [...arr]);
      next.splice(folderIdx, 1);

      // ⬇️ input ref 인덱스도 맞춰서 삭제
      imageInputRefs.current.splice(folderIdx, 1);

      if (next.length === 0 && keepAtLeastOne) next.push([]);
      return next;
    });
  };

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

  // 세로형(우)
  const [fileItems, setFileItems] = useState<ImageItem[]>([]);

  const handleRemoveFileItem = (index: number) => {
    setFileItems((prev) => {
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

  const onAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const items: ImageItem[] = [];
    for (const f of Array.from(files)) {
      const key = makeNewImgKey("vertical");
      await putBlobToIDB(key, f);
      items.push({ name: f.name, url: URL.createObjectURL(f), idbKey: key });
    }
    setFileItems((prev) => [...prev, ...items].slice(0, MAX_FILES));
  };

  const onChangeFileItemCaption = (index: number, text: string) => {
    setFileItems((prev) =>
      prev.map((f, i) => (i === index ? { ...f, caption: text } : f))
    );
  };

  // 언마운트 시 blob URL 정리
  useEffect(() => {
    return () => {
      imageFolders.flat().forEach((f) => {
        if (f?.url?.startsWith("blob:")) URL.revokeObjectURL(f.url);
      });
      fileItems.forEach((f) => {
        if (f?.url?.startsWith("blob:")) URL.revokeObjectURL(f.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    imageFolders,
    fileItems,
    // 카드형
    registerImageInput,
    openImagePicker,
    onPickFilesToFolder,
    onChangeImageCaption,
    addPhotoFolder,
    handleRemoveImage,
    removePhotoFolder,
    // 세로형
    onAddFiles,
    onChangeFileItemCaption,
    handleRemoveFileItem,
  };
}
