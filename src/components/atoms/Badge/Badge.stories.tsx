import type { Meta, StoryObj } from "@storybook/react";
import Badge from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Atoms/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    status: {
      control: "select",
      options: ["pending", "inProgress", "completed", "canceled"],
    },
    size: { control: "select", options: ["small", "medium", "large"] },
    rounded: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    label: "New",
    variant: "primary",
  },
};

export const StatusPending: Story = {
  args: {
    status: "pending",
  },
};

export const StatusInProgress: Story = {
  args: {
    status: "inProgress",
  },
};

export const StatusCompleted: Story = {
  args: {
    status: "completed",
  },
};

export const StatusCanceled: Story = {
  args: {
    status: "canceled",
  },
};
