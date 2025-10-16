import { cookies } from "next/headers";
import ClientSessionGuard from "app/components/auth/ClientSessionGuard";
import SidebarProviders from "./SidebarProviders";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 현재 SSR 요청 쿠키를 그대로 /api/auth/me에 전달해서 1차 확인
  const cookieHeader = cookies().toString();

  // 상대 경로 + SSR 쿠키 전달 (프록시/리라이트 통해 백엔드로 전달)
  let isLoggedIn = false;
  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      isLoggedIn = !!json?.data;
    }
  } catch {
    // 네트워크 에러면 false 유지
  }

  // SSR에서 즉시 튕기고 싶으면 아래 주석 해제
  // if (!isLoggedIn) redirect("/login");

  // CSR에서도 한 번 더 확인(로그인 직후 쿠키 레이스 대비)
  return (
    <ClientSessionGuard redirectTo="/login">
      <SidebarProviders>{children}</SidebarProviders>
    </ClientSessionGuard>
  );
}
