"use client";

import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
  /** 로그인 안 된 경우 보낼 경로 (기본값: "/login") */
  redirectTo?: string;
};

/** 백엔드 API base (마지막 슬래시 제거해서 안전하게 사용) */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3050"
).replace(/\/+$/, "");

/**
 * 클라이언트에서 백엔드 /auth/me 로 실제 세션을 확인하고,
 * 1) 401/419/440 같은 인증 에러이거나
 * 2) 2xx라도 data 가 없으면
 * => 로그인 안 된 것으로 보고 redirectTo 로 보낸다.
 */
export default function ClientSessionGuard({
  children,
  redirectTo = "/login",
}: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 🔥 실제 백엔드 세션 확인
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          credentials: "include", // ✅ 크로스 도메인 쿠키 포함
          cache: "no-store",
        });

        if (!mounted) return;

        const isAuthErrorStatus =
          res.status === 401 || res.status === 419 || res.status === 440;

        let hasUser = false;

        // 2xx 인 경우에만 body 파싱 시도
        if (res.ok) {
          const json = await res.json().catch(() => null);
          hasUser = !!json?.data; // ← 로그인 여부 확정
        }

        // 🔥 상태코드가 인증 에러이거나, user 데이터가 없으면 → 비로그인으로 간주
        if (isAuthErrorStatus || !hasUser) {
          try {
            await fetch(`${API_BASE}/auth/signout`, {
              method: "POST",
              credentials: "include",
            });
          } catch {
            // ignore
          }

          window.location.assign(redirectTo);
          return;
        }

        // ✅ 로그인된 상태 → 화면 진입 허용
        setReady(true);
      } catch {
        // 네트워크 에러 등은 안전하게 로그인 화면으로
        window.location.assign(redirectTo);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [redirectTo]);

  if (!ready) return null;
  return <>{children}</>;
}
