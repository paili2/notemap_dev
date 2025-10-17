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
};
