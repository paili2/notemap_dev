"use client";
import { api } from "./api";

/* ---------- types ---------- */
type SignInBody = {
  username?: string; // 서버 규격에 맞춰 credentialId/username 중 택1
  credentialId?: string;
  password?: string;
};

type SignInResp = {
  success: boolean;
  path: string; // "/auth/signin"
  message?: string;
  messages?: string[];
  statusCode?: number;
  data?: {
    credentialId: string;
    username: string;
  };
};

type MeData = {
  accountId: number;
  credentialId: string;
  username: string;
} | null;

type MeResponse = {
  success: boolean;
  path: string; // "/auth/me"
  message?: string;
  messages?: string[];
  statusCode?: number;
  data: MeData;
};

type SignOutResp = {
  success: boolean;
  path: string; // "/auth/signout"
  message?: string;
  messages?: string[];
  statusCode?: number;
  data?: null;
};

/* ---------- API functions ---------- */

// 로그인
export async function signIn(body: SignInBody) {
  const { data } = await api.post<SignInResp>("/auth/signin", body, {
    withCredentials: true,
  });
  if (!data?.success) {
    const msg = data?.messages?.join("\n") || data?.message || "로그인 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }
  return data.data; // { credentialId, username }
}

// 로그아웃(세션 종료)
export async function signOut() {
  const { data } = await api.post<SignOutResp>(
    "/auth/signout",
    {}, // 요청 바디 없음
    { withCredentials: true }
  );

  // 서버는 멱등 처리(이미 로그아웃이어도 200)지만, 에러 포맷은 통일
  if (!data?.success) {
    const msg = data?.messages?.join("\n") || data?.message || "로그아웃 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }

  return true as const;
}

// 내 정보
async function fetchMe() {
  const { data } = await api.get<MeResponse>("/auth/me", {
    withCredentials: true,
  });
  if (!data?.success) {
    const msg =
      data?.messages?.join(", ") || data?.message || "인증 정보가 없습니다.";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }
  return data.data; // MeData
}

// 로그인 보장 헬퍼
export async function ensureAuthed(): Promise<boolean> {
  try {
    const me = await fetchMe();
    return !!me;
  } catch {
    return false;
  }
}
