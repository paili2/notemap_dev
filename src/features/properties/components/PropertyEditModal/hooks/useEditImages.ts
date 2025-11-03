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

/* ───────── 서버 연동 import (경로 정정) ───────── */
import { uploadPhotosAndGetUrls } from "@/shared/api/photoUpload";
import {
  listGroupPhotos,
  createPhotosInGroup,
  updatePhotos,
  deletePhotos as apiDeletePhotos,
} from "@/shared/api/photos";
import {
  listPhotoGroupsByPin as apiListPhotoGroupsByPin,
  createPhotoGroup as apiCreatePhotoGroup,
} from "@/shared/api/photoGroups";
import type {
  IdLike,
  PinPhoto,
  PinPhotoGroup,
} from "@/shared/api/types/pinPhotos";

/* ───────── 유틸: 파일 시그니처(디듀프 키 생성용) ───────── */
const filesSignature = (files: File[] | FileList) =>
  Array.from(files as File[])
    .map((f) => `${f.name}:${f.size}:${(f as any).lastModified ?? ""}`)
    .join("|");

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
  // 좌측 카드형(로컬 미리보기)
  const [imageFolders, setImageFolders] = useState<ImageItem[][]>([[]]);
  // 우측 세로(로컬 미리보기)
  const [verticalImages, setVerticalImages] = useState<ImageItem[]>([]);

  /* ───────── (선택) 서버 상태: 그룹/사진 목록 ───────── */
  const [groups, setGroups] = useState<PinPhotoGroup[] | null>(null);
  const [photosByGroup, setPhotosByGroup] = useState<
    Record<string, PinPhoto[]>
  >({});
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

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

      // ───────── 카드형 ─────────
      const cardRefs = initial._imageCardRefs;

      if (Array.isArray(cardRefs) && cardRefs.length > 0) {
        const hydrated = await hydrateCards(cardRefs, MAX_PER_CARD);
        if (mounted) setImageFolders(hydrated);
      } else {
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
      }

      // ───────── 세로형 ─────────
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

  /* ───────── input refs (안정화) ───────── */
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const inputRefCallbacks = useRef<
    Array<((el: HTMLInputElement | null) => void) | null>
  >([]);

  /** ref={registerImageInput(idx)} 형태로 사용할 수 있는 안정 콜백 반환 */
  const getRegisterImageInput = useCallback((idx: number) => {
    if (inputRefCallbacks.current[idx]) return inputRefCallbacks.current[idx]!;
    const cb = (el: HTMLInputElement | null) => {
      if (imageInputRefs.current[idx] === el) return;
      imageInputRefs.current[idx] = el;
    };
    inputRefCallbacks.current[idx] = cb;
    return cb;
  }, []);

  /**
   * 과거 사용 호환: ref={(el)=>registerImageInput(idx, el)} 도 지원
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

        // ref/콜백 배열도 정리
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

  /* ─────────────────────────────
   * 서버 연동 유틸(선택 호출)
   * ───────────────────────────── */

  /** pinId별 reload 디듀프 (동시 다발 호출 방지) */
  const reloadMapRef = useRef<Map<string, Promise<void>>>(new Map());

  /** pinId로 그룹+사진 전부 재로딩 → groups/photosByGroup 상태 채움 */
  const reloadGroups = useCallback(async (pinId: IdLike) => {
    const key = String(pinId);
    const existing = reloadMapRef.current.get(key);
    if (existing) return existing;

    const work = (async () => {
      setMediaLoading(true);
      setMediaError(null);
      try {
        const list = await apiListPhotoGroupsByPin(pinId);
        const mapped: Record<string, PinPhoto[]> = {};
        await Promise.all(
          (list ?? []).map(async (g) => {
            const ps = await listGroupPhotos(g.id);
            mapped[String(g.id)] = ps ?? [];
          })
        );
        setGroups(list ?? []);
        setPhotosByGroup(mapped);
      } catch (e: any) {
        setMediaError(e?.message || "사진 그룹 로딩 실패");
      } finally {
        setMediaLoading(false);
        reloadMapRef.current.delete(key);
      }
    })();

    reloadMapRef.current.set(key, work);
    return work;
  }, []);

  /** 업로드→/photos 등록 in-flight 디듀프 (그룹+파일 세트 기준) */
  const uploadInFlightRef = useRef<Map<string, Promise<PinPhoto[]>>>(new Map());

  /** 기존 그룹에 파일 업로드 → URL 획득 → /photos/:groupId 등록 */
  const uploadToGroup = useCallback(
    async (
      groupId: IdLike,
      files: File[] | FileList,
      opts?: { domain?: "map" | "contracts" | "board" | "profile" | "etc" }
    ) => {
      if (!files || Array.from(files as File[]).length === 0) return [];

      const sig = filesSignature(files);
      const key = `${String(groupId)}::${sig}`;
      const existed = uploadInFlightRef.current.get(key);
      if (existed) return existed;

      const work = (async () => {
        const urls = await uploadPhotosAndGetUrls(files, {
          domain: opts?.domain ?? "map",
        });
        if (!urls.length) return [];
        const created = await createPhotosInGroup(groupId, {
          urls,
          sortOrders: urls.map((_, i) => i),
        });
        return created;
      })();

      uploadInFlightRef.current.set(key, work);
      try {
        return await work;
      } finally {
        uploadInFlightRef.current.delete(key);
      }
    },
    []
  );

  /** 그룹 생성→업로드→등록 end-to-end 디듀프 (pinId+title+sortOrder+files) */
  const createAndUploadRef = useRef<
    Map<string, Promise<{ group: PinPhotoGroup; photos: PinPhoto[] }>>
  >(new Map());

  /** 새 그룹 생성 → 업로드 → 등록 (title/정렬 선택) */
  const createGroupAndUpload = useCallback(
    async (
      pinId: IdLike,
      title: string,
      files: File[] | FileList,
      sortOrder?: number | null
    ) => {
      const sig = files ? filesSignature(files) : "";
      const key = `${String(pinId)}::${title}::${String(
        sortOrder ?? ""
      )}::${sig}`;
      const existed = createAndUploadRef.current.get(key);
      if (existed) return existed;

      const work = (async () => {
        const group = await apiCreatePhotoGroup({
          pinId,
          title,
          sortOrder: sortOrder ?? null,
        });
        const photos = files ? await uploadToGroup(group.id, files) : [];
        return { group, photos };
      })();

      createAndUploadRef.current.set(key, work);
      try {
        return await work;
      } finally {
        createAndUploadRef.current.delete(key);
      }
    },
    [uploadToGroup]
  );

  /** 대표(커버) 지정 */
  const makeCover = useCallback(async (photoId: IdLike) => {
    await updatePhotos({ photoIds: [photoId], isCover: true });
  }, []);

  /** 정렬 변경(단건) */
  const reorder = useCallback(async (photoId: IdLike, sortOrder: number) => {
    await updatePhotos({ photoIds: [photoId], sortOrder });
  }, []);

  /** 그룹 이동(단건/여러장 모두 가능) */
  const moveToGroup = useCallback(
    async (photoIds: IdLike[], destGroupId: IdLike) => {
      await updatePhotos({ photoIds, moveGroupId: destGroupId });
    },
    []
  );

  /** 삭제(여러장) */
  const deletePhotos = useCallback(async (photoIds: IdLike[]) => {
    await apiDeletePhotos(photoIds);
  }, []);

  return {
    /* 로컬 미리보기 상태/액션 */
    imageFolders,
    verticalImages,
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

    /* 서버 상태(선택) */
    groups,
    photosByGroup,
    mediaLoading,
    mediaError,

    /* 서버 액션(선택) */
    reloadGroups,
    uploadToGroup,
    createGroupAndUpload,
    makeCover,
    reorder,
    moveToGroup,
    deletePhotos,
  };
}

export type EditImagesAPI = ReturnType<typeof useEditImages>;
