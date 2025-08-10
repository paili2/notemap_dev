import type { Meta, StoryObj } from "@storybook/react";
import { SidebarHeader } from "./SidebarHeader";
import * as React from "react";

// 스토리 전용 props: 컴포넌트 props + __containerWidth
type StoryProps = React.ComponentProps<typeof SidebarHeader> & {
  __containerWidth?: number;
};

const withSidebarWidth = (Story: any, context: any) => {
  const width = context.args.__containerWidth ?? 280;
  return (
    <div
      style={{
        width,
        border: "1px dashed #e5e7eb",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <Story />
    </div>
  );
};

const meta: Meta<StoryProps> = {
  title: "organisms/SidebarHeader",
  component: SidebarHeader,
  decorators: [withSidebarWidth],
  parameters: { layout: "padded" },
  argTypes: {
    notificationsCount: {
      control: { type: "number", min: 0, max: 200, step: 1 },
    },
    logo: { control: false },
    onOpenNotifications: { action: "open notifications" },
    onOpenProfile: { action: "open profile" },
    onOpenSettings: { action: "open settings" },
    onSignOut: { action: "sign out" },
    __containerWidth: {
      name: "Sidebar width (storybook only)",
      control: { type: "range", min: 64, max: 360, step: 8 },
      table: { category: "storybook" },
    },
  },
  // 중요: render로 컴포넌트를 감싸주면 추가 필드가 있어도 TS가 허용
  render: (args) => <SidebarHeader {...args} />,
  args: {
    notificationsCount: 8,
    user: { name: "정서령", email: "seoryeong@example.com", role: "Manager" },
    logo: (
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="logo" className="h-6 w-6" />
        <span className="text-sm font-semibold truncate">NoteMap</span>
      </div>
    ),
    __containerWidth: 280,
  },
};

export default meta;

type Story = StoryObj<StoryProps>;

export const Default: Story = {};
export const ManyNotifications: Story = {
  args: { notificationsCount: 123 },
};
export const Compact: Story = {
  args: {
    __containerWidth: 72,
    logo: (
      <div className="flex items-center">
        <div className="h-6 w-6 rounded-md bg-primary/10" />
      </div>
    ),
  },
};
export const LongUserInfo: Story = {
  args: {
    user: {
      name: "김프론트엔드매니저-아주-아주-긴-이름",
      email: "really.long.email.address.for.demo@NoteMap-realestate.co.kr",
      role: "Senior Product Manager",
    },
  },
};
