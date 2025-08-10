import type { Meta, StoryObj } from "@storybook/react";
import { DashboardLayout } from "./DashboardLayout";
import { Card } from "@/components/atoms/Card/Card";

export default {
  title: "layouts/DashboardLayout",
  component: DashboardLayout,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DashboardLayout>;

type Story = StoryObj<typeof DashboardLayout>;

export const Default: Story = {
  args: {
    nav: [
      {
        title: "Overview",
        items: [{ label: "대시보드", href: "#", active: true }],
      },
    ],
    children: <Card className="p-4">콘텐츠</Card>,
  },
};
