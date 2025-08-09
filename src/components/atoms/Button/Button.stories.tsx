import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button"; // or "@/components/atoms/Button/Button"
import { Plus, Loader2 } from "lucide-react";

const meta = {
  title: "atoms/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    asChild: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Button {...args} variant="default">
        Default
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="default">
        Default
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
      <Button {...args} size="icon" aria-label="Add">
        <Plus />
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  args: { children: undefined },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Button {...args}>
        <Plus className="mr-2" /> 새로 만들기
      </Button>
      <Button {...args} variant="secondary">
        <Plus className="mr-2" /> 추가
      </Button>
      <Button {...args} variant="outline">
        <Plus className="mr-2" /> 더하기
      </Button>
    </div>
  ),
};

export const LoadingStyle: Story = {
  args: { children: undefined },
  render: (args) => (
    <Button {...args} disabled>
      <Loader2 className="mr-2 animate-spin" />
      로딩 중...
    </Button>
  ),
};

export const AsChildLink: Story = {
  args: { asChild: true, children: undefined },
  render: (args) => (
    <Button {...args}>
      <a href="https://example.com" target="_blank" rel="noreferrer">
        링크처럼 동작
      </a>
    </Button>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};
