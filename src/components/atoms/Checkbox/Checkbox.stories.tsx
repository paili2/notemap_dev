import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Atoms/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

/** 1) 기본 (언컨트롤드) */
export const Default: Story = {
  args: {
    // 언컨트롤드로 시작 상태만 지정하려면 defaultChecked 사용 가능
    // defaultChecked: false,
  },
};

/** 2) 컨트롤드 예시 */
export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState<boolean | "indeterminate">(false);
    return (
      <div className="flex items-center gap-2">
        <Checkbox checked={checked} onCheckedChange={setChecked} />
        <span className="text-sm">
          상태:{" "}
          {checked === "indeterminate" ? "indeterminate" : String(checked)}
        </span>
        <button
          className="rounded border px-2 py-1 text-xs"
          onClick={() =>
            setChecked((prev) =>
              prev === false ? true : prev === true ? "indeterminate" : false
            )
          }
        >
          상태 순환
        </button>
      </div>
    );
  },
};

/** 3) 비활성화 */
export const Disabled: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
};

/** 4) 라벨과 함께 */
export const WithLabel: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    const id = "checkbox-with-label";
    return (
      <label htmlFor={id} className="flex items-center gap-2">
        <Checkbox id={id} checked={checked} onCheckedChange={setChecked} />
        <span className="text-sm">이용 약관에 동의합니다</span>
      </label>
    );
  },
};
