export type IdLike = string | number;

export type PinPhotoGroup = {
  id: IdLike; // bigint → string 가능성 있음
  pinId: IdLike;
  title?: string | null;
  sortOrder?: number | null;
};

export type PinPhoto = {
  id: IdLike;
  groupId: IdLike;
  url: string;
  sortOrder: number;
  isCover?: boolean;
};

/** POST /photos/:groupId */
export type CreatePinPhotoDto = {
  urls: string[];
  sortOrders?: number[];
  isCover?: boolean;
};

/** PATCH /photos (일괄) */
export type UpdatePinPhotoDto = {
  photoIds: IdLike[];
  isCover?: boolean;
  sortOrder?: number;
  moveGroupId?: IdLike;
};
