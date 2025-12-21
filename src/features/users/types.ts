export type RoleKey =
  | "owner"
  | "manager"
  | "team_leader"
  | "deputy_manager"
  | "general_manager"
  | "department_head"
  | "staff";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  phone?: string;
  positionRank?: string;
  photo_url?: string;
  joinedAt?: string | null; // 팀 가입일 (팀 멤버 목록용)
  teamName?: string; // 팀 이름 (부서 표시용)
  isFavorite?: boolean; // 즐겨찾기 여부
};
