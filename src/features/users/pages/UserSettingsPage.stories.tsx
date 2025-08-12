import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import SettingsPage from "./UserSettingsPage";

const meta: Meta<typeof SettingsPage> = {
  title: "pages/UserSettings",
  component: SettingsPage,
  parameters: {
    layout: "fullscreen",
    react: { strictMode: false },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SettingsPage>;

export const Default: Story = {
  render: () => <SettingsPage />,
};
