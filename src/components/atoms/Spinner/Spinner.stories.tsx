import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";

const meta: Meta<typeof Spinner> = {
  title: "Atoms/Spinner",
  component: Spinner,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    size: { control: "inline-radio", options: ["small", "medium", "large"] },
    color: {
      control: "inline-radio",
      options: ["primary", "secondary", "white", "gray"],
    },
    thickness: {
      control: "inline-radio",
      options: ["thin", "normal", "thick"],
    },
    className: { control: false },
    label: { control: "text" },
  },
  args: {
    size: "medium",
    color: "primary",
    thickness: "normal",
    label: "Loading…",
  },
};
export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = {};

export const Showcase: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="small" />
      <Spinner />
      <Spinner size="large" thickness="thick" />
      <div className="bg-gray-900 p-3 rounded">
        <Spinner color="white" />
      </div>
    </div>
  ),
};
