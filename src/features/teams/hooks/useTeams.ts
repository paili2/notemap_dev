import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTeams,
  createTeam,
  CreateTeamRequest,
  CreateTeamResponse,
} from "../api";

export const teamKeys = {
  all: ["teams"] as const,
  lists: () => [...teamKeys.all, "list"] as const,
  list: () => [...teamKeys.lists()] as const,
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
