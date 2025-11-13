// ✅ 수정안: 서버에서 백엔드로 직행 + 쿠키 전달
import { cookies } from "next/headers";
import ClientSessionGuard from "app/components/auth/ClientSessionGuard";
import SidebarProviders from "./SidebarProviders";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieHeader = cookies().toString();
  const base = process.env.NEXT_PUBLIC_API_BASE!; // 예: https://api.example.com

  let isLoggedIn = false;
  try {
    const res = await fetch(`${base}/auth/me`, {
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

  // SSR에서 즉시 리다이렉트하고 싶으면:
  // if (!isLoggedIn) redirect(`/login?redirect=${encodeURIComponent('/')}`);

  return (
    <ClientSessionGuard redirectTo="/login">
      <SidebarProviders>{children}</SidebarProviders>
    </ClientSessionGuard>
  );
}
