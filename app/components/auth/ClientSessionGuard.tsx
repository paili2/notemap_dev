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
 * 401/419/440일 때만 로그아웃 후 redirectTo로 보냅니다.
 * (그 외 2xx/404/5xx 등은 세션 만료로 보지 않고 화면 진입 허용)
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

        // 인증 실패로 간주할 상태코드만 좁게 처리
        const isAuthError =
          res.status === 401 || res.status === 419 || res.status === 440;

        if (isAuthError) {
          // 세션 정리(실패해도 무시)
          try {
            await fetch(`${API_BASE}/auth/signout`, {
              method: "POST",
              credentials: "include",
            });
          } catch {
            // ignore
          }

          // SSR이 새 쿠키 상태를 재판정하도록 하드 이동
          window.location.assign(redirectTo);
          return;
        }

        // ✅ 그 외 상태코드는 세션 만료로 보지 않고 화면 진입 허용
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
