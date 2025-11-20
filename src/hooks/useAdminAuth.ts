"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/features/users/api/account";

/**
 * admin 권한을 체크하고, admin이 아니면 리다이렉트합니다.
 * @param redirectTo admin이 아닌 경우 리다이렉트할 경로 (기본값: "/")
 * @returns isLoading, isAdmin 상태
 */
export function useAdminAuth(redirectTo: string = "/") {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 10 * 60 * 1000, // 10분
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;

    if (error || !profile) {
      // 프로필 조회 실패 시 리다이렉트
      window.location.assign(redirectTo);
      return;
    }

    if (profile.role !== "admin") {
      // admin이 아닌 경우 리다이렉트
      window.location.assign(redirectTo);
      return;
    }
  }, [profile, isLoading, error, redirectTo]);

  return {
    isLoading,
    isAdmin: profile?.role === "admin",
  };
}

