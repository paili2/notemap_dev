import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { Progress } from "@/components/atoms/Progress/Progress";

const meta: Meta<typeof Progress> = {
  title: "Atoms/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "shadcn/ui 기반 Progress 컴포넌트. value(0~100)를 전달하면 진행률을 표시합니다.",
      },
    },
  },
  args: { className: "w-[320px]" },
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "진행률(%)",
    },
    className: { control: "text" },
  },
};
export default meta;

type Story = StoryObj<typeof Progress>;

export const Zero: Story = {
  args: { value: 0 },
};

export const Half: Story = {
  args: { value: 50 },
};

export const Full: Story = {
  args: { value: 100 },
};

export const Playground: Story = {
  args: { value: 30 },
};

export const AnimatedDemo: Story = {
  render: (args) => <AnimatedExample {...args} />,
  args: { value: 0 },
  parameters: {
    docs: {
      description: {
        story: "가짜 타이머로 0→100%까지 증가하는 데모입니다.",
      },
    },
  },
};

function AnimatedExample(props: React.ComponentProps<typeof Progress>) {
  const [v, setV] = React.useState<number>(Number(props.value ?? 0));

  React.useEffect(() => {
    let mounted = true;
    let x = 0;
    const id = setInterval(() => {
      if (!mounted) return;
      x = (x + 5) % 105; // 0..100 반복
      setV(x);
    }, 200);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="w-[320px] space-y-2">
      <Progress value={v} />
      <div className="text-center text-sm text-muted-foreground">{v}%</div>
    </div>
  );
}
