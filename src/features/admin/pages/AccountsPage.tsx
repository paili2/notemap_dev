"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccountsList, AccountListItem } from "@/features/users/api/account";
import AccountsListPage from "@/features/users/components/_AccountsListPage";
import type { UserRow, RoleKey } from "@/features/users/types";
import { api } from "@/shared/api/api";
import { useToast } from "@/hooks/use-toast";

export default function AccountsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 계정 목록 조회
  const {
    data: accountsList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["accounts-list"],
    queryFn: getAccountsList,
  });

  // 계정 비활성화
  const disableAccountMutation = useMutation({
    mutationFn: async ({
      credentialId,
      disabled,
    }: {
      credentialId: string;
      disabled: boolean;
    }) => {
      const response = await api.patch<{
        message: string;
        data: { id: string };
      }>(`/dashboard/accounts/credentials/${credentialId}/disable`, {
        disabled,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-list"] });
      toast({
        title: "계정 상태 변경 완료",
        description: "계정 상태가 성공적으로 변경되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "계정 상태 변경 실패",
        description:
          error?.response?.data?.message || "계정 상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 백엔드 응답을 UserRow 형식으로 변환
  const transformToUserRows = (accounts: AccountListItem[]): UserRow[] => {
    return accounts.map((account) => {
      // role 매핑: backend role -> frontend RoleKey
      let frontendRole: RoleKey = "staff";
      if (account.role === "admin") {
        frontendRole = "owner";
      } else if (account.role === "manager") {
        frontendRole = "team_leader";
      } else if (account.role === "staff") {
        frontendRole = "staff";
      }

      return {
        id: account.id,
        name: account.name || "이름 없음",
        email: account.email,
        role: frontendRole,
        phone: account.phone || undefined,
        positionRank: undefined, // 목록 API에는 positionRank가 없음
        photo_url: undefined, // 목록 API에는 photo_url이 없음
      };
    });
  };

  // 계정 제거/비활성화 핸들러
  const handleRemove = (credentialId: string) => {
    // 계정 비활성화로 처리
    if (
      confirm("해당 계정을 비활성화하시겠습니까? 비활성화된 계정은 로그인할 수 없습니다.")
    ) {
      disableAccountMutation.mutate({
        credentialId,
        disabled: true,
      });
    }
  };

  // 역할 변경 핸들러 (현재는 사용하지 않지만 Props에 필요)
  const handleChangeRole = (id: string, role: RoleKey) => {
    // TODO: 역할 변경 기능이 필요하면 구현
    console.log("역할 변경:", { id, role });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">계정 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        <div className="text-center py-12">
          <p className="text-destructive">
            계정 목록을 불러오는 중 오류가 발생했습니다.
          </p>
        </div>
      </div>
    );
  }

  const userRows = accountsList ? transformToUserRows(accountsList) : [];

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">계정 목록</h1>
        <p className="text-sm text-muted-foreground">
          등록된 모든 계정을 조회하고 관리합니다.
        </p>
      </header>

      <div className="p-1 pb-8">
        <AccountsListPage
          rows={userRows}
          onChangeRole={handleChangeRole}
          onRemove={handleRemove}
        />
      </div>
    </div>
  );
}
