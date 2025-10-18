import { Team, TeamMember, TeamSummary } from "./types";

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  // 1팀
  {
    id: "tm-1",
    name: "박경수",
    email: "kyungsoo@example.com",
    role: "team_leader",
    teamId: "team-1",
  },
  {
    id: "tm-2",
    name: "이민아",
    email: "mina@example.com",
    role: "deputy_manager",
    teamId: "team-1",
  },
  {
    id: "tm-3",
    name: "김철수",
    email: "chulsoo@example.com",
    role: "staff",
    teamId: "team-1",
  },
  {
    id: "tm-4",
    name: "최영희",
    email: "younghee@example.com",
    role: "staff",
    teamId: "team-1",
  },

  // 2팀
  {
    id: "tm-5",
    name: "정민수",
    email: "minsu@example.com",
    role: "team_leader",
    teamId: "team-2",
  },
  {
    id: "tm-6",
    name: "한소영",
    email: "soyoung@example.com",
    role: "general_manager",
    teamId: "team-2",
  },
  {
    id: "tm-7",
    name: "강태현",
    email: "taehyun@example.com",
    role: "staff",
    teamId: "team-2",
  },
  {
    id: "tm-8",
    name: "윤서연",
    email: "seoyeon@example.com",
    role: "staff",
    teamId: "team-2",
  },
  {
    id: "tm-9",
    name: "조현우",
    email: "hyunwoo@example.com",
    role: "staff",
    teamId: "team-2",
  },

  // 3팀
  {
    id: "tm-10",
    name: "송지훈",
    email: "jihoon@example.com",
    role: "team_leader",
    teamId: "team-3",
  },
  {
    id: "tm-11",
    name: "임수빈",
    email: "subin@example.com",
    role: "department_head",
    teamId: "team-3",
  },
  {
    id: "tm-12",
    name: "배준호",
    email: "junho@example.com",
    role: "staff",
    teamId: "team-3",
  },

  // 4팀
  {
    id: "tm-13",
    name: "오하늘",
    email: "haneul@example.com",
    role: "team_leader",
    teamId: "team-4",
  },
  {
    id: "tm-14",
    name: "신예린",
    email: "yerin@example.com",
    role: "staff",
    teamId: "team-4",
  },
  {
    id: "tm-15",
    name: "노재민",
    email: "jaemin@example.com",
    role: "staff",
    teamId: "team-4",
  },
];

export const MOCK_TEAMS: Team[] = [
  {
    id: "team-1",
    name: "1팀",
    teamLeader:
      MOCK_TEAM_MEMBERS.find(
        (m) => m.teamId === "team-1" && m.role === "team_leader"
      ) || null,
    members: MOCK_TEAM_MEMBERS.filter((m) => m.teamId === "team-1"),
    memberCount: MOCK_TEAM_MEMBERS.filter((m) => m.teamId === "team-1").length,
    createdAt: "2024-01-15",
  },
  {
    id: "team-2",
    name: "2팀",
    teamLeader:
      MOCK_TEAM_MEMBERS.find(
        (m) => m.teamId === "team-2" && m.role === "team_leader"
      ) || null,
    members: MOCK_TEAM_MEMBERS.filter((m) => m.teamId === "team-2"),
    memberCount: MOCK_TEAM_MEMBERS.filter((m) => m.teamId === "team-2").length,
    createdAt: "2024-02-01",
  },
  {
    id: "team-3",
    name: "3팀",
    teamLeader:
      MOCK_TEAM_MEMBERS.find(
        (m) => m.teamId === "team-3" && m.role === "team_leader"
      ) || null,
    members: MOCK_TEAM_MEMBERS.filter((m) => m.teamId === "team-3"),
    memberCount: MOCK_TEAM_MEMBERS.filter((m) => m.teamId === "team-3").length,
    createdAt: "2024-02-15",
  },
  {
    id: "team-4",
    name: "4팀",
    teamLeader:
      MOCK_TEAM_MEMBERS.find(
        (m) => m.teamId === "team-4" && m.role === "team_leader"
      ) || null,
    members: MOCK_TEAM_MEMBERS.filter((m) => m.teamId === "team-4"),
    memberCount: MOCK_TEAM_MEMBERS.filter((m) => m.teamId === "team-4").length,
    createdAt: "2024-03-01",
  },
];

export const MOCK_TEAM_SUMMARIES: TeamSummary[] = MOCK_TEAMS.map((team) => ({
  id: team.id,
  name: team.name,
  teamLeaderName: team.teamLeader?.name || null,
  memberCount: team.memberCount,
  createdAt: team.createdAt,
}));
