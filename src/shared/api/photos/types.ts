export type IdLike = string | number;

/* ────────────────────────────────────────────────────────────
 * Entities
 * ──────────────────────────────────────────────────────────── */

/** 사진 폴더(그룹) */
export type PinPhotoGroup = {
  id: IdLike; // bigint → string 가능성까지 고려
  pinId: IdLike;
  title?: string | null; // 서버에서 null/빈문자 허용 가능성 고려
  sortOrder?: number | null;
  /** 세로(파일) 폴더 여부: true면 파일폴더, 그 외는 가로 폴더 */
  isDocument?: boolean | null;
  // createdAt / updatedAt 등이 필요하면 선택 필드로 추가
};

/** 개별 사진 */
export type PinPhoto = {
  id: IdLike;
  groupId: IdLike;
  url: string;
  /** 널/부재 가능성 반영 */
  sortOrder?: number | null;
  isCover?: boolean | null;
};

/* ────────────────────────────────────────────────────────────
 * DTOs
 * ──────────────────────────────────────────────────────────── */

/** POST /photo-groups */
export type CreatePinPhotoGroupDto = {
  pinId: IdLike;
  /** 서버에서 MinLength(1)일 수 있으니 프론트에서 기본값 보정 */
  title?: string;
  sortOrder?: number | null;

  /** true면 세로(파일) 폴더로 생성 */
  isDocument?: boolean;
};

/** PATCH /photo-groups/:groupId */
export type UpdatePinPhotoGroupDto = {
  title?: string | null;
  sortOrder?: number | null;

  /** 세로(파일) 폴더 승격/해제 */
  isDocument?: boolean | null;
};

/** POST /photos/:groupId */
export type CreatePinPhotoDto = {
  urls: string[];
  sortOrders?: number[];
  /** 첫 업로드 시 커버 여부(주로 첫 장에서 true) */
  isCover?: boolean;
};

/** PATCH /photos (일괄) */
export type UpdatePinPhotoDto = {
  photoIds: IdLike[];
  isCover?: boolean;
  sortOrder?: number;
  /**
   * 다른 그룹으로 이동할 때 사용.
   * - null: 이동 해제 X, 서버에서 특별한 의미가 없으면 그대로 두기
   * - undefined: moveGroupId 미변경
   */
  moveGroupId?: IdLike | null;
};
