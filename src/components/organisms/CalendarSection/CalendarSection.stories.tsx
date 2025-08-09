import type { Meta, StoryObj } from "@storybook/react";
import { CalendarSection } from "./CalendarSection";

const meta: Meta<typeof CalendarSection> = {
  title: "organisms/CalendarSection",
  component: CalendarSection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CalendarSection>;

export const Default: Story = {
  args: {},
};
