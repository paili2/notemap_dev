import type { Meta, StoryObj } from "@storybook/react";
import { FormField, type FormFieldProps } from "./FormField";

const meta = {
  title: "molecules/FormField",
  component: FormField,
  parameters: {
    layout: "centered",
  },
  args: {
    label: "Email",
    name: "email",
    type: "email",
    placeholder: "you@example.com",
  },
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["text", "email", "password", "number", "search", "tel", "url"],
    },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Password: Story = {
  args: {
    label: "Password",
    name: "password",
    type: "password",
    placeholder: "••••••••",
    required: true,
  },
};

export const WithDefaultValue: Story = {
  args: {
    label: "Name",
    name: "name",
    type: "text",
    defaultValue: "user01@test.org",
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled",
    name: "disabled",
    placeholder: "입력 불가",
    disabled: true,
  },
};

// 폼 맥락에서의 예시 (폭과 간격 포함)
export const InAForm: Story = {
  render: (args: FormFieldProps) => (
    <div className="w-[360px] space-y-4">
      <FormField {...args} />
      <FormField label="Password" name="password" type="password" />
      <button
        type="button"
        className="w-full rounded-md px-3 py-2 text-sm bg-black text-white dark:bg-white dark:text-black"
      >
        Submit (demo)
      </button>
    </div>
  ),
  args: {
    label: "Email",
    name: "email",
    type: "email",
    placeholder: "you@example.com",
  },
};
