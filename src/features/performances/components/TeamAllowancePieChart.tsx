import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface TeamStat {
  team: string;
  totalAllowance: number;
  totalContracts: number;
  memberCount: number;
  avgAllowance: number;
}

interface TeamAllowancePieChartProps {
  teamStats: TeamStat[];
  chartConfig: {
    totalAllowance: {
      label: string;
      color: string;
    };
    finalAllowance: {
      label: string;
      color: string;
    };
    contractCount: {
      label: string;
      color: string;
    };
  };
  pieColors: string[];
}

export function TeamAllowancePieChart({
  teamStats,
  chartConfig,
  pieColors,
}: TeamAllowancePieChartProps) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">
          팀별 최종수당 비율
        </CardTitle>
        <p className="text-sm text-muted-foreground">각 팀의 수당 비중</p>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[300px]">
          <PieChart>
            <Pie
              data={teamStats}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ team, percent }) =>
                `${team} ${(percent * 100).toFixed(1)}%`
              }
              outerRadius={80}
              dataKey="totalAllowance"
            >
              {teamStats.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={pieColors[index % pieColors.length]}
                />
              ))}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value: number) => [
                `${(value / 10000).toLocaleString()}만원`,
                "총 수당",
              ]}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
