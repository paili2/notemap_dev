import { api } from "@/shared/api/api";

export type CreateTeamRequest = {
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
};

export type CreateTeamResponse = {
  id: number | string;
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

export type TeamMemberDetail = {
  teamMemberId: string;
  accountId: string;
  name: string | null;
  phone: string | null;
  positionRank: string | null;
  photoUrl: string | null;
  teamRole: "manager" | "staff";
  isPrimary: boolean;
  joinedAt: string | null;
};

export type TeamDetailResponse = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  members: TeamMemberDetail[];
};

// DB에서 특정 팀 상세 조회 API
export async function getTeam(id: string): Promise<TeamDetailResponse> {
  const response = await api.get<{
    message: string;
    data: TeamDetailResponse;
  }>(`/dashboard/accounts/teams/${id}`);

  return response.data.data;
}

// 팀 멤버 삭제 API
export async function removeTeamMember(memberId: string): Promise<void> {
  await api.delete(`/dashboard/accounts/team-members/${memberId}`);
}

export type AssignTeamMemberRequest = {
  teamId: string;
  accountId: string;
  role: "manager" | "staff";
  isPrimary?: boolean;
  joinedAt?: string;
};

// 팀 멤버 배정 API
export async function assignTeamMember(
  data: AssignTeamMemberRequest
): Promise<void> {
  await api.post(`/dashboard/accounts/team-members`, data);
}
