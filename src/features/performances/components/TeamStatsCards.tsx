import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";

interface TeamStat {
  team: string;
  totalAllowance: number;
  totalContracts: number;
  memberCount: number;
  avgAllowance: number;
}

interface TeamStatsCardsProps {
  teamStats: TeamStat[];
  selectedTeamDetail: string | null;
  onTeamSelect: (team: string | null) => void;
}

export function TeamStatsCards({
  teamStats,
  selectedTeamDetail,
  onTeamSelect,
}: TeamStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {teamStats.map((stat) => (
        <Card
          key={stat.team}
          className={`cursor-pointer ${
            selectedTeamDetail === stat.team ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() =>
            onTeamSelect(selectedTeamDetail === stat.team ? null : stat.team)
          }
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{stat.team}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">인원:</span>
              <span className="font-semibold">{stat.memberCount}명</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-gray-600">총 수당:</span>
              <span className="font-bold text-blue-600">
                {(stat.totalAllowance / 10000).toLocaleString()}만원
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
