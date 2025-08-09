// 일정 캘린더 + 일정 추가 버튼
import * as React from "react";
import { Calendar } from "@/components/atoms/Calendar/Calendar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/atoms/Card/Card";

export function CalendarSection() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>📅 일정 선택</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
        />
        <p className="mt-4 text-sm text-muted-foreground">
          선택된 날짜: {date ? date.toLocaleDateString() : "없음"}
        </p>
      </CardContent>
    </Card>
  );
}
