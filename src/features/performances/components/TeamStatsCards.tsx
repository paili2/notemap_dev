import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import { formatCurrency } from "@/components/contract-management/utils/contractUtils";

interface TeamStat {
  team: string;
  totalAllowance: number; // 팀별 총 금액
  totalContracts: number; // 팀별 건수
  memberCount: number;
  avgAllowance: number;
  totalSupport?: number; // 팀별 지원금 (옵션)
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
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">팀 실적</h2>
      
      {/* 팀별 카드 그리드 - 반응형 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teamStats.map((stat) => {
          const teamNetProfit = stat.totalAllowance - (stat.totalSupport || 0);
          return (
            <Card
              key={stat.team}
              className={`cursor-pointer transition-shadow ${
                selectedTeamDetail === stat.team ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
              }`}
              onClick={() =>
                onTeamSelect(selectedTeamDetail === stat.team ? null : stat.team)
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">{stat.team}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">팀별 총 금액:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(stat.totalAllowance)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">팀별 건수:</span>
                  <span className="font-semibold text-gray-900">
                    {stat.totalContracts.toLocaleString()}건
                  </span>
                </div>
                {stat.totalSupport !== undefined && stat.totalSupport > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">팀별 순수익:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(teamNetProfit)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">인원수:</span>
                  <span className="font-semibold text-gray-700">
                    {stat.memberCount}명
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
