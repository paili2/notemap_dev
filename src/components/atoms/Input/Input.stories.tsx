import type { Meta, StoryObj } from "@storybook/react";
import { Search } from "lucide-react";
import Input, { InputProps } from "./Input";

const meta: Meta<InputProps> = {
  title: "Atoms/Input",
  component: Input,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    inputSize: {
      control: { type: "select" },
      options: ["small", "medium", "large"],
    },
    variant: {
      control: { type: "select" },
      options: ["default", "outlined", "filled", "error"],
    },
    placeholder: { control: "text" },
    type: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<InputProps>;

export const Default: Story = {
  args: {
    placeholder: "텍스트 입력",
    inputSize: "medium",
    variant: "default",
    type: "text",
  },
};

export const WithIcon: Story = {
  args: {
    placeholder: "검색어를 입력하세요",
    inputSize: "medium",
    variant: "outlined",
    type: "search",
    iconLeft: <Search size={16} />,
  },
};

export const ErrorState: Story = {
  args: {
    placeholder: "잘못된 값",
    inputSize: "medium",
    variant: "error",
    type: "text",
  },
};

export const PasswordType: Story = {
  args: {
    placeholder: "비밀번호 입력",
    inputSize: "medium",
    variant: "outlined",
    type: "password",
  },
};
