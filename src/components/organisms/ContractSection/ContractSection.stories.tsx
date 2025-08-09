import type { Meta, StoryObj } from "@storybook/react";
import { ContractSection } from "./ContractSection";

const meta: Meta<typeof ContractSection> = {
  title: "organisms/ContractSection",
  component: ContractSection,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof ContractSection>;
export const Default: Story = {};
