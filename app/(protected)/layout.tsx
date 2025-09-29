import ClientSessionGuard from "app/components/auth/ClientSessionGuard";
import SidebarProviders from "./SidebarProviders"; // ✅ 추가
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버 쿠키 검사 (session_v2)
  const raw = cookies().get("session_v2")?.value;
  if (!raw) redirect("/login");

  try {
    const parsed = JSON.parse(raw);
    const BOOT_ID = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";
    if (parsed?.boot !== BOOT_ID) redirect("/login");
  } catch {
    redirect("/login");
  }

  // ✅ 클라이언트에서도 sessionStorage 마커 확인 + 사이드바 상태 Provider 주입
  return (
    <ClientSessionGuard>
      <SidebarProviders>{children}</SidebarProviders>
    </ClientSessionGuard>
  );
}
