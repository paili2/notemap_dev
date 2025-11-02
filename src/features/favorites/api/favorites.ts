import { api } from "@/shared/api/api";

// 즐겨찾기 그룹 타입
export type FavoriteGroup = {
  id: string;
  title: string;
  sortOrder: number;
  itemCount?: number;
  items?: FavoriteItem[];
};

// 즐겨찾기 아이템 타입
export type FavoriteItem = {
  itemId: string;
  pinId: string;
  sortOrder: number;
  createdAt: string;
};

// 즐겨찾기 그룹 목록 조회
export async function getFavoriteGroups(
  includeItems: boolean = false
): Promise<FavoriteGroup[]> {
  try {
    console.log("즐겨찾기 그룹 목록 조회:", { includeItems });
    const response = await api.get<{ message: string; data: FavoriteGroup[] }>(
      `/group?includeItems=${includeItems ? "1" : "0"}`
    );
    console.log("즐겨찾기 그룹 목록 응답:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("즐겨찾기 그룹 목록 조회 실패:", error);
    console.error("에러 상세:", error?.response?.data);
    throw error;
  }
}

// 즐겨찾기 그룹 제목 수정
export type UpdateGroupTitleRequest = {
  title: string;
};

export async function updateGroupTitle(
  groupId: string,
  data: UpdateGroupTitleRequest
): Promise<FavoriteGroup> {
  try {
    console.log("즐겨찾기 그룹 제목 수정:", { groupId, data });
    const response = await api.patch<{ message: string; data: FavoriteGroup }>(
      `/group/${groupId}`,
      data
    );
    console.log("즐겨찾기 그룹 제목 수정 응답:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("즐겨찾기 그룹 제목 수정 실패:", error);
    console.error("에러 상세:", error?.response?.data);
    throw error;
  }
}

// 즐겨찾기 그룹 순서 변경
export type ReorderGroupsRequest = {
  orders: Array<{
    groupId: string;
    sortOrder: number;
  }>;
};

export async function reorderGroups(data: ReorderGroupsRequest): Promise<void> {
  try {
    console.log("즐겨찾기 그룹 순서 변경:", data);
    const response = await api.patch<{ message: string }>(
      "/group/reorder",
      data
    );
    console.log("즐겨찾기 그룹 순서 변경 응답:", response.data);
  } catch (error: any) {
    console.error("즐겨찾기 그룹 순서 변경 실패:", error);
    console.error("에러 상세:", error?.response?.data);
    throw error;
  }
}

// 즐겨찾기 아이템 삭제
export async function deleteFavoriteItem(
  groupId: string,
  itemId: string
): Promise<void> {
  try {
    console.log("즐겨찾기 아이템 삭제:", { groupId, itemId });
    const response = await api.delete<{ message: string }>(
      `/favorite-groups/${groupId}/items/${itemId}`
    );
    console.log("즐겨찾기 아이템 삭제 응답:", response.data);
  } catch (error: any) {
    console.error("즐겨찾기 아이템 삭제 실패:", error);
    console.error("에러 상세:", error?.response?.data);
    throw error;
  }
}

// 즐겨찾기 아이템 순서 변경
export type ReorderItemsRequest = {
  orders: Array<{
    itemId: string;
    sortOrder: number;
  }>;
};

export async function reorderItems(data: ReorderItemsRequest): Promise<void> {
  try {
    console.log("즐겨찾기 아이템 순서 변경:", data);
    const response = await api.patch<{ message: string }>(
      "/item/reorder",
      data
    );
    console.log("즐겨찾기 아이템 순서 변경 응답:", response.data);
  } catch (error: any) {
    console.error("즐겨찾기 아이템 순서 변경 실패:", error);
    console.error("에러 상세:", error?.response?.data);
    throw error;
  }
}

// 즐겨찾기 아이템 추가/수정
export type UpsertFavoriteItemRequest = {
  groupId?: string; // 기존 그룹에 추가할 경우
  title?: string; // 새 그룹 만들 때만
  pinId: string;
  sortOrder?: number; // 특정 위치에 끼워넣기
};

export type UpsertFavoriteItemResponse = {
  groupId: string;
  itemId: string;
  pinId: string;
  sortOrder: number;
};

export async function upsertFavoriteItem(
  data: UpsertFavoriteItemRequest
): Promise<UpsertFavoriteItemResponse> {
  try {
    console.log("즐겨찾기 아이템 추가/수정:", data);
    const response = await api.post<{
      message: string;
      data: UpsertFavoriteItemResponse;
    }>("/favorite", data);
    console.log("즐겨찾기 아이템 추가/수정 응답:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("즐겨찾기 아이템 추가/수정 실패:", error);
    console.error("에러 상세:", error?.response?.data);
    throw error;
  }
}
