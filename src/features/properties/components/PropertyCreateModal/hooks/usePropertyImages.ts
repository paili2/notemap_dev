"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_FILES, MAX_PER_CARD } from "../../constants";
import { ImageItem } from "../../../types/media";
import { putBlobToIDB } from "@/lib/imageStore";
import { makeNewImgKey } from "@/features/properties/lib/mediaKeys";

/** 업로더에서 실제 업로드에 필요하므로 ImageItem에 file을 덧붙여 보관 */
type UploaderImageItem = ImageItem & {
  file?: File; // ✅ 새로 추가
};

type SeedOpts = {
  seedFolders?: ImageItem[][];
  seedFiles?: ImageItem[];
  resetKey?: unknown;
};

export function usePropertyImages(opts?: SeedOpts) {
  // 카드형(좌)
  const [imageFolders, setImageFolders] = useState<UploaderImageItem[][]>([[]]);
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  /** 수정 모달용: 시드 주입 (기존 서버 이미지들은 file이 없을 수 있음) */
  useEffect(() => {
    if (opts?.seedFolders) {
      setImageFolders(
        opts.seedFolders.map((card) =>
          card.map((i) => ({ ...i } as UploaderImageItem))
        )
      );
    }
    if (opts?.seedFiles) {
      setFileItems(opts.seedFiles.map((i) => ({ ...i } as UploaderImageItem)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.resetKey]);

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

  /** 선택 파일을 카드에 추가 + IDB 저장 + File 보존 */
  const onPickFilesToFolder = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: UploaderImageItem[] = [];
    for (const f of Array.from(files)) {
      const key = makeNewImgKey("card");
      await putBlobToIDB(key, f);
      newItems.push({
        idbKey: key,
        url: URL.createObjectURL(f),
        name: f.name,
        file: f, // ✅ 핵심: File 보존
      });
    }

    setImageFolders((prev) => {
      const next = [...prev];
      const cur = next[idx] ?? [];
      next[idx] = [...cur, ...newItems].slice(0, MAX_PER_CARD);
      return next;
    });

    e.target.value = ""; // 같은 파일 재선택 허용
  };

  const addPhotoFolder = () => setImageFolders((prev) => [...prev, []]);
  const removePhotoFolder = (
    folderIdx: number,
    optsInner?: { keepAtLeastOne?: boolean }
  ) => {
    const keepAtLeastOne = optsInner?.keepAtLeastOne ?? true;

    setImageFolders((prev) => {
      (prev[folderIdx] ?? []).forEach((img) => {
        if (img?.url?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(img.url);
          } catch {}
        }
      });

      const next = prev.map((arr) => [...arr]);
      next.splice(folderIdx, 1);
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
  const [fileItems, setFileItems] = useState<UploaderImageItem[]>([]);

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

  /** 세로열에 추가 + File 보존 */
  const onAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const items: UploaderImageItem[] = [];
    for (const f of Array.from(files)) {
      const key = makeNewImgKey("vertical");
      await putBlobToIDB(key, f);
      items.push({
        name: f.name,
        url: URL.createObjectURL(f),
        idbKey: key,
        file: f, // ✅ 핵심: File 보존
      });
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
