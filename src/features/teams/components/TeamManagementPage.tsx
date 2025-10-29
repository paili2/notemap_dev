"use client";

import { Card } from "@/components/atoms/Card/Card";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Users, User } from "lucide-react";
import Link from "next/link";
import { CreateTeamForm } from "./CreateTeamForm";
import { useTeams } from "../hooks/useTeams";
import { useToast } from "@/hooks/use-toast";

export default function TeamManagementPage() {
  const { data: teams = [], isLoading, error } = useTeams();
  const { toast } = useToast();

  if (error) {
    toast({
      title: "팀 목록 로드 실패",
      description: "백엔드 서버를 확인해주세요.",
      variant: "destructive",
    });
  }

  const handleTeamCreated = () => {
    // React Query가 자동으로 캐시를 무효화하고 다시 불러옴
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        <header>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">팀 관리</h1>
              <p className="text-sm text-muted-foreground">
                전체 팀을 관리하고 각 팀의 상세 정보를 확인할 수 있습니다.
              </p>
            </div>
            <CreateTeamForm onTeamCreated={handleTeamCreated} />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">팀 관리</h1>
            <p className="text-sm text-muted-foreground">
              전체 팀을 관리하고 각 팀의 상세 정보를 확인할 수 있습니다.
            </p>
          </div>
          <CreateTeamForm onTeamCreated={handleTeamCreated} />
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
              <Badge variant={team.isActive ? "default" : "secondary"}>
                {team.isActive ? "활성" : "비활성"}
              </Badge>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>코드: {team.code}</span>
              </div>

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

              {team.description && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">설명:</span> {team.description}
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
            새 팀을 생성하여 시작하세요.
          </p>
        </div>
      )}
    </div>
  );
}
