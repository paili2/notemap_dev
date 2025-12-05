"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function usePinDetailAction() {
  const router = useRouter();

  const openDetail = useCallback(
    (pinId?: string | number) => {
      if (!pinId) return;
      router.push(`/pins/${pinId}`);
    },
    [router]
  );

  return { openDetail };
}
