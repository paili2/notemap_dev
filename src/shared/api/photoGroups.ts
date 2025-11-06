// src/shared/api/photogroups.ts

// 👉 타입은 공통 타입 파일에서 그대로 노출
export type {
  IdLike,
  PinPhotoGroup,
  CreatePinPhotoGroupDto,
  UpdatePinPhotoGroupDto,
} from "@/shared/api/types/pinPhotos";

// 👉 실제 구현은 단일 소스인 photos.ts 것을 재노출
export {
  listPhotoGroupsByPin,
  createPhotoGroup,

  /** @deprecated 서버 스펙 통합으로 /pin/photo-groups/:id 사용 권장 */
  updatePhotoGroup,

  /** ✅ 신규: PATCH /pin/photo-groups/:id (단건 그룹 수정) */
  patchPhotoGroupById,

  /** ✅ 선택: 벌크 패치 헬퍼 (diff 결과 한 번에 처리) */
  batchPatchPhotoGroups,
} from "@/shared/api/photos";
