import { useQuery } from "@tanstack/react-query";
import { getUnassignedEmployees } from "../api";

export function useUnassignedEmployees() {
  return useQuery({
    queryKey: ["unassigned-employees"],
    queryFn: getUnassignedEmployees,
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  });
}
