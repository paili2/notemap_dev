"use client";

import { Button } from "@/components/atoms/Button/Button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTeam, useRemoveTeamMember } from "../hooks/useTeams";
import UserSettingsPage from "@/features/users/pages/UserSettingsPage";
import { useToast } from "@/hooks/use-toast";

interface TeamDetailPageProps {
  teamId: string;
}

export default function TeamDetailPage({ teamId }: TeamDetailPageProps) {
  const decodedTeamId = decodeURIComponent(teamId);
  const { data: team, isLoading, error } = useTeam(decodedTeamId);
  const { toast } = useToast();

  if (error) {
    toast({
      title: "팀 정보 로드 실패",
      description: "팀 정보를 불러올 수 없습니다.",
      variant: "destructive",
    });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              팀 정보를 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        <div className="text-center py-12">
          <p className="text-lg font-semibold mb-2">팀을 찾을 수 없습니다</p>
          <Link href="/admin/team-management">
            <Button variant="outline" size="sm" className="mt-4">
              팀 목록으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      <div className="px-6 flex-col items-center">
        <Link href="/admin/team-management">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />팀 목록으로
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight pt-4">
            {team.name} 관리
          </h1>
          <p className="text-sm text-muted-foreground pt-2">
            {team.name} 팀원 계정을 조회하고 관리합니다.
          </p>
        </div>
      </div>

      <div className="p-1 pb-8">
        <UserSettingsPage teamId={decodedTeamId} members={team.members} />
      </div>
    </div>
  );
}
