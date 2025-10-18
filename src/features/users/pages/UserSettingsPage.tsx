"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";

import AccountsListPage from "@/features/users/components/_AccountsListPage";
import { UnassignedEmployeesModal } from "@/features/unassigned-employees";

import type { RoleKey, UserRow } from "@/features/users/types";
import { DEFAULT_USERS } from "@/features/users/_mock";

export default function UserSettingsPage() {
  const [users, setUsers] = useState<UserRow[]>(DEFAULT_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateUser = (id: string, patch: Partial<UserRow>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        return { ...u, ...patch };
      })
    );
  };

  const removeUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleAddToTeam = (employeeId: string) => {
    console.log("팀에 추가된 직원 ID:", employeeId);
    // TODO: API 연동하여 실제 팀에 추가
    // TODO: 성공 시 users 목록 새로고침
  };

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-8">
      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          팀원 추가
        </Button>
      </div>

      <UnassignedEmployeesModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAddToTeam={handleAddToTeam}
      />

      <div className="p-1 pb-8">
        <AccountsListPage
          rows={users}
          onChangeRole={(id: string, role: RoleKey) => updateUser(id, { role })}
          onRemove={(id: string) => removeUser(id)}
        />
      </div>
    </main>
  );
}
