"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/shared/api/auth";

function clearLocalCaches() {
  try {
    // 프로젝트에서 실제 쓰는 키만 선택적으로 비워 주세요.
    localStorage.removeItem("notemap:user");
    localStorage.removeItem("notemap:access-token");
    localStorage.removeItem("notemap:sidebar-state");
    sessionStorage.clear();
  } catch {}
}

export function useSignout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: async () => {
      clearLocalCaches();
      try {
        await queryClient.clear();
      } catch {}
      router.replace("/login");
    },
    onError: () => {
      // 서버가 멱등 처리지만, 실패해도 클라 상태는 로그아웃 처리
      clearLocalCaches();
      router.replace("/login");
    },
  });
}
