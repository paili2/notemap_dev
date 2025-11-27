"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { broadcastAuth } from "./authChannel";

/* ---------- types ---------- */
type SignInBody = {
  // 백엔드에서는 dto.email / dto.password 쓰고 있으니까
  // 실제로는 이렇게 맞춰서 보내는 게 제일 안전:
  email?: string;
  password?: string;

  // 기존 필드는 혹시 다른 곳에서 쓰고 있으면 유지
  username?: string;
  credentialId?: string;
};

/** 백엔드 signin 응답: { message, data: sessionUser } */
type SignInResp<T = any> = {
  message: string;
  data: T;
};

/** 세션에 들어가는 유저 정보 형태 (req.session.user) */
export type MeData = {
  id?: number;
  email?: string;
  accountId?: number;
  credentialId?: string;
  username?: string;
  role?: string; // 🔥 여기로 'admin' 등 직급/권한 문자열이 들어옴
} | null;

/** /auth/me 응답: { message, data: MeData } */
type MeResponse = {
  message: string;
  data: MeData;
};

/** /auth/signout 응답: { message, data: null } */
type SignOutResp = {
  message: string;
  data: null;
};

/* ---------- API functions ---------- */

// 로그인
export async function signIn(body: SignInBody) {
  const payload = {
    email: body.email ?? body.username ?? body.credentialId ?? "",
    password: body.password ?? "",
  };

  const { data } = await api.post<SignInResp>("/auth/signin", payload, {
    withCredentials: true,
  });

  const sessionUser = data.data;

  // 🔔 다른 탭들에게도 로그인/세션 갱신 알리기
  broadcastAuth({ type: "LOGIN" });

  return sessionUser; // sessionUser
}

// 로그아웃(세션 종료)
export async function signOut() {
  try {
    await api.post<SignOutResp>("/auth/signout", {}, { withCredentials: true });
  } finally {
    // 요청이 실패하든(이미 만료 등) 성공하든
    // 모든 탭에서는 로그아웃 상태로 맞추는 게 안전
    broadcastAuth({ type: "LOGOUT" });
  }

  return true as const;
}

// 내 정보 (실제 호출 함수)
async function fetchMe() {
  const { data } = await api.get<MeResponse>("/auth/me", {
    withCredentials: true,
  });

  return data.data; // MeData (null 가능)
}

// ✅ React Query 기반 me 훅 (클라이언트 컴포넌트에서 사용)
export function useMe() {
  return useQuery<MeData>({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
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

// 내 정보 조회 (훅 말고 그냥 Promise로 쓰고 싶을 때)
export async function getMe() {
  return await fetchMe();
}
