import type { Meta, StoryObj } from "@storybook/react";
import FormGroup from "./FormGroup";
import FormField from "../FormField/FormField";
import { useState } from "react";

const meta: Meta<typeof FormGroup> = {
  title: "Molecules/FormGroup",
  component: FormGroup,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof FormGroup>;

export const Default: Story = {
  render: () => {
    const [form, setForm] = useState({ name: "", email: "" });
    return (
      <FormGroup title="사용자 정보">
        <FormField
          label="이름"
          name="name"
          placeholder="이름을 입력하세요"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <FormField
          label="이메일"
          name="email"
          placeholder="이메일을 입력하세요"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </FormGroup>
    );
  },
};
