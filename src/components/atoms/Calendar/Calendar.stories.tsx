import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "./Calendar";

const meta: Meta<typeof Calendar> = {
  title: "atoms/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    captionLayout: {
      control: { type: "radio" },
      options: ["label", "dropdown"],
      description: "상단 캡션 형태",
    },
    showOutsideDays: {
      control: "boolean",
      description: "이전/다음달 날짜를 그리드에 함께 표시",
    },
    numberOfMonths: {
      control: { type: "number", min: 1, max: 3, step: 1 },
      description: "한 번에 보여줄 월 수",
    },
    buttonVariant: {
      control: { type: "select" },
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "ghost",
        "link",
      ],
      description: "이전/다음 네비게이션 버튼의 shadcn Button variant",
    },
  },
  args: {
    captionLayout: "label",
    showOutsideDays: true,
    numberOfMonths: 1,
    buttonVariant: "ghost",
  },
};
export default meta;

type Story = StoryObj<typeof Calendar>;

/** 단일 날짜 선택 */
export const Single: Story = {
  render: (args) => {
    const [date, setDate] = React.useState<Date | undefined>(new Date());

    return (
      <div className="p-4">
        <Calendar {...args} mode="single" selected={date} onSelect={setDate} />
        <p className="mt-3 text-sm text-muted-foreground">
          선택: {date ? date.toLocaleDateString() : "없음"}
        </p>
      </div>
    );
  },
};

/** 기간(range) 선택 */
export const Range: Story = {
  args: {
    numberOfMonths: 2,
    captionLayout: "dropdown",
  },
  render: (args) => {
    const [range, setRange] = React.useState<DateRange | undefined>({
      from: new Date(),
      to: undefined,
    });

    return (
      <div className="p-4">
        <Calendar {...args} mode="range" selected={range} onSelect={setRange} />
        <p className="mt-3 text-sm text-muted-foreground">
          {range?.from ? range.from.toLocaleDateString() : "시작일 없음"} ~{" "}
          {range?.to ? range.to.toLocaleDateString() : "종료일 없음"}
        </p>
      </div>
    );
  },
};

/** 다중 날짜 선택 */
export const Multiple: Story = {
  render: (args) => {
    // ✅ multiple 모드에 맞게 undefined 허용
    const [dates, setDates] = React.useState<Date[] | undefined>(undefined);

    return (
      <div className="p-4">
        <Calendar
          {...args}
          mode="multiple"
          selected={dates} // Date[] | undefined
          onSelect={setDates} // (dates?: Date[] | undefined) => void
        />
        <p className="mt-3 text-sm text-muted-foreground">
          {dates?.length ? `${dates.length}개 선택됨` : "선택 없음"}
        </p>
      </div>
    );
  },
};

/** 비활성(선택 불가) 날짜 예시 */
export const WithDisabledDays: Story = {
  args: {
    numberOfMonths: 2,
  },
  render: (args) => {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const today = new Date();

    return (
      <div className="p-4">
        <Calendar
          {...args}
          mode="single"
          selected={date}
          onSelect={setDate}
          // 오늘 이전 날짜 비활성화 + 주말 비활성화 예시
          disabled={[
            { before: today },
            { dayOfWeek: [0, 6] }, // 일/토
          ]}
        />
        <p className="mt-3 text-sm text-muted-foreground">
          선택: {date ? date.toLocaleDateString() : "없음"}
        </p>
      </div>
    );
  },
};
