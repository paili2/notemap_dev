import type { Meta, StoryObj } from "@storybook/react";
import FormField from "./FormField";
import { useState } from "react";

const meta: Meta<typeof FormField> = {
  title: "Molecules/FormField",
  component: FormField,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    type: { control: "text" },
    placeholder: { control: "text" },
    error: { control: "text" },
  },
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    label: "이름",
    name: "name",
    placeholder: "이름을 입력하세요",
    type: "text",
  },
};

export const WithError: Story = {
  args: {
    label: "이메일",
    name: "email",
    type: "email",
    placeholder: "이메일을 입력하세요",
    error: "올바른 이메일 형식이 아닙니다.",
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState("");
    return (
      <FormField
        {...args}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
  args: {
    label: "입력 필드",
    name: "field",
    placeholder: "값을 입력하세요",
  },
};
