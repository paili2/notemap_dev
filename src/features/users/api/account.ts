import { api } from "@/shared/api/api";

// 프로필 정보 조회
export type ProfileResponse = {
  credentialId: string;
  email: string;
  role: "admin" | "manager" | "staff";
  disabled: boolean;
  profileCompleted: boolean;
  account: {
    id: string;
    name: string | null;
    phone: string | null;
    emergencyContact: string | null;
    addressLine: string | null;
    bankName: string | null;
    bankAccountNo: string | null;
    photoUrl: string | null;
    positionRank: string;
    docUrlResidentRegistration: string | null;
    docUrlResidentAbstract: string | null;
    docUrlIdCard: string | null;
    docUrlFamilyRelation: string | null;
  } | null;
};

export async function getProfile(): Promise<ProfileResponse> {
  try {
    const response = await api.get<{
      message: string;
      data: ProfileResponse;
    }>("/dashboard/accounts/me/profile");
    return response.data.data;
  } catch (error: any) {
    console.error("프로필 조회 실패:", error);
    throw error;
  }
}

// 첫 번째 API: 계정 생성 (credentials)
export type CreateAccountRequest = {
  email: string;
  password: string;
  role: "manager" | "staff";
  team: {
    teamId: string;
    isPrimary?: boolean;
    joinedAt?: string;
  };
  isDisabled?: boolean;
};

export type CreateAccountResponse = {
  id: number;
  email: string;
  role: "manager" | "staff";
  isDisabled: boolean;
};

// 두 번째 API: 직원 정보 생성
export type CreateEmployeeInfoRequest = {
  name: string;
  phone: string;
  emergencyContact: string;
  addressLine: string;
  salaryBankName: string;
  salaryAccount: string;
  positionRank:
    | "STAFF"
    | "ASSISTANT_MANAGER"
    | "MANAGER"
    | "DEPUTY_GENERAL"
    | "GENERAL_MANAGER"
    | "DIRECTOR";
  profileUrl?: string;
  docUrlIdCard?: string;
  docUrlResidentRegistration?: string;
  docUrlResidentAbstract?: string;
  docUrlFamilyRelation?: string;
};

export type CreateEmployeeInfoResponse = {
  id: string;
  credentialId: string;
  name: string;
  phone: string;
  emergencyContact: string;
  addressLine: string;
  salaryAccount: string;
  positionRank: string;
  isProfileCompleted: boolean;
};

// 첫 번째 API: 계정 생성
export async function createAccount(
  data: CreateAccountRequest
): Promise<CreateAccountResponse> {
  try {
    console.log("계정 생성 API 호출:", data);
    const response = await api.post<{
      message: string;
      data: CreateAccountResponse;
    }>("/dashboard/accounts/credentials", data);
    console.log("계정 생성 API 응답:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("계정 생성 API 호출 실패:", error);
    console.error("에러 상세:", error?.response?.data);
    throw error;
  }
}

// 두 번째 API: 직원 정보 생성
export async function createEmployeeInfo(
  credentialId: string,
  data: CreateEmployeeInfoRequest
): Promise<CreateEmployeeInfoResponse> {
  try {
    console.log("직원 정보 생성 API 호출:", { credentialId, data });
    const response = await api.post<{
      message: string;
      data: CreateEmployeeInfoResponse;
    }>(`/dashboard/accounts/employees/${credentialId}/info`, data);
    console.log("직원 정보 생성 API 응답:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("직원 정보 생성 API 호출 실패:", error);
    console.error("에러 상세:", error?.response?.data);
    console.error("에러 메시지:", error?.response?.data?.messages);
    throw error;
  }
}
