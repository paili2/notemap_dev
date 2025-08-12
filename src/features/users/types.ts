export type RoleKey = "owner" | "manager" | "staff";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  active: boolean;
  protected?: boolean; // 메인관리자 보호
};
