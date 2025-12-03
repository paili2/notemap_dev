"use client";

import { useEffect, useState } from "react";
import {
  AUTH_CHANNEL_NAME,
  AuthBroadcastMessage,
} from "@/shared/api/auth/authChannel";

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

/* ─────────────────────────────────────────────
 * 📌 전역 세션 체크: 여러 Guard 인스턴스에서도 /me 한 번만
 * ───────────────────────────────────────────── */

let inFlightSessionCheck: Promise<boolean> | null = null;

async function fetchSessionValid(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const isAuthErrorStatus =
    res.status === 401 || res.status === 419 || res.status === 440;

  if (!res.ok) {
    return !isAuthErrorStatus; // 5xx 같은 건 "모르겠음" 취급할 수도 있지만, 여기서는 false 로
  }

  const json = await res.json().catch(() => null);
  const hasUser = !!json?.data;

  if (isAuthErrorStatus || !hasUser) return false;
  return true;
}

/** 여러 곳에서 동시에 호출돼도 실제 네트워크는 1번만 */
function ensureSessionCheck(): Promise<boolean> {
  if (!inFlightSessionCheck) {
    inFlightSessionCheck = fetchSessionValid().finally(() => {
      inFlightSessionCheck = null;
    });
  }
  return inFlightSessionCheck;
}

/* ───────────────────────────────────────────── */

export default function ClientSessionGuard({
  children,
  redirectTo = "/login",
}: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;
    let destroyed = false;
    let timerId: number | undefined;
    let channel: BroadcastChannel | undefined;

    const handleForceLogout = async () => {
      if (!mounted) return;

      try {
        await fetch(`${API_BASE}/auth/signout`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // ignore
      }

      setReady(false);
      window.location.assign(redirectTo);
    };

    const checkSession = async () => {
      if (destroyed) return;

      const ok = await ensureSessionCheck();

      if (!mounted || destroyed) return;

      if (!ok) {
        await handleForceLogout();
        return;
      }

      // ✅ 로그인된 상태
      setReady(true);
    };

    // 1) BroadcastChannel: 다른 탭에서 LOGOUT 브로드캐스트 수신
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
        if (!event?.data) return;
        if (event.data.type === "LOGOUT") {
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

    // 3) 백업용 폴링
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
