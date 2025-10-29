import { api } from "@/shared/api/api";

/** 백엔드 엔티티에 맞춘 대략적 타입(필요시 확장) */
export type PinPhotoGroup = {
  id: string; // 그룹 PK
  pinId: number; // 어떤 핀의 그룹인지(숫자)
  title?: string | null;
  sortOrder?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

/** 생성 DTO (백엔드에서 받는 필드들) */
export type CreatePinPhotoGroupDto = {
  pinId: number; // ✅ 필수: number
  title?: string; // "사진 폴더 1" 등
  sortOrder?: number; // 0,1,2...
};

/** 수정 DTO */
export type UpdatePinPhotoGroupDto = Partial<
  Pick<CreatePinPhotoGroupDto, "title" | "sortOrder">
>;

/** GET /photo-groups/:pinId */
export async function listPhotoGroupsByPin(pinId: number | string) {
  const pinIdNum = Number(pinId);
  if (!Number.isFinite(pinIdNum)) {
    throw new Error("listPhotoGroupsByPin: pinId must be a number");
  }
  const { data } = await api.get<{ data: PinPhotoGroup[] }>(
    `/photo-groups/${encodeURIComponent(String(pinIdNum))}`,
    { withCredentials: true }
  );
  return data?.data ?? [];
}

/** POST /photo-groups */
export async function createPhotoGroup(dto: CreatePinPhotoGroupDto) {
  const payload: CreatePinPhotoGroupDto = {
    pinId: Number(dto.pinId), // ✅ 숫자로 보장
    ...(dto.title ? { title: dto.title } : {}),
    ...(Number.isFinite(dto.sortOrder!)
      ? { sortOrder: Number(dto.sortOrder) }
      : {}),
  };

  const { data } = await api.post<{ message?: string; data: PinPhotoGroup }>(
    `/photo-groups`,
    payload,
    { withCredentials: true }
  );
  return data?.data;
}

/** PATCH /photo-groups/:groupId */
export async function updatePhotoGroup(
  groupId: string,
  dto: UpdatePinPhotoGroupDto
) {
  const payload: UpdatePinPhotoGroupDto = {
    ...(typeof dto.title === "string" ? { title: dto.title } : {}),
    ...(Number.isFinite(dto.sortOrder!)
      ? { sortOrder: Number(dto.sortOrder) }
      : {}),
  };

  const { data } = await api.patch<{ message?: string; data: PinPhotoGroup }>(
    `/photo-groups/${encodeURIComponent(groupId)}`,
    payload,
    { withCredentials: true }
  );
  return data?.data;
}
