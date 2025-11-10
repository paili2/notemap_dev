export type IdLike = string | number;

/* ── Entities ── */
export type PinPhotoGroup = {
  id: IdLike; // bigint → string 가능성
  pinId: IdLike;
  title?: string | null; // 서버에서 null/빈문자 허용 가능성 고려
  sortOrder?: number | null;
  // createdAt/updatedAt 필요하면 여기에 선택적으로 추가
};

export type PinPhoto = {
  id: IdLike;
  groupId: IdLike;
  url: string;
  sortOrder?: number | null; // ← 널/부재 가능성 반영 (기존: required number)
  isCover?: boolean | null;
};

/* ── DTOs ── */
/** POST /photo-groups */
export type CreatePinPhotoGroupDto = {
  pinId: IdLike;
  title?: string; // 서버에서 MinLength(1)일 수 있으니 프론트에서 기본값 보정
  sortOrder?: number | null;
};

/** PATCH /photo-groups/:groupId */
export type UpdatePinPhotoGroupDto = {
  title?: string | null;
  sortOrder?: number | null;
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
  moveGroupId?: IdLike | null; // ← null 허용(그룹 이동 해제 X) / undefined면 미변경
};
