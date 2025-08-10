import type { Meta, StoryObj } from "@storybook/react";
import CalendarPage from "./CalendarPage";

export default {
  title: "pages/CalendarPage",
  component: CalendarPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CalendarPage>;

type Story = StoryObj<typeof CalendarPage>;

export const Default: Story = {};
