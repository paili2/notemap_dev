"use client";

import { useState, useEffect, useMemo } from "react";
import { UserPlus, UserCog } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";

import AccountsListPage from "@/features/users/components/_AccountsListPage";
import { UnassignedEmployeesModal } from "@/features/unassigned-employees";
import { AssignManagerModal } from "@/features/teams/components/AssignManagerModal";

import type { RoleKey, UserRow } from "@/features/users/types";
import type { TeamMemberDetail } from "@/features/teams";
import {
  useRemoveTeamMember,
  useAssignTeamMember,
} from "@/features/teams/hooks/useTeams";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getProfile } from "@/features/users/api/account";

interface UserSettingsPageProps {
  teamId?: string;
  members?: TeamMemberDetail[];
}

export default function UserSettingsPage({
  teamId,
  members,
}: UserSettingsPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const removeTeamMemberMutation = useRemoveTeamMember();
  const assignTeamMemberMutation = useAssignTeamMember();

  // 프로필 정보 가져오기 (admin 권한 체크용)
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 10 * 60 * 1000, // 10분
  });

  const isAdmin = profile?.role === "admin";

  // API에서 받은 멤버 데이터를 UserRow 형식으로 변환
  const usersFromApi = useMemo<UserRow[]>(() => {
    if (!members || members.length === 0) return [];

    return members.map((member) => ({
      id: member.accountId,
      name: member.name || "이름 없음",
      email: "", // API에 이메일 정보가 없음
      role: member.teamRole === "manager" ? "team_leader" : "staff",
      phone: member.phone || undefined,
      positionRank: member.positionRank || undefined,
      photo_url: member.photoUrl || undefined,
    }));
  }, [members]);

  const [users, setUsers] = useState<UserRow[]>(usersFromApi);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignManagerModalOpen, setIsAssignManagerModalOpen] =
    useState(false);

  // members가 변경되면 users 상태 업데이트
  useEffect(() => {
    setUsers(usersFromApi);
  }, [usersFromApi]);

  const updateUser = (id: string, patch: Partial<UserRow>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        return { ...u, ...patch };
      })
    );
  };

  const removeUser = async (id: string) => {
    // teamId와 members가 있으면 API 호출 (팀 관리 페이지)
    if (teamId && members) {
      // 해당 사용자의 teamMemberId 찾기
      const member = members.find((m) => m.accountId === id);
      if (member?.teamMemberId) {
        try {
          await removeTeamMemberMutation.mutateAsync(member.teamMemberId);
          toast({
            title: "팀원 삭제 완료",
            description: "팀에서 해당 직원이 제거되었습니다.",
          });
          queryClient.invalidateQueries({ queryKey: ["team", teamId] });
        } catch (error: any) {
          toast({
            title: "팀원 삭제 실패",
            description: "팀원 삭제 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        }
      }
    } else {
      // 로컬 상태만 업데이트 (팀 관리 페이지가 아닌 경우)
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const handleAddToTeam = async (employeeId: string) => {
    if (!teamId) {
      toast({
        title: "오류",
        description: "팀 정보를 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignTeamMemberMutation.mutateAsync({
        teamId: teamId,
        accountId: employeeId,
        role: "staff", // 기본값으로 staff 설정
        isPrimary: true, // 기본값으로 주팀으로 설정
      });

      toast({
        title: "팀원 추가 완료",
        description: "팀에 해당 직원이 추가되었습니다.",
      });

      // 모달 닫기
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
    } catch (error: any) {
      toast({
        title: "팀원 추가 실패",
        description: "팀원 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 현재 팀장 찾기
  const currentManager = members?.find(
    (member) => member.teamRole === "manager"
  );

  const handleManagerAssigned = () => {
    // 팀 상세 정보 새로고침
    if (teamId) {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-8">
      <div className="flex justify-end gap-2">
        {isAdmin && teamId && members && members.length > 0 && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsAssignManagerModalOpen(true)}
          >
            <UserCog className="h-4 w-4" />
            팀장 지정
          </Button>
        )}
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          팀원 추가
        </Button>
      </div>

      {teamId && (
        <>
          <UnassignedEmployeesModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onAddToTeam={handleAddToTeam}
          />
          {isAdmin && members && (
            <AssignManagerModal
              open={isAssignManagerModalOpen}
              onOpenChange={setIsAssignManagerModalOpen}
              teamId={teamId}
              members={members}
              currentManagerId={currentManager?.accountId}
              onSuccess={handleManagerAssigned}
            />
          )}
        </>
      )}

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
