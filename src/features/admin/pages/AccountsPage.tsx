"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccountsList, AccountListItem } from "@/features/users/api/account";
import AccountsListPage from "@/features/users/components/_AccountsListPage";
import AccountEditFormModal from "@/features/users/components/_AccountEditFormModal";
import { AccountFavoritesModal } from "@/features/account-favorites";
import type { UserRow, RoleKey } from "@/features/users/types";
import { api } from "@/shared/api/api";
import { useToast } from "@/hooks/use-toast";

const mockAccounts: AccountListItem[] = [
  {
    id: "mock-1",
    email: "manager@example.com",
    role: "manager",
    disabled: false,
    name: "홍길동",
    phone: "010-1234-5678",
  },
  {
    id: "mock-2",
    email: "staff1@example.com",
    role: "staff",
    disabled: false,
    name: "김철수",
    phone: "010-2222-3333",
  },
  {
    id: "mock-3",
    email: "staff2@example.com",
    role: "staff",
    disabled: true,
    name: "이영희",
    phone: "010-4444-5555",
  },
];

export default function AccountsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCredentialId, setEditingCredentialId] = useState<string | null>(null);
  const [viewingFavoritesAccountId, setViewingFavoritesAccountId] = useState<string | null>(null);
  const [viewingFavoritesAccountName, setViewingFavoritesAccountName] = useState<string>("");

  // 계정 목록 조회 (API 연결 전까지 비활성화)
  // TODO: API 연결 시 활성화
  const {
    data: accountsList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["accounts-list"],
    queryFn: getAccountsList,
    enabled: false, // API 연결 전까지 비활성화
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
    // 모의 데이터일 때는 동작만 안내
    if (error) {
      toast({
        title: "모의 데이터",
        description: "API 오류로 임시 데이터를 표시 중입니다. 삭제는 비활성화되어 있습니다.",
      });
      return;
    }

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

  // 계정 수정 핸들러
  const handleEdit = (credentialId: string) => {
    setEditingCredentialId(credentialId);
  };

  // 수정 완료 핸들러
  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["accounts-list"] });
    setEditingCredentialId(null);
  };

  // 즐겨찾기 목록 보기 핸들러
  const handleViewFavorites = (accountId: string) => {
    const account = userRows.find((row) => row.id === accountId);
    setViewingFavoritesAccountId(accountId);
    setViewingFavoritesAccountName(account?.name || "");
  };

  // 즐겨찾기 모달 닫기
  const handleCloseFavoritesModal = () => {
    setViewingFavoritesAccountId(null);
    setViewingFavoritesAccountName("");
  };

  // API 연결 전까지 mock 데이터 사용
  const isUsingMock = true; // API 연결 전까지 항상 mock 사용
  const sourceAccounts = mockAccounts;
  const userRows = transformToUserRows(sourceAccounts);

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">계정 목록</h1>
        <p className="text-sm text-muted-foreground">
          등록된 모든 계정을 조회하고 관리합니다.
        </p>
      </header>

      {isUsingMock && (
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          API 오류로 임시 데이터를 표시 중입니다. 백엔드 복구 후 다시 시도해주세요.
        </div>
      )}

      <div className="p-1 pb-8">
        <AccountsListPage
          rows={userRows}
          onChangeRole={handleChangeRole}
          onRemove={handleRemove}
          onEdit={handleEdit}
          onViewFavorites={handleViewFavorites}
        />
      </div>

      {/* 계정 수정 모달 */}
      {editingCredentialId && (
        <AccountEditFormModal
          open={true}
          credentialId={editingCredentialId}
          onClose={() => setEditingCredentialId(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* 즐겨찾기 목록 모달 */}
      <AccountFavoritesModal
        open={!!viewingFavoritesAccountId}
        accountId={viewingFavoritesAccountId}
        accountName={viewingFavoritesAccountName}
        onClose={handleCloseFavoritesModal}
      />
    </div>
  );
}
