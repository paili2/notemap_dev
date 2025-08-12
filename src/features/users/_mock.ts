import { UserRow } from "./types";

export const DEFAULT_USERS: UserRow[] = [
  {
    id: "u-1",
    name: "메인관리자",
    email: "owner@example.com",
    role: "owner",
    active: true,
    protected: true,
  },
  {
    id: "u-2",
    name: "박지훈",
    email: "jihoon@example.com",
    role: "manager",
    active: true,
  },
  {
    id: "u-3",
    name: "이민아",
    email: "mina@example.com",
    role: "staff",
    active: false,
  },
];
