import type { Meta, StoryObj } from "@storybook/react";
import { SearchBar } from "./SearchBar";

const meta = {
  title: "molecules/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
  args: {
    placeholder: "매물 검색",
    onSearch: (value: string) => alert(`검색어: ${value}`),
  },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const 긴Placeholder: Story = {
  args: {
    placeholder: "주소, 가격, 키워드로 검색하세요",
  },
};
