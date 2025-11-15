"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ChangeEvent } from "react";
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

/* ───────── 서버 연동 import ───────── */
import {
  listGroupPhotos,
  createPhotosInGroup,
  batchPatchPhotoGroups,
  batchPatchPhotos,
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

/* ───────── 상수: 세로 그룹 식별 프리픽스 ───────── */
const VERT_PREFIX = "__V__";

/* ───────── 유틸: 파일 시그니처 ───────── */
const filesSignature = (files: File[] | FileList) =>
  Array.from(files as File[])
    .map((f) => `${f.name}:${f.size}:${(f as any).lastModified ?? ""}`)
    .join("|");

/* ───────── 유틸: 서버 photoId 추출 ───────── */
function getServerPhotoId(
  item?: Partial<ImageItem> | null
): IdLike | undefined {
  if (!item) return undefined as any;
  const cand =
    (item as any)?.id ??
    (item as any)?.photoId ??
    (item as any)?.serverId ??
    (item as any)?.pinPhotoId;
  if (cand === 0 || !!cand) return cand as IdLike;
  return undefined as any;
}

/* ───────── 입력 정규화(옵션) ───────── */
function looksLikeImageRef(v: any): boolean {
  if (!v || typeof v !== "object") return false;
  return (
    typeof (v as any).url === "string" ||
    typeof (v as any).idbKey === "string" ||
    typeof (v as any).id === "number" ||
    typeof (v as any).id === "string"
  );
}

/** imageFolders 후보(any)를 AnyImageRef[][] 로 정규화 */
function normalizeCardsInput(v: any): AnyImageRef[][] | null {
  if (!v) return null;
  if (Array.isArray(v) && v.every((x) => Array.isArray(x)))
    return v as AnyImageRef[][];
  if (Array.isArray(v) && v.some(looksLikeImageRef))
    return [v as AnyImageRef[]];
  if (typeof v === "object") {
    const entries = Object.entries(v)
      .filter(([k]) => /^\d+$/.test(k))
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([, val]) => val)
      .filter((arr) => Array.isArray(arr));
    if (entries.length > 0) return entries as AnyImageRef[][];
    if (looksLikeImageRef(v)) return [[v as AnyImageRef]];
  }
  return null;
}

/** verticalImages 후보(any)를 AnyImageRef[] 로 정규화 */
function normalizeVerticalInput(v: any): AnyImageRef[] | null {
  if (!v) return null;
  if (Array.isArray(v) && v.length && v.every(looksLikeImageRef))
    return v as AnyImageRef[];
  if (typeof v === "object") {
    const numKeyVals = Object.entries(v)
      .filter(([k]) => /^\d+$/.test(k))
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([, val]) => val);
    if (numKeyVals.length && numKeyVals.every(looksLikeImageRef)) {
      return numKeyVals as AnyImageRef[];
    }
    if (looksLikeImageRef(v)) return [v as AnyImageRef];
  }
  return null;
}

/* ───────── 빈 카드 제거 ───────── */
const dropEmptyCards = (cards: ImageItem[][]) =>
  (cards ?? []).filter(
    (card) => Array.isArray(card) && card.some((it) => !!(it as any)?.url)
  );

type UseEditImagesArgs = {
  propertyId: string;
  initial: {
    _imageCardRefs?: AnyImageRef[][];
    _fileItemRefs?: AnyImageRef[];
    imageFolders?:
      | AnyImageRef[]
      | AnyImageRef[][]
      | Record<string, AnyImageRef[]>;
    /** ✅ imagesByCard는 더 이상 사용하지 않음(레거시 제거) */
    imageCards?: AnyImageRef[][] | Record<string, AnyImageRef[]>;
    images?: AnyImageRef[];
    imageCardCounts?: number[];
    verticalImages?: AnyImageRef[] | Record<string, AnyImageRef>;
    imagesVertical?: AnyImageRef[] | Record<string, AnyImageRef>;
    fileItems?: AnyImageRef[] | Record<string, AnyImageRef>;
  } | null;
};

export function useEditImages({ propertyId, initial }: UseEditImagesArgs) {
  /* ───────── 좌측 카드형(로컬 미리보기) ───────── */
  const [imageFolders, setImageFolders] = useState<ImageItem[][]>([[]]);
  /* ───────── 우측 세로(로컬 미리보기) ───────── */
  const [verticalImages, setVerticalImages] = useState<ImageItem[]>([]);

  /* ───────── (선택) 서버 상태: 그룹/사진 목록 ───────── */
  const [groups, setGroups] = useState<PinPhotoGroup[] | null>(null);
  const [photosByGroup, setPhotosByGroup] = useState<
    Record<string, PinPhoto[]>
  >({});
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const hasServerHydratedRef = useRef(false);

  /* ✅ groups 최신값을 항상 참조하기 위한 ref */
  const groupsRef = useRef<PinPhotoGroup[] | null>(null);
  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  /* ✅ 이미지 상태도 언마운트에서 최신값을 보게 하기 위한 ref */
  const imageFoldersRef = useRef<ImageItem[][]>([]);
  const verticalImagesRef = useRef<ImageItem[]>([]);
  useEffect(() => {
    imageFoldersRef.current = imageFolders;
  }, [imageFolders]);
  useEffect(() => {
    verticalImagesRef.current = verticalImages;
  }, [verticalImages]);

  /* ───────── 초기 하이드레이션 ───────── */
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!initial) {
        if (hasServerHydratedRef.current) return;
        if (mounted) {
          setImageFolders([[]]);
          setVerticalImages([]);
        }
        return;
      }

      // ───── 카드형 ─────
      const cardRefs = initial._imageCardRefs;
      if (Array.isArray(cardRefs) && cardRefs.length > 0) {
        if (hasServerHydratedRef.current) return;
        const safe = cardRefs.map((c: any) => (Array.isArray(c) ? c : [c]));
        const hydrated = await hydrateCards(safe, MAX_PER_CARD);
        if (mounted) {
          const cleaned = dropEmptyCards(hydrated);
          setImageFolders(cleaned.length ? cleaned : [[]]);
        }
      } else {
        const foldersRaw =
          normalizeCardsInput(initial.imageFolders ?? initial.imageCards) ??
          null;

        if (Array.isArray(foldersRaw) && foldersRaw.length > 0) {
          if (hasServerHydratedRef.current) return;
          const safe = (foldersRaw as any[]).map((c) =>
            Array.isArray(c) ? c : [c]
          );
          const hydrated = await hydrateCards(
            safe as AnyImageRef[][],
            MAX_PER_CARD
          );
          if (mounted) {
            const cleaned = dropEmptyCards(hydrated);
            setImageFolders(cleaned.length ? cleaned : [[]]);
          }
        } else {
          const flat =
            normalizeVerticalInput(initial.images)?.filter(Boolean) ?? null; // 레거시 images → 가로 카드로
          const counts: number[] | undefined = initial.imageCardCounts;

          if (flat && flat.length > 0) {
            if (hasServerHydratedRef.current) return;
            const hydrated =
              Array.isArray(counts) && counts.length > 0
                ? await hydrateFlatUsingCounts(flat, counts)
                : await hydrateFlatToCards(flat, MAX_PER_CARD);
            if (mounted) {
              const cleaned = dropEmptyCards(hydrated);
              setImageFolders(cleaned.length ? cleaned : [[]]);
            }
          } else {
            if (hasServerHydratedRef.current) return;
            if (mounted) setImageFolders([[]]);
          }
        }

        // ───── 세로형 ─────
        const fileRefs = initial._fileItemRefs;
        if (Array.isArray(fileRefs) && fileRefs.length > 0) {
          if (hasServerHydratedRef.current) return;
          const hydrated = await hydrateVertical(
            fileRefs as AnyImageRef[],
            MAX_FILES
          );
          if (mounted) setVerticalImages(hydrated);
        } else {
          const verticalRaw =
            normalizeVerticalInput(
              initial.verticalImages ??
                initial.imagesVertical ??
                initial.fileItems
            ) ?? null;

          if (Array.isArray(verticalRaw) && verticalRaw.length > 0) {
            if (hasServerHydratedRef.current) return;
            const hydrated = await hydrateVertical(
              verticalRaw as AnyImageRef[],
              MAX_FILES
            );
            if (mounted) setVerticalImages(hydrated);
          } else {
            if (hasServerHydratedRef.current) return;
            if (mounted) setVerticalImages([]);
          }
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

  const getRegisterImageInput = useCallback((idx: number) => {
    if (inputRefCallbacks.current[idx]) return inputRefCallbacks.current[idx]!;
    const cb = (el: HTMLInputElement | null) => {
      if (imageInputRefs.current[idx] === el) return;
      imageInputRefs.current[idx] = el;
    };
    inputRefCallbacks.current[idx] = cb;
    return cb;
  }, []);

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

  const openImagePicker = useCallback(
    (idx: number) => imageInputRefs.current[idx]?.click(),
    []
  );

  /* ───────── 변경 의도 큐 ───────── */
  type PendingGroupChange = {
    id: IdLike;
    title?: string | null;
    sortOrder?: number | null;
  };
  type PendingPhotoChange = {
    id: IdLike;
    caption?: string | null;
    groupId?: IdLike | null;
    sortOrder?: number | null;
    isCover?: boolean | null;
    name?: string | null;
  };
  const pendingGroupMap = useRef<Map<string, PendingGroupChange>>(new Map());
  const pendingPhotoMap = useRef<Map<string, PendingPhotoChange>>(new Map());
  const pendingDeleteSet = useRef<Set<string>>(new Set());

  // ✅ 서버 아이디가 있으면 삭제 큐에 적재
  const queueDeleteIfServer = (item?: ImageItem) => {
    const id = getServerPhotoId(item);
    if (id != null) pendingDeleteSet.current.add(String(id));
  };

  const queuePhotoCaption = useCallback(
    (photoId: IdLike, text: string | null) => {
      const key = String(photoId);
      const prev = pendingPhotoMap.current.get(key) ?? { id: photoId };
      pendingPhotoMap.current.set(key, { ...prev, caption: text ?? null });
    },
    []
  );
  const queuePhotoSort = useCallback(
    (photoId: IdLike, sortOrder: number | null) => {
      const key = String(photoId);
      const prev = pendingPhotoMap.current.get(key) ?? { id: photoId };
      pendingPhotoMap.current.set(key, { ...prev, sortOrder });
    },
    []
  );
  const queuePhotoMove = useCallback(
    (photoId: IdLike, destGroupId: IdLike | null) => {
      const key = String(photoId);
      const prev = pendingPhotoMap.current.get(key) ?? { id: photoId };
      pendingPhotoMap.current.set(key, { ...prev, groupId: destGroupId });
    },
    []
  );

  const onChangeImageCaption = useCallback(
    (folderIdx: number, imageIdx: number, text: string) => {
      let target: ImageItem | undefined;

      setImageFolders((prev) => {
        const next = prev.map((arr, i) => {
          if (i !== folderIdx) return arr;
          return arr.map((img, j) => {
            if (j !== imageIdx) return img;
            const updated = { ...img, caption: text };
            target = updated;
            return updated;
          });
        });

        // 여기서 바로 서버 큐 처리까지
        const pid = getServerPhotoId(target);
        if (pid != null) queuePhotoCaption(pid, text ?? null);

        return next;
      });
    },
    [queuePhotoCaption]
  );

  /* ─────────────────────────────
   * 서버 연동 유틸 (※ 순서 중요: reloadGroups를 먼저 선언)
   * ───────────────────────────── */

  /** pinId별 reload 디듀프 */
  const reloadMapRef = useRef<Map<string, Promise<void>>>(new Map());

  /** pinId로 그룹+사진 전부 재로딩 (세로/가로 분리) */
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
        groupsRef.current = list ?? [];
        setPhotosByGroup(mapped);

        hasServerHydratedRef.current = true;

        const isVerticalGroup = (g: any) =>
          typeof g?.title === "string" && g.title.startsWith(VERT_PREFIX);

        const horizGroups = (list ?? []).filter((g) => !isVerticalGroup(g));
        const vertGroups = (list ?? []).filter(isVerticalGroup);

        const folders: ImageItem[][] = horizGroups
          .slice()
          .sort(
            (a, b) =>
              (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
              String(a.title ?? "").localeCompare(String(b.title ?? ""))
          )
          .map((g) =>
            (mapped[String(g.id)] ?? [])
              .slice()
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((p) => {
                const caption =
                  (p as any).caption ??
                  (p as any).title ??
                  (p as any).name ??
                  "";
                return {
                  id: p.id as any,
                  url: p.url,
                  caption,
                  name: (p as any).name ?? "",
                } as ImageItem;
              })
          );

        const cleaned = dropEmptyCards(folders);

        const verticalFlat: ImageItem[] = vertGroups
          .slice()
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .flatMap((g) =>
            (mapped[String(g.id)] ?? [])
              .slice()
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((p) => {
                const caption =
                  (p as any).caption ??
                  (p as any).title ??
                  (p as any).name ??
                  "";
                return {
                  id: p.id as any,
                  url: p.url,
                  caption,
                  name: (p as any).name ?? "",
                } as ImageItem;
              })
          );

        // 🔥 여기서 로컬 변경 여부 체크
        const hasPendingLocal =
          pendingGroupMap.current.size > 0 ||
          pendingPhotoMap.current.size > 0 ||
          pendingDeleteSet.current.size > 0;

        // ❗로컬 변경이 없을 때만 서버 상태로 UI를 덮어씀
        if (!hasPendingLocal) {
          setImageFolders(cleaned.length ? cleaned : [[]]);
          setVerticalImages(verticalFlat);
        }
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

  /** 업로드→/photos 등록 in-flight 디듀프 */
  const uploadInFlightRef = useRef<Map<string, Promise<PinPhoto[]>>>(new Map());

  /** 기존 그룹에 파일 업로드 → URL → 등록 */
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
        const { uploadPhotosAndGetUrls } = await import(
          "@/shared/api/photoUpload"
        );
        const urls = await uploadPhotosAndGetUrls(files, {
          domain: opts?.domain ?? "map",
        });
        if (!urls.length) return [];
        const created = await createPhotosInGroup(groupId, {
          urls,
          sortOrders: urls.map((_, i: number) => i),
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

  /** 그룹 생성 → 업로드 → 등록 end-to-end 디듀프 */
  const createAndUploadRef = useRef<
    Map<string, Promise<{ group: PinPhotoGroup; photos: PinPhoto[] }>>
  >(new Map());

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

  /* ───────── 파일 추가/삭제(카드형) ───────── */

  // 수평(카드)용 그룹만 정렬해서 반환
  const getHorizGroupsSorted = (list: PinPhotoGroup[]) =>
    list
      .filter(
        (g) => !(typeof g.title === "string" && g.title.startsWith(VERT_PREFIX))
      )
      .slice()
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          String(a.title ?? "").localeCompare(String(b.title ?? ""))
      );

  // 폴더 인덱스와 매칭되는 서버 그룹을 보장(없으면 생성)
  const ensureFolderGroup = useCallback(
    async (pinId: IdLike, folderIdx: number) => {
      // 서버 상태 최신화 (디듀프됨)
      await reloadGroups(pinId);
      const list = (groupsRef.current ?? []) as PinPhotoGroup[];
      const horiz = getHorizGroupsSorted(list);
      const existing = horiz[folderIdx];
      if (existing) return existing;

      const title = `사진 폴더 ${folderIdx + 1}`;
      const sortOrder = folderIdx;
      const group = await apiCreatePhotoGroup({ pinId, title, sortOrder });
      return group;
    },
    [reloadGroups]
  );

  // 카드형: 파일 추가 → (1) 로컬 프리뷰에 즉시 추가 → (2) 서버 업로드 후 교체
  const onPickFilesToFolder = useCallback(
    async (idx: number, e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // 0) FileList를 배열로
      const fileArr = Array.from(files);

      // 1) 로컬 프리뷰용 임시 아이템 먼저 추가 (id는 안 줌: 순수 로컬)
      const tempItems: ImageItem[] = fileArr.map((f) => ({
        file: f,
        name: f.name,
      }));

      // 이 폴더에 몇 개 임시를 추가했는지 보관 (나중에 교체용)
      const tempCount = tempItems.length;

      setImageFolders((prev) =>
        prev.map((folder, i) =>
          i === idx ? [...folder, ...tempItems].slice(0, MAX_PER_CARD) : folder
        )
      );

      try {
        // 2) 폴더 인덱스에 해당하는 서버 그룹 확보(없으면 생성)
        const group = await ensureFolderGroup(propertyId, idx);

        // 3) 업로드 + /photos 등록 (서버에 저장)
        const created = await uploadToGroup(group.id, fileArr, {
          domain: "map",
        });

        // 4) 서버 메모리 상태(groups / photosByGroup) 갱신
        setGroups((prev) => {
          if (!prev) return [group];
          const list = [...prev];
          const i = list.findIndex((g) => String(g.id) === String(group.id));
          if (i >= 0) {
            list[i] = { ...list[i] };
          } else {
            list.push(group);
          }
          return list;
        });

        setPhotosByGroup((prev) => {
          const key = String(group.id);
          const existing = prev?.[key] ?? [];
          return {
            ...prev,
            [key]: [...existing, ...(created ?? [])],
          };
        });

        // 5) 서버에서 받은 항목들로, 방금 추가한 임시 아이템들을 교체
        const newItems: ImageItem[] =
          (created ?? []).map((p) => {
            const anyP: any = p;
            const caption = anyP.caption ?? anyP.title ?? anyP.name ?? "";
            return {
              id: p.id as any,
              url: p.url,
              name: anyP.name ?? "",
              caption,
            } as ImageItem;
          }) ?? [];

        setImageFolders((prev) =>
          prev.map((folder, i) => {
            if (i !== idx) return folder;

            // 뒤에서 tempCount 개를 교체한다고 가정
            const baseLen = Math.max(0, folder.length - tempCount);
            const base = folder.slice(0, baseLen);
            return [...base, ...newItems].slice(0, MAX_PER_CARD);
          })
        );
      } finally {
        // 같은 파일 다시 선택 가능하도록 초기화
        e.target.value = "";
      }
    },
    [propertyId, ensureFolderGroup, uploadToGroup]
  );

  // 카드형: 폴더 추가/삭제
  const addPhotoFolder = useCallback(() => {
    setImageFolders((prev) => [...prev, []]);
  }, []);
  const removePhotoFolder = useCallback(
    (folderIdx: number, opts?: { keepAtLeastOne?: boolean }) => {
      const keepAtLeastOne = opts?.keepAtLeastOne ?? true;

      setImageFolders((prev) => {
        const target = prev[folderIdx] ?? [];

        // ✅ 폴더 안 서버 사진들 삭제 큐 적재
        target.forEach((img) => queueDeleteIfServer(img));

        // blob URL 정리
        target.forEach((img) => {
          if (img?.url?.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(img.url);
            } catch {}
          }
        });

        const next = prev.map((arr) => [...arr]);
        next.splice(folderIdx, 1);

        if (next.length === 0 && keepAtLeastOne) next.push([]);
        return next;
      });
    },
    []
  );

  // 카드형: 이미지 삭제(로컬 상태 + 서버 삭제 큐)
  const handleRemoveImage = useCallback(
    (folderIdx: number, imageIdx: number) => {
      setImageFolders((prev) => {
        const next = prev.map((arr) => [...arr]);
        const removed = next[folderIdx]?.splice(imageIdx, 1)?.[0];

        // ✅ 서버 사진이면 삭제 큐
        queueDeleteIfServer(removed);

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

  /* ───────── 세로형: 삭제/추가/캡션 ───────── */

  // 세로형: 개별 삭제(로컬 상태 + 서버 삭제 큐)
  const handleRemoveFileItem = useCallback((index: number) => {
    setVerticalImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);

      // ✅ 서버 사진이면 삭제 큐
      queueDeleteIfServer(removed);

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
      // ⚠️ 세로형은 기존 동작 유지(원하면 즉시 업로드 방식으로도 변경 가능)
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

  const onChangeFileItemCaption = useCallback(
    (index: number, text: string) => {
      let target: ImageItem | undefined;

      setVerticalImages((prev) => {
        const next = prev.map((f, i) => {
          if (i !== index) return f;
          const updated = { ...f, caption: text };
          target = updated;
          return updated;
        });

        const pid = getServerPhotoId(target);
        if (pid != null) queuePhotoCaption(pid, text ?? null);

        return next;
      });
    },
    [queuePhotoCaption]
  );

  // ✅ 언마운트 시 blob URL 정리 (최신 상태를 ref에서 조회)
  useEffect(() => {
    return () => {
      imageFoldersRef.current.flat().forEach((f) => {
        if (f?.url?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(f.url);
          } catch {}
        }
      });
      verticalImagesRef.current.forEach((f) => {
        if (f?.url?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(f.url);
          } catch {}
        }
      });
    };
  }, []);

  /** 변경 여부 빠르게 확인 */
  const hasImageChanges = useCallback(() => {
    return (
      pendingGroupMap.current.size > 0 ||
      pendingPhotoMap.current.size > 0 ||
      pendingDeleteSet.current.size > 0
    );
  }, []);

  /**
   * 저장 시 호출: 지금까지의 사진 변경을 모두 커밋
   * @returns boolean - 실제로 네트워크 커밋이 있었으면 true, 없으면 false
   */
  const commitImageChanges = useCallback(async (): Promise<boolean> => {
    const groupChanges = Array.from(pendingGroupMap.current.values());
    const photoChanges = Array.from(pendingPhotoMap.current.values());
    const deleteIds = Array.from(pendingDeleteSet.current.values());

    // 네트워크 호출 필요 없으면 바로 false
    if (
      groupChanges.length === 0 &&
      photoChanges.length === 0 &&
      deleteIds.length === 0
    ) {
      return false;
    }

    // 실패 시 큐 보존, 성공 시에만 clear
    try {
      if (groupChanges.length) {
        await batchPatchPhotoGroups(
          groupChanges.map((g) => ({
            id: g.id,
            dto: { title: g.title, sortOrder: g.sortOrder },
          }))
        );
      }

      if (photoChanges.length) {
        await batchPatchPhotos(
          photoChanges.map((p) => ({
            id: p.id,
            dto: {
              caption: p.caption,
              groupId: p.groupId ?? undefined,
              sortOrder: p.sortOrder ?? undefined,
              isCover: p.isCover ?? undefined,
              name: p.name,
            },
          }))
        );
      }

      if (deleteIds.length) {
        await apiDeletePhotos(deleteIds);
      }

      // 성공 → 큐 비움
      pendingGroupMap.current.clear();
      pendingPhotoMap.current.clear();
      pendingDeleteSet.current.clear();

      return true;
    } catch (e) {
      // 실패 → 큐 유지 후 에러 전달
      throw e;
    }
  }, []);

  // ⛳️ 과거 이름과 호환(기존 코드가 commitPending을 부를 수 있으므로)
  const commitPending = commitImageChanges;

  /* ───────── 추가 API (누락되면 타입 에러) ───────── */

  // 대표(커버) 지정 → 큐 적재
  const makeCover = useCallback((photoId: IdLike) => {
    const key = String(photoId);
    const prev = pendingPhotoMap.current.get(key) ?? { id: photoId };
    pendingPhotoMap.current.set(key, { ...prev, isCover: true });
  }, []);

  // 정렬 변경(단건) → 큐 적재
  const reorder = useCallback(
    (photoId: IdLike, sortOrder: number) => {
      queuePhotoSort(photoId, sortOrder);
    },
    [queuePhotoSort]
  );

  // 그룹 이동(여러 장) → 큐 적재
  const moveToGroup = useCallback(
    async (photoIds: IdLike[], destGroupId: IdLike) => {
      for (const pid of photoIds) queuePhotoMove(pid, destGroupId);
    },
    [queuePhotoMove]
  );

  // 삭제(여러 장) → 큐 적재
  const deletePhotos = useCallback(async (photoIds: IdLike[]) => {
    for (const pid of photoIds) pendingDeleteSet.current.add(String(pid));
  }, []);

  // 그룹 제목/정렬 편집 큐
  const queueGroupTitle = useCallback(
    (groupId: IdLike, title: string | null) => {
      const key = String(groupId);
      const prev = pendingGroupMap.current.get(key) ?? { id: groupId };
      pendingGroupMap.current.set(key, { ...prev, title });
    },
    []
  );
  const queueGroupSortOrder = useCallback(
    (groupId: IdLike, sortOrder: number | null) => {
      const key = String(groupId);
      const prev = pendingGroupMap.current.get(key) ?? { id: groupId };
      pendingGroupMap.current.set(key, { ...prev, sortOrder });
    },
    []
  );

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

    /* 사진 변경 의도(큐잉) */
    makeCover,
    reorder,
    moveToGroup,
    deletePhotos,
    queueGroupTitle,
    queueGroupSortOrder,

    /* id 지정형 큐잉 API */
    queuePhotoCaption,
    queuePhotoSort,
    queuePhotoMove,

    /* 변경 여부/커밋 */
    hasImageChanges,
    commitImageChanges,

    /* 호환용 */
    commitPending,
  };
}

export type EditImagesAPI = ReturnType<typeof useEditImages>;
