import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { action } from "@storybook/addon-actions";
import AccountsListPage from "./_AccountsListPage";
import type { UserRow, RoleKey } from "../types";

const meta: Meta<typeof AccountsListPage> = {
  title: "pages/Settings/AccountsListPage",
  component: AccountsListPage,
  parameters: {
    react: { strictMode: false },
  },
};
export default meta;

type Story = StoryObj<typeof AccountsListPage>;

const rows: UserRow[] = [
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

export const Default: Story = {
  args: {
    rows,
    onChangeRole: (id: string, role: RoleKey) =>
      action("onChangeRole")(id, role),
    onToggleActive: (id: string, next: boolean) =>
      action("onToggleActive")(id, next),
    onRemove: (id: string) => action("onRemove")(id),
  },
};

export const Empty: Story = {
  args: {
    rows: [],
    onChangeRole: (id: string, role: RoleKey) =>
      action("onChangeRole")(id, role),
    onToggleActive: (id: string, next: boolean) =>
      action("onToggleActive")(id, next),
    onRemove: (id: string) => action("onRemove")(id),
  },
};
