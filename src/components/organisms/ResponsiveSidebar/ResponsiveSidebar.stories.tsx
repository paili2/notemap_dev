import type { Meta, StoryObj } from "@storybook/react";
import { ResponsiveSidebar } from "./ResponsiveSidebar";
import {
  HomeIcon,
  UsersIcon,
  FileStackIcon,
  CalendarDaysIcon,
  SettingsIcon,
} from "lucide-react";

const meta: Meta<typeof ResponsiveSidebar> = {
  title: "organisms/ResponsiveSidebar",
  component: ResponsiveSidebar,
  parameters: {
    layout: "fullscreen", // 전체 화면에 붙여서 보기 좋게
  },
  tags: ["autodocs"], // 자동 문서화
};

export default meta;

type Story = StoryObj<typeof ResponsiveSidebar>;

// 기본 섹션 예시
const sampleSections = [
  {
    items: [
      { label: "대시보드", href: "/", icon: <HomeIcon className="h-4 w-4" /> },
      {
        label: "고객 관리",
        href: "/customers",
        icon: <UsersIcon className="h-4 w-4" />,
      },
      {
        label: "계약 관리",
        href: "/contracts",
        icon: <FileStackIcon className="h-4 w-4" />,
      },
      {
        label: "일정",
        href: "/calendar",
        icon: <CalendarDaysIcon className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "설정",
    items: [
      {
        label: "환경설정",
        href: "/settings",
        icon: <SettingsIcon className="h-4 w-4" />,
      },
    ],
  },
];

export const Default: Story = {
  args: {
    logo: (
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-md bg-primary/10" />
        <span className="truncate text-sm font-semibold">NoteMap</span>
      </div>
    ),
    notificationsCount: 3,
    user: {
      name: "홍길동",
      email: "hong@example.com",
      role: "Admin",
      avatarUrl: "https://i.pravatar.cc/40",
    },
    sections: sampleSections,
    width: 280,
  },
};

export const MobileView: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: {
      defaultViewport: "iphone14", // Storybook viewport addon 필요
    },
  },
};
