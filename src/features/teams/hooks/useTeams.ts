import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTeams,
  getTeam,
  createTeam,
  removeTeamMember,
  assignTeamMember,
  CreateTeamRequest,
  CreateTeamResponse,
  AssignTeamMemberRequest,
} from "../api";

export const teamKeys = {
  all: ["teams"] as const,
  lists: () => [...teamKeys.all, "list"] as const,
  list: () => [...teamKeys.lists()] as const,
  details: () => [...teamKeys.all, "detail"] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
};

// 팀 목록 조회 (캐싱)
export function useTeams() {
  return useQuery({
    queryKey: teamKeys.list(),
    queryFn: getTeams,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (cacheTime 대체)
  });
}

// 특정 팀 상세 조회
export function useTeam(id: string) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => getTeam(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// 팀 생성 (Mutation)
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamRequest) => createTeam(data),
    onSuccess: () => {
      // 팀 생성 후 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: teamKeys.list() });
    },
  });
}

// 팀 멤버 삭제 (Mutation)
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => removeTeamMember(memberId),
    onSuccess: () => {
      // 팀 멤버 삭제 후 팀 상세 캐시 무효화 및 팀 목록 새로고침
      queryClient.invalidateQueries({ queryKey: teamKeys.details() });
      queryClient.invalidateQueries({ queryKey: teamKeys.list() });
    },
  });
}

// 팀 멤버 배정 (Mutation)
export function useAssignTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignTeamMemberRequest) => assignTeamMember(data),
    onSuccess: () => {
      // 팀 멤버 배정 후 팀 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: teamKeys.details() });
      // 무소속 직원 목록도 새로고침
      queryClient.invalidateQueries({ queryKey: ["unassigned-employees"] });
    },
  });
}
