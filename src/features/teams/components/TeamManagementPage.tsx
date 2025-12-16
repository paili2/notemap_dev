"use client";

import { Card } from "@/components/atoms/Card/Card";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Users, User, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTeams, useDeleteTeam } from "../hooks/useTeams";
import { useToast } from "@/hooks/use-toast";

export default function TeamManagementPage() {
  const { data: teams = [], isLoading, error } = useTeams();
  const { toast } = useToast();
  const deleteTeamMutation = useDeleteTeam();

  if (error) {
    toast({
      title: "팀 목록 로드 실패",
      description: "백엔드 서버를 확인해주세요.",
      variant: "destructive",
    });
  }

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (
      !confirm(
        `정말 "${teamName}" 팀을 삭제하시겠습니까?\n삭제 후에는 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    try {
      await deleteTeamMutation.mutateAsync(String(teamId));
      toast({
        title: "팀 삭제 완료",
        description: `${teamName} 팀이 성공적으로 삭제되었습니다.`,
      });
    } catch (error: any) {
      console.error("팀 삭제 실패:", error);
      toast({
        title: "팀 삭제 실패",
        description:
          error?.response?.data?.message || "팀 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        <header>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">팀 관리</h1>
            <p className="text-sm text-muted-foreground">
              전체 팀 목록을 조회하고 각 팀의 상세 정보를 확인할 수 있습니다.
            </p>
          </div>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              팀 목록을 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      <header>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">팀 관리</h1>
          <p className="text-sm text-muted-foreground">
            전체 팀 목록을 조회하고 각 팀의 상세 정보를 확인할 수 있습니다.
            <br />
            <span className="text-xs">
              팀은 팀장 직급 계정 생성 시 자동으로 생성됩니다.
            </span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">{team.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={team.isActive ? "default" : "secondary"}>
                  {team.isActive ? "활성" : "비활성"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteTeam(String(team.id), team.name)}
                  disabled={deleteTeamMutation.isPending}
                  title="팀 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>멤버 수: {team.memberCount}명</span>
              </div>

              {team.teamLeaderName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>팀장: {team.teamLeaderName}</span>
                </div>
              )}
            </div>

            <Link
              href={`/admin/team-management/${encodeURIComponent(
                String(team.id)
              )}`}
            >
              <Button className="w-full">{team.name} 관리</Button>
            </Link>
          </Card>
        ))}
      </div>

      {teams.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">팀이 없습니다</h3>
          <p className="text-muted-foreground mb-4">
            팀장 직급으로 계정을 생성하면 팀이 자동으로 생성됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
