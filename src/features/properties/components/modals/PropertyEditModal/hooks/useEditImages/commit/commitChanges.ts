import type {
  IdLike,
  PinPhoto,
  PinPhotoGroup,
} from "@/shared/api/types/pinPhotos";
import {
  batchPatchPhotoGroups,
  batchPatchPhotos,
  deletePhotos as apiDeletePhotos,
} from "@/shared/api/photos";
import type { ImageItem } from "@/features/properties/types/media";
import type { PendingGroupChange } from "../queue/groupQueue";
import type { PendingPhotoChange } from "../queue/photoQueue";
import {
  buildFolderUploadPlans,
  buildVerticalNewItems,
} from "./buildUploadPlan";
import { getServerPhotoId } from "../utils/getServerPhotoId";
import {
  ensureFolderGroupImpl,
  ensureVerticalGroupImpl,
} from "../server/ensureGroups";
import { uploadToGroupImpl } from "../server/upload";
import { MAX_FILES } from "@/features/properties/components/constants";

type CommitDeps = {
  propertyId: string;
  imageFoldersRef: { current: ImageItem[][] };
  verticalImagesRef: { current: ImageItem[] };
  pendingGroupMap: { current: Map<string, PendingGroupChange> };
  pendingPhotoMap: { current: Map<string, PendingPhotoChange> };
  pendingDeleteSet: { current: Set<string> };
  groupsRef: { current: PinPhotoGroup[] | null };
  setGroups: React.Dispatch<React.SetStateAction<PinPhotoGroup[] | null>>;
  uploadInFlightRef: { current: Map<string, Promise<PinPhoto[]>> };
  createAndUploadRef: {
    current: Map<string, Promise<{ group: PinPhotoGroup; photos: PinPhoto[] }>>;
  };
};

export function hasImageChangesImpl(deps: CommitDeps): boolean {
  const {
    imageFoldersRef,
    verticalImagesRef,
    pendingGroupMap,
    pendingPhotoMap,
    pendingDeleteSet,
  } = deps;

  const hasPending =
    pendingGroupMap.current.size > 0 ||
    pendingPhotoMap.current.size > 0 ||
    pendingDeleteSet.current.size > 0;

  const hasNewFolderFiles = imageFoldersRef.current.some((folder) =>
    (folder ?? []).some(
      (it: any) => !getServerPhotoId(it) && it.file instanceof File
    )
  );

  const hasNewVerticalFiles = verticalImagesRef.current.some(
    (it: any) => !getServerPhotoId(it)
  );

  return hasPending || hasNewFolderFiles || hasNewVerticalFiles;
}

export async function commitImageChangesImpl(
  deps: CommitDeps
): Promise<boolean> {
  const {
    propertyId,
    imageFoldersRef,
    verticalImagesRef,
    pendingGroupMap,
    pendingPhotoMap,
    pendingDeleteSet,
    groupsRef,
    setGroups,
    uploadInFlightRef,
    createAndUploadRef,
  } = deps;

  const groupChangesRaw = Array.from(pendingGroupMap.current.values());

  const groupChanges = groupChangesRaw.filter((g) => {
    const idStr = String(g.id);
    if (idStr.startsWith("folder-")) return false;
    if (idStr === "__vertical__") return false;
    return true;
  });

  const photoChangesPending = Array.from(pendingPhotoMap.current.values());
  const deleteIds = Array.from(pendingDeleteSet.current.values());

  const foldersSnapshot = imageFoldersRef.current;
  const newUploadPlans = buildFolderUploadPlans(foldersSnapshot);
  const verticalNewItems = buildVerticalNewItems(verticalImagesRef.current);

  if (
    groupChanges.length === 0 &&
    photoChangesPending.length === 0 &&
    deleteIds.length === 0 &&
    newUploadPlans.length === 0 &&
    verticalNewItems.length === 0
  ) {
    return false;
  }

  try {
    const extraPhotoPatches: {
      id: IdLike;
      caption?: string | null;
    }[] = [];

    const ensureDeps = {
      groupsRef,
      setGroups,
      pendingGroupMap,
    };

    // 1) 가로 신규 파일 업로드
    for (const plan of newUploadPlans) {
      const { folderIdx, files, captions } = plan;

      const firstCaption =
        captions.find((c) => typeof c === "string" && c.trim().length > 0) ??
        null;

      const group = await ensureFolderGroupImpl(
        ensureDeps,
        propertyId,
        folderIdx,
        firstCaption
      );

      const created = await uploadToGroupImpl(
        group.id,
        files,
        uploadInFlightRef.current,
        { domain: "map" }
      );

      created.forEach((p, i) => {
        const cap = captions[i];
        if (!cap) return;
        extraPhotoPatches.push({
          id: p.id as IdLike,
          caption: cap,
        });
      });
    }

    // 2) 세로 신규 파일 업로드
    if (verticalNewItems.length) {
      const files: File[] = [];
      const captions: (string | undefined)[] = [];

      for (const { img } of verticalNewItems) {
        let file: File | null = null;

        if ((img as any).file instanceof File) {
          file = (img as any).file as File;
        } else if (img.url && img.url.startsWith("blob:")) {
          try {
            const res = await fetch(img.url);
            const blob = await res.blob();
            file = new File([blob], img.name || "image.jpg", {
              type: blob.type || "image/jpeg",
            });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[useEditImages] blob→File 변환 실패:", e);
          }
        }

        if (!file) continue;
        files.push(file);
        captions.push(
          typeof (img as any).caption === "string"
            ? ((img as any).caption as string)
            : undefined
        );
      }

      if (files.length) {
        const firstCaption =
          captions.find((c) => typeof c === "string" && c.trim().length > 0) ??
          null;

        const vGroup = await ensureVerticalGroupImpl(
          ensureDeps,
          propertyId,
          firstCaption
        );

        const created = await uploadToGroupImpl(
          vGroup.id,
          files.slice(0, MAX_FILES),
          uploadInFlightRef.current,
          { domain: "map" }
        );

        created.forEach((p, i) => {
          const cap = captions[i];
          if (!cap) return;
          extraPhotoPatches.push({
            id: p.id as IdLike,
            caption: cap,
          });
        });
      }
    }

    const photoChanges = [
      ...photoChangesPending,
      ...extraPhotoPatches.map((p) => ({
        id: p.id,
        caption: p.caption ?? null,
      })),
    ];

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
        photoChanges.map((p: any) => ({
          id: p.id,
          dto: {
            caption: p.caption,
            groupId:
              p.groupId !== undefined ? (p.groupId as IdLike) : undefined,
            sortOrder:
              p.sortOrder !== undefined ? (p.sortOrder as number) : undefined,
            isCover:
              p.isCover !== undefined ? (p.isCover as boolean) : undefined,
            name: p.name,
          },
        }))
      );
    }

    if (deleteIds.length) {
      await apiDeletePhotos(deleteIds);
    }

    pendingGroupMap.current.clear();
    pendingPhotoMap.current.clear();
    pendingDeleteSet.current.clear();

    return true;
  } catch (e) {
    throw e;
  }
}
