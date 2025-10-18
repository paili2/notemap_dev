import { Card } from "@/components/atoms/Card/Card";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Users, User } from "lucide-react";
import Link from "next/link";
import { MOCK_TEAM_SUMMARIES, MOCK_TEAMS } from "../_mock";

export default function TeamManagementPage() {
  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">팀 관리</h1>
        <p className="text-sm text-muted-foreground">
          전체 팀을 관리하고 각 팀의 상세 정보를 확인할 수 있습니다.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_TEAM_SUMMARIES.map((team) => (
          <Card key={team.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">{team.name}</h3>
              </div>
              <Badge variant="secondary">{team.memberCount}명</Badge>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>팀장: {team.teamLeaderName || "미지정"}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  팀원:{" "}
                  {MOCK_TEAMS.find((t) => t.id === team.id)
                    ?.members.filter((m) => m.role !== "team_leader")
                    .map((m) => m.name)
                    .join(", ")}
                </span>
              </div>
            </div>

            <Link href={`/admin/team-management/${team.id}`}>
              <Button className="w-full">{team.name} 관리</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
