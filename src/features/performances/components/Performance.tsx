"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Label } from "@/components/atoms/Label/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";
import { Table } from "@/features/table/components/Table";
import { TrendingUp, DollarSign, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { PerformanceData } from "../types/PerformanceData";
import { COLORS } from "../types/PerformanceData";
import { mockPerformanceData } from "../data/data";

export function Performance() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<string | null>(
    null
  );

  // Chart configuration
  const chartConfig = {
    totalAllowance: {
      label: "총 수당",
      color: "hsl(var(--primary))",
    },
    finalAllowance: {
      label: "최종수당",
      color: "hsl(var(--primary))",
    },
    contractCount: {
      label: "계약 건수",
      color: "hsl(var(--secondary))",
    },
  };

  // 파이 차트용 색상 배열
  const pieColors = [
    "#3b82f6", // 파란색
    "#10b981", // 초록색
    "#f59e0b", // 주황색
    "#ef4444", // 빨간색
    "#8b5cf6", // 보라색
    "#06b6d4", // 청록색
    "#84cc16", // 라임색
    "#f97316", // 오렌지색
  ];

  // 연도 옵션 생성 (현재 년도가 제일 끝에 오도록)
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const year = currentYear - 5 + i;
    return year.toString();
  });

  // 팀별 통계 계산
  const teamStats = useMemo(() => {
    const stats: Record<
      string,
      { totalAllowance: number; totalContracts: number; memberCount: number }
    > = {};

    mockPerformanceData.forEach((item) => {
      if (!stats[item.team]) {
        stats[item.team] = {
          totalAllowance: 0,
          totalContracts: 0,
          memberCount: 0,
        };
      }
      stats[item.team].totalAllowance += item.finalAllowance;
      stats[item.team].totalContracts += item.contractCount;
      stats[item.team].memberCount += 1;
    });

    return Object.entries(stats)
      .map(([team, data]) => ({
        team,
        totalAllowance: data.totalAllowance,
        totalContracts: data.totalContracts,
        memberCount: data.memberCount,
        avgAllowance: data.totalAllowance / data.memberCount,
      }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }, [mockPerformanceData]);

  // 선택된 팀의 직원별 데이터
  const selectedTeamMembers = useMemo(() => {
    if (!selectedTeamDetail) return [];
    return mockPerformanceData.filter(
      (item) => item.team === selectedTeamDetail
    );
  }, [selectedTeamDetail]);

  // 전체 통계 계산
  const totalContracts = mockPerformanceData.reduce(
    (sum, item) => sum + item.contractCount,
    0
  );
  const totalAllowance = mockPerformanceData.reduce(
    (sum, item) => sum + item.finalAllowance,
    0
  );
  const totalEmployees = mockPerformanceData.length;

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6 bg-gray-50">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">실적 확인</h1>
        <p className="text-gray-600 mt-1">영업자 계약기록 기반 실적 분석</p>
      </div>

      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  총 계약 건수
                </p>
                <p className="text-2xl font-bold">{totalContracts}건</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 최종수당</p>
                <p className="text-2xl font-bold">
                  {(totalAllowance / 10000).toLocaleString()}만원
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 직원 수</p>
                <div className="text-2xl font-bold">{totalEmployees}명</div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 팀별 실적 그래프 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 팀별 최종수당 비교 (바 차트) */}
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

        {/* 팀별 최종수당 비율 (파이 차트) */}
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
      </div>

      {/* 팀별 상세 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {teamStats.map((stat, index) => (
          <Card
            key={stat.team}
            className={`cursor-pointer ${
              selectedTeamDetail === stat.team ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() =>
              setSelectedTeamDetail(
                selectedTeamDetail === stat.team ? null : stat.team
              )
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

      {/* 선택된 팀의 직원별 상세 정보 */}
      {selectedTeamDetail && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  {selectedTeamDetail} 직원별 실적
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">기간:</Label>
                    <Select
                      value={selectedPeriod}
                      onValueChange={setSelectedPeriod}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">이번 달</SelectItem>
                        <SelectItem value="year">올해</SelectItem>
                        <SelectItem value="yearly">연도 선택</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedPeriod === "yearly" && (
                      <Select
                        value={selectedYear}
                        onValueChange={setSelectedYear}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTeamDetail(null)}
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 직원별 최종수당 바 차트 */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">
                    직원별 최종수당
                  </h4>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <BarChart
                      data={selectedTeamMembers}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="employeeName"
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
                          `${(value / 10000).toFixed(0)}만`
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="finalAllowance"
                        fill="hsl(var(--primary))"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={30}
                      >
                        <LabelList
                          dataKey="finalAllowance"
                          position="top"
                          offset={8}
                          formatter={(value: number) =>
                            `${(Number(value) / 10000).toLocaleString()}만원`
                          }
                          style={{
                            fontSize: "10px",
                            fill: "hsl(var(--muted-foreground))",
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* 직원별 계약 건수 바 차트 */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">
                    직원별 계약 건수
                  </h4>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <BarChart
                      data={selectedTeamMembers}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="employeeName"
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
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="contractCount"
                        fill="hsl(var(--secondary))"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={30}
                      >
                        <LabelList
                          dataKey="contractCount"
                          position="top"
                          offset={8}
                          formatter={(value: number) => `${value}건`}
                          style={{
                            fontSize: "10px",
                            fill: "hsl(var(--muted-foreground))",
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>

              {/* 직원별 상세 목록 */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">직원별 상세 정보</h4>
                <Table
                  data={selectedTeamMembers}
                  columns={[
                    {
                      key: "employeeName",
                      label: "직원명",
                      sortable: true,
                    },
                    {
                      key: "contractCount",
                      label: "계약 건수",
                      sortable: true,
                      align: "center",
                      render: (value) => `${value}건`,
                    },
                    {
                      key: "finalAllowance",
                      label: "최종수당",
                      sortable: true,
                      align: "right",
                      render: (value) => (
                        <span className="font-bold text-gray-900">
                          {(value / 10000).toLocaleString()}만원
                        </span>
                      ),
                    },
                    {
                      key: "period",
                      label: "기간",
                      sortable: true,
                      align: "center",
                    },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
