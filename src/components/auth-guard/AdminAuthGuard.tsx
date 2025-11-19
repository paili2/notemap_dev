"use client";

import { useAdminAuth } from "@/hooks/useAdminAuth";

type Props = {
  children: React.ReactNode;
  redirectTo?: string;
};

/**
 * admin 권한을 체크하고, admin이 아니면 리다이렉트
 * 권한 확인 중에는 로딩 화면을 표시
 */
export function AdminAuthGuard({ children, redirectTo = "/" }: Props) {
  const { isLoading } = useAdminAuth(redirectTo);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            권한을 확인하는 중...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
