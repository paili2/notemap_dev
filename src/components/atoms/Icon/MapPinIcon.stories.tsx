import type { Meta, StoryObj } from "@storybook/react";
import MapPinIcon from "./MapPinIcon";

const meta: Meta<typeof MapPinIcon> = {
  title: "Atoms/MapPinIcon",
  component: MapPinIcon,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: { type: "number" } },
    color: { control: { type: "color" } },
  },
};

export default meta;

type Story = StoryObj<typeof MapPinIcon>;

export const Default: Story = {
  args: {
    size: 24,
    color: "currentColor",
  },
};

export const RedPin: Story = {
  args: {
    size: 32,
    color: "red",
  },
};
