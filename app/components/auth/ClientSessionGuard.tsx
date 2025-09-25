"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** 브라우저 세션 마커(sessionStorage)가 없으면 /login 으로 보냄 */
export default function ClientSessionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const hasMarker = sessionStorage.getItem("nm_session") === "1";
    if (!hasMarker) {
      // 혹시 남아있을 서버 쿠키도 같이 지우고 이동
      fetch("/api/auth/logout", { method: "POST" }).finally(() => {
        router.replace("/login");
      });
      return;
    }
    setOk(true);
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
