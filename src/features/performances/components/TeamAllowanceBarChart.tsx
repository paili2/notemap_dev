import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
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

interface TeamAllowanceBarChartProps {
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
}

export function TeamAllowanceBarChart({
  teamStats,
  chartConfig,
}: TeamAllowanceBarChartProps) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">
          팀별 최종수당 비교
        </CardTitle>
        <p className="text-sm text-muted-foreground">각 팀의 총 최종수당</p>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[300px]">
          <BarChart
            data={teamStats}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted"
              vertical={false}
            />
            <XAxis
              dataKey="team"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) =>
                `${(value / 10000000).toFixed(0)}천`
              }
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="totalAllowance"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              <LabelList
                dataKey="totalAllowance"
                position="top"
                offset={10}
                formatter={(value: number) =>
                  `${(Number(value) / 10000).toLocaleString()}만원`
                }
                style={{
                  fontSize: "12px",
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
