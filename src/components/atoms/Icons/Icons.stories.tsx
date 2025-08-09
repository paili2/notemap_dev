import type { Meta, StoryObj } from "@storybook/react";
import { MapPinIcon } from "./MapPinIcon";
import { SearchIcon } from "./SearchIcon";
import { UserIcon } from "./UserIcon";

const meta = {
  title: "atoms/Icons",
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: { type: "number", min: 12, max: 96, step: 2 } },
    color: { control: "color" },
    className: { control: "text" },
  },
  args: {
    size: 24,
    color: "currentColor",
    className: "",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** 갤러리 보기: 여러 아이콘을 한 번에 확인 */
export const Gallery: Story = {
  render: (args) => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <MapPinIcon {...args} />
        <span className="text-xs text-muted-foreground">MapPin</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SearchIcon {...args} />
        <span className="text-xs text-muted-foreground">Search</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <UserIcon {...args} />
        <span className="text-xs text-muted-foreground">User</span>
      </div>
    </div>
  ),
};

/** 개별 아이콘 스토리들 */
export const MapPin: Story = {
  render: (args) => <MapPinIcon {...args} />,
};

export const Search: Story = {
  render: (args) => <SearchIcon {...args} />,
};

export const User: Story = {
  render: (args) => <UserIcon {...args} />,
};

/** Tailwind 색상으로 제어하고 싶다면 color 대신 className 사용 */
export const WithTailwindColor: Story = {
  args: { className: "text-blue-500", color: "currentColor", size: 28 },
  render: (args) => (
    <div className="flex items-center gap-6">
      <MapPinIcon {...args} />
      <SearchIcon {...args} />
      <UserIcon {...args} />
    </div>
  ),
};
