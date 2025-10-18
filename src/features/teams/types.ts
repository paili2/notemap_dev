export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role:
    | "team_leader"
    | "deputy_manager"
    | "general_manager"
    | "department_head"
    | "staff";
  teamId: string;
};

export type Team = {
  id: string;
  name: string;
  teamLeader: TeamMember | null;
  members: TeamMember[];
  memberCount: number;
  createdAt: string;
};

export type TeamSummary = {
  id: string;
  name: string;
  teamLeaderName: string | null;
  memberCount: number;
  createdAt: string;
};
