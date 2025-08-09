import type { Meta, StoryObj } from "@storybook/react";
import { CustomerSection } from "./CustomerSection";

const meta: Meta<typeof CustomerSection> = {
  title: "organisms/CustomerSection",
  component: CustomerSection,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof CustomerSection>;
export const Default: Story = {};
