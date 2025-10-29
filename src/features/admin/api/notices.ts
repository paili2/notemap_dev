import { api } from "@/shared/api/api";

export type CreateNoticeRequest = {
  title: string;
  content: string;
};

export type NoticeResponse = {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};

export type NoticeListResponse = {
  id: number;
  title: string;
  author: string;
  createdAt: string;
};

// 공지사항 생성 API
export async function createNotice(
  data: CreateNoticeRequest
): Promise<NoticeResponse> {
  try {
    const response = await api.post<{
      message: string;
      data: NoticeResponse;
    }>("/dashboard/notices", data);

    console.log("공지사항 생성 API 응답:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("공지사항 생성 API 호출 실패:", error);
    throw error;
  }
}

// 공지사항 목록 조회 API
export async function getNotices(): Promise<NoticeListResponse[]> {
  try {
    const response = await api.get<{
      message: string;
      data: NoticeListResponse[];
    }>("/dashboard/notices");

    console.log("공지사항 목록 API 응답:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("공지사항 목록 API 호출 실패:", error);
    throw error;
  }
}

// 공지사항 상세 조회 API
export async function getNotice(id: number): Promise<NoticeResponse> {
  try {
    const response = await api.get<{
      message: string;
      data: NoticeResponse;
    }>(`/dashboard/notices/${id}`);

    console.log("공지사항 상세 API 응답:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("공지사항 상세 API 호출 실패:", error);
    throw error;
  }
}

// 공지사항 수정 API
export async function updateNotice(
  id: number,
  data: Partial<CreateNoticeRequest>
): Promise<NoticeResponse> {
  try {
    const response = await api.patch<{
      message: string;
      data: NoticeResponse;
    }>(`/dashboard/notices/${id}`, data);

    console.log("공지사항 수정 API 응답:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("공지사항 수정 API 호출 실패:", error);
    throw error;
  }
}

// 공지사항 삭제 API
export async function deleteNotice(id: number): Promise<void> {
  try {
    await api.delete(`/dashboard/notices/${id}`);
    console.log("공지사항 삭제 성공:", id);
  } catch (error: any) {
    console.error("공지사항 삭제 API 호출 실패:", error);
    throw error;
  }
}
