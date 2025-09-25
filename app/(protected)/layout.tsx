import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: 실제 쿠키 이름/검증 로직으로 바꾸세요 (예: 'session', 'access_token' 등)
  const token = cookies().get("session")?.value;

  if (!token) {
    // 로그인 후 돌아갈 경로를 쿼리로 넘기고 싶다면 search 포함해서 구성해도 됨
    redirect("/login");
  }

  return <>{children}</>;
}
