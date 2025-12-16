import { api } from "@/shared/api/api";

export type UnassignedEmployeeResponse = {
  credentialId: string;
  accountId: string;
  role: string;
  name: string | null;
  phone: string | null;
  positionRank: string | null;
  profileUrl: string | null;
};

export type UnassignedEmployee = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

// 무소속 직원 조회 API
export async function getUnassignedEmployees(): Promise<UnassignedEmployee[]> {
  try {
    const response = await api.get<{
      message: string;
      data: UnassignedEmployeeResponse[];
    }>("/dashboard/accounts/credentials/unassigned-employees");

    // API 응답을 UnassignedEmployee 타입으로 변환
    // accountId를 id로 사용 (팀원 추가 시 accountId 필요)
    return response.data.data.map((emp) => ({
      id: emp.accountId, // accountId를 id로 사용
      name: emp.name || "이름 없음",
      email: "", // 새로운 응답에 email이 없으므로 빈 문자열
      phone: emp.phone || "-",
    }));
  } catch (error: any) {
    console.error("무소속 직원 조회 API 호출 실패:", error);
    throw error;
  }
}
