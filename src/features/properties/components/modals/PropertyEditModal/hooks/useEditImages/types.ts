import type { IdLike } from "@/shared/api/photos/types";

export type PendingGroupChange = {
  id: IdLike;
  title?: string | null;
  sortOrder?: number | null;
};

export type PendingPhotoChange = {
  id: IdLike;
  caption?: string | null;
  groupId?: IdLike | null;
  sortOrder?: number | null;
  isCover?: boolean | null;
  name?: string | null;
};
