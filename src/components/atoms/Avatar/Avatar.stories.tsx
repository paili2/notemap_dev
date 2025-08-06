import { Meta, StoryObj } from "@storybook/react";
import Avatar, { AvatarProps } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Atoms/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    src: {
      control: "text",
      description: "아바타 이미지 URL",
    },
    alt: {
      control: "text",
      description: "이미지 설명 (alt 텍스트)",
    },
    name: {
      control: "text",
      description: "이미지가 없을 때 보여줄 이니셜 이름",
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
      description: "아바타 크기",
    },
    rounded: {
      control: "boolean",
      description: "둥근 아바타 여부",
    },
    status: {
      control: "select",
      options: ["online", "offline", "busy", "away"],
      description: "사용자 상태 표시",
    },
  },
};

export default meta;
type Story = StoryObj<AvatarProps>;

// ✅ 기본 스토리
export const Default: Story = {
  args: {
    name: "Seoryeong Jeong",
    size: "medium",
    rounded: true,
  },
};

// ✅ 이미지 있는 아바타
export const WithImage: Story = {
  args: {
    src: "https://i.pravatar.cc/150?img=3",
    alt: "User avatar",
    size: "medium",
    rounded: true,
  },
};

// ✅ 상태 표시가 있는 아바타
export const WithStatus: Story = {
  args: {
    src: "https://i.pravatar.cc/150?img=5",
    alt: "Online user",
    size: "large",
    rounded: true,
    status: "online",
  },
};

// ✅ 이미지 없는 아바타 (이니셜 표시)
export const NoImage: Story = {
  args: {
    name: "Kim",
    size: "large",
    rounded: true,
  },
};
