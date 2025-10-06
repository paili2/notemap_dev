import type { PerformanceData } from "../types/PerformanceData";

export interface TeamStat {
  team: string;
  totalAllowance: number;
  totalContracts: number;
  memberCount: number;
  avgAllowance: number;
}

export interface PerformanceStats {
  totalContracts: number;
  totalAllowance: number;
  totalEmployees: number;
}

export function calculateTeamStats(
  performanceData: PerformanceData[]
): TeamStat[] {
  const stats: Record<
    string,
    { totalAllowance: number; totalContracts: number; memberCount: number }
  > = {};

  performanceData.forEach((item) => {
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
}

export function calculateOverallStats(
  performanceData: PerformanceData[]
): PerformanceStats {
  const totalContracts = performanceData.reduce(
    (sum, item) => sum + item.contractCount,
    0
  );
  const totalAllowance = performanceData.reduce(
    (sum, item) => sum + item.finalAllowance,
    0
  );
  const totalEmployees = performanceData.length;

  return {
    totalContracts,
    totalAllowance,
    totalEmployees,
  };
}

export function getTeamMembers(
  performanceData: PerformanceData[],
  teamName: string
): PerformanceData[] {
  return performanceData.filter((item) => item.team === teamName);
}

export function generateYearOptions(currentYear: number): string[] {
  return Array.from({ length: 6 }, (_, i) => {
    const year = currentYear - 5 + i;
    return year.toString();
  });
}
