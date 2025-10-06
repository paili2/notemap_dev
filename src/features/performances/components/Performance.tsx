"use client";

import { useState, useMemo } from "react";
import type { PerformanceData } from "../types/PerformanceData";
import { mockPerformanceData } from "../data/data";
import { StatsCards } from "./StatsCards";
import { TeamStatsCards } from "./TeamStatsCards";
import { TeamAllowanceBarChart } from "./TeamAllowanceBarChart";
import { TeamAllowancePieChart } from "./TeamAllowancePieChart";
import { TeamDetailView } from "./TeamDetailView";
import {
  calculateTeamStats,
  calculateOverallStats,
  getTeamMembers,
  generateYearOptions,
} from "../utils/performanceUtils";
import { CHART_CONFIG, PIE_COLORS } from "../utils/chartConfig";

export function Performance() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<string | null>(
    null
  );

  // 연도 옵션 생성
  const yearOptions = generateYearOptions(currentYear);

  // 팀별 통계 계산
  const teamStats = useMemo(() => {
    return calculateTeamStats(mockPerformanceData);
  }, [mockPerformanceData]);

  // 선택된 팀의 직원별 데이터
  const selectedTeamMembers = useMemo(() => {
    if (!selectedTeamDetail) return [];
    return getTeamMembers(mockPerformanceData, selectedTeamDetail);
  }, [selectedTeamDetail]);

  // 전체 통계 계산
  const { totalContracts, totalAllowance, totalEmployees } = useMemo(() => {
    return calculateOverallStats(mockPerformanceData);
  }, [mockPerformanceData]);

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6 bg-gray-50">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">실적 확인</h1>
        <p className="text-gray-600 mt-1">영업자 계약기록 기반 실적 분석</p>
      </div>

      {/* 전체 통계 카드 */}
      <StatsCards
        totalContracts={totalContracts}
        totalAllowance={totalAllowance}
        totalEmployees={totalEmployees}
      />

      {/* 팀별 실적 그래프 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamAllowanceBarChart
          teamStats={teamStats}
          chartConfig={CHART_CONFIG}
        />
        <TeamAllowancePieChart
          teamStats={teamStats}
          chartConfig={CHART_CONFIG}
          pieColors={PIE_COLORS}
        />
      </div>

      {/* 팀별 상세 통계 카드 */}
      <TeamStatsCards
        teamStats={teamStats}
        selectedTeamDetail={selectedTeamDetail}
        onTeamSelect={setSelectedTeamDetail}
      />

      {/* 선택된 팀의 직원별 상세 정보 */}
      <TeamDetailView
        selectedTeamDetail={selectedTeamDetail}
        selectedTeamMembers={selectedTeamMembers}
        selectedPeriod={selectedPeriod}
        selectedYear={selectedYear}
        yearOptions={yearOptions}
        chartConfig={CHART_CONFIG}
        onPeriodChange={setSelectedPeriod}
        onYearChange={setSelectedYear}
        onClose={() => setSelectedTeamDetail(null)}
      />
    </div>
  );
}
