"use client";

import { useEffect, useState } from "react";
import {
  AUTH_CHANNEL_NAME,
  AuthBroadcastMessage,
} from "@/shared/api/authChannel";

/**
 * 백엔드 API base (마지막 슬래시 제거해서 안전하게 사용)
 */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3050"
).replace(/\/+$/, "");

/** 세션 백업 폴링 주기 (ms) — 포커스 이벤트가 메인, 이건 서브 */
const DEFAULT_POLL_INTERVAL_MS = 10 * 60 * 1000; // 10분

type Props = {
  children: React.ReactNode;
  /** 로그인 안 된 경우 보낼 경로 (기본값: "/login") */
  redirectTo?: string;
};

/**
 * 클라이언트에서 백엔드 /auth/me 로 실제 세션을 확인하고,
 * 1) 401/419/440 같은 인증 에러이거나
 * 2) 2xx라도 data 가 없으면
 * => 로그인 안 된 것으로 보고 redirectTo 로 보낸다.
 *
 * + 추가:
 * - BroadcastChannel("notemap-auth")의 LOGOUT 이벤트 수신 시에도 즉시 튕김
 * - window focus / visibilitychange 때도 /auth/me 재검증
 * - 백업용 폴링으로도 주기적 검증
 */
export default function ClientSessionGuard({
  children,
  redirectTo = "/login",
}: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;
    let destroyed = false;
    let isChecking = false;
    let timerId: number | undefined;
    let channel: BroadcastChannel | undefined;

    const handleForceLogout = async () => {
      if (!mounted) return;

      // 가능하면 서버에도 세션 종료 시도 (실패해도 무시)
      try {
        await fetch(`${API_BASE}/auth/signout`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // ignore
      }

      // 로그인 가드 해제
      setReady(false);
      window.location.assign(redirectTo);
    };

    const checkSession = async () => {
      if (isChecking || destroyed) return;
      isChecking = true;
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          credentials: "include", // ✅ 크로스 도메인 쿠키 포함
          cache: "no-store",
        });

        if (!mounted) return;

        const isAuthErrorStatus =
          res.status === 401 || res.status === 419 || res.status === 440;

        let hasUser = false;

        if (res.ok) {
          const json = await res.json().catch(() => null);
          hasUser = !!json?.data;
        }

        if (isAuthErrorStatus || !hasUser) {
          await handleForceLogout();
          return;
        }

        // ✅ 로그인된 상태
        setReady(true);
      } catch {
        // 네트워크 에러 등은 안전하게 로그인 화면으로
        await handleForceLogout();
      } finally {
        isChecking = false;
      }
    };

    // 1) BroadcastChannel: 다른 탭에서 LOGOUT 브로드캐스트 수신
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
        if (!event?.data) return;
        if (event.data.type === "LOGOUT") {
          // 다른 탭에서 로그아웃 했음 → 현재 탭도 즉시 튕기기
          void handleForceLogout();
        }
      };
    }

    // 2) 포커스 / visibilitychange 시 세션 다시 확인
    const onFocus = () => {
      void checkSession();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkSession();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // 3) 백업용 폴링 (선택)
    if (DEFAULT_POLL_INTERVAL_MS > 0) {
      timerId = window.setInterval(() => {
        void checkSession();
      }, DEFAULT_POLL_INTERVAL_MS);
    }

    // 처음 마운트될 때 한 번 체크
    void checkSession();

    return () => {
      mounted = false;
      destroyed = true;
      if (channel) channel.close();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timerId) window.clearInterval(timerId);
    };
  }, [redirectTo]);

  if (!ready) return null;
  return <>{children}</>;
}
