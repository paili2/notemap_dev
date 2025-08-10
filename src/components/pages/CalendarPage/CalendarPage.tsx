// 일정관리 페이지
"use client";

import * as React from "react";
import { CalendarPageLayout } from "@/components/layouts/CalendarPageLayout/CalendarPageLayout";
import { Card } from "@/components/atoms/Card/Card";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Calendar } from "@/components/atoms/Calendar/Calendar";
import {
  EventFormModal,
  type EventFormValues,
} from "@/components/organisms/EventFormModal/EventFormModal";

type EventItem = {
  id: string;
  title: string;
  date: string;
  description?: string;
};

const initialEvents: EventItem[] = [
  { id: "1", title: "팀 킥오프", date: "2025-08-12", description: "OKR 정렬" },
  {
    id: "2",
    title: "고객 미팅",
    date: "2025-08-15",
    description: "제안서 리뷰",
  },
  { id: "3", title: "릴리즈 점검", date: "2025-08-15" },
];

export default function CalendarPage() {
  const [events, setEvents] = React.useState<EventItem[]>(initialEvents);
  const [selected, setSelected] = React.useState<Date | undefined>(new Date());
  const [q, setQ] = React.useState("");

  const selectedISO = selected?.toISOString().slice(0, 10);

  const filtered = React.useMemo(() => {
    const kw = q.trim();
    let list = events;
    if (selectedISO) list = list.filter((e) => e.date === selectedISO);
    if (kw)
      list = list.filter((e) =>
        [e.title, e.description].filter(Boolean).some((t) => t!.includes(kw))
      );
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }, [events, q, selectedISO]);

  const handleCreate = (v: EventFormValues) => {
    const id = crypto.randomUUID?.() ?? String(Date.now());
    setEvents((prev) => [
      ...prev,
      { id, title: v.title, date: v.date, description: v.description },
    ]);
  };

  return (
    <CalendarPageLayout
      title="일정 관리"
      subtitle="NoteMap 캘린더에서 팀 스케줄을 관리하세요."
      sidebar={
        <div className="space-y-4">
          <Input
            placeholder="일정 검색…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <EventFormModal
            defaultDate={selectedISO}
            onCreate={handleCreate}
            triggerLabel="새 일정"
          />
          <Card className="p-3">
            <div className="text-sm font-semibold mb-2">필터</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">전체</Badge>
              <Badge variant="secondary">회의</Badge>
              <Badge variant="secondary">릴리즈</Badge>
            </div>
          </Card>
        </div>
      }
    >
      {/* 메인 캘린더 */}
      <Card className="p-4">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          className="mx-auto"
        />
      </Card>

      {/* 선택 날짜의 일정 리스트 */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedISO ? `${selectedISO} 일정` : "날짜를 선택하세요"}
          </div>
          <Button variant="secondary" onClick={() => setSelected(undefined)}>
            날짜 선택 해제
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            표시할 일정이 없습니다.
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((e) => (
              <li key={e.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{e.date}</div>
                </div>
                {e.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {e.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </CalendarPageLayout>
  );
}
