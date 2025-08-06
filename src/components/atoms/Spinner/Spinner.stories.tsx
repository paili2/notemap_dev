import type { Meta, StoryObj } from "@storybook/react";
import Spinner from "./Spinner";

const meta: Meta<typeof Spinner> = {
  title: "Atoms/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: "select", options: ["small", "medium", "large"] },
    color: {
      control: "select",
      options: ["primary", "secondary", "white", "gray"],
    },
    thickness: { control: "select", options: ["thin", "normal", "thick"] },
  },
};

export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {
    size: "medium",
    color: "primary",
    thickness: "normal",
  },
};
