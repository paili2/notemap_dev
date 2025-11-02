import { api } from "@/shared/api/api";

export type UnassignedEmployeeResponse = {
  credentialId: string;
  email: string;
  role: string;
  disabled: boolean;
  name: string | null;
  phone: string | null;
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
    }>("/dashboard/accounts/employees/unassigned");

    // API 응답을 UnassignedEmployee 타입으로 변환
    return response.data.data.map((emp) => ({
      id: emp.credentialId,
      name: emp.name || "이름 없음",
      email: emp.email,
      phone: emp.phone || "-",
    }));
  } catch (error: any) {
    console.error("무소속 직원 조회 API 호출 실패:", error);
    throw error;
  }
}
