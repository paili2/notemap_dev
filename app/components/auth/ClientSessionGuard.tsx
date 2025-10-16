// app/components/auth/ClientSessionGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  children: React.ReactNode;
  /** 로그인 안 된 경우 보낼 경로 (기본값: "/login") */
  redirectTo?: string;
};

/**
 * 클라이언트에서 /api/auth/me로 실제 세션을 확인하고,
 * 비로그인 상태면 signout 치고 redirectTo로 보냅니다.
 * (sessionStorage 마커 대신 실제 세션을 신뢰)
 */
export default function ClientSessionGuard({
  children,
  redirectTo = "/login",
}: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 실제 세션 확인
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        const ok = res.ok && !!json?.data;

        if (!mounted) return;

        if (ok) {
          setReady(true);
          return;
        }

        // 세션이 아니면 서버 세션도 정리
        await fetch("/api/auth/signout", {
          method: "POST",
          credentials: "same-origin",
        }).catch(() => {});

        // 확실한 내비게이션(하드 이동)으로 SSR이 새 쿠키 상태를 재판정하도록 함
        window.location.assign(redirectTo);
      } catch {
        // 네트워크 에러 등: 안전하게 로그인 화면으로
        window.location.assign(redirectTo);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [redirectTo, router]);

  if (!ready) return null;
  return <>{children}</>;
}
