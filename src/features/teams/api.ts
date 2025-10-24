import { api } from "@/shared/api/api";

export type CreateTeamRequest = {
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
};

export type CreateTeamResponse = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  teamLeaderName?: string | null;
  memberCount: number;
};

// 팀 생성 API
export async function createTeam(
  data: CreateTeamRequest
): Promise<CreateTeamResponse> {
  const requestData = {
    ...data,
    code: data.code || data.name.replace(/\s+/g, "").toLowerCase(),
    isActive: data.isActive ?? true,
  };

  const response = await api.post<{
    message: string;
    data: CreateTeamResponse;
  }>("/dashboard/accounts/teams", requestData);

  return response.data.data;
}

// DB에서 팀 목록 조회 API
export async function getTeams(): Promise<CreateTeamResponse[]> {
  const response = await api.get<{
    message: string;
    data: CreateTeamResponse[];
  }>("/dashboard/accounts/teams");

  console.log("DB 팀 목록 API 응답:", response.data);
  return response.data.data;
}
