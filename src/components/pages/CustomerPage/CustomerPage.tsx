"use client";

import * as React from "react";
import { CustomerPageLayout } from "@/components/layouts/CustomerPageLayout/CustomerPageLayout";
import { Card } from "@/components/atoms/Card/Card";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Badge } from "@/components/atoms/Badge/Badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/atoms/Avatar/Avatar";
import { getInitials } from "@/lib/getInitials";

type Customer = {
  id: string;
  name: string;
  email: string;
  status: "신규" | "활성" | "휴면" | "VIP";
  profileUrl?: string; // 있으면 이미지 표시
};

const initialCustomers: Customer[] = [
  { id: "1", name: "김철수", email: "kim@example.com", status: "신규" },
  {
    id: "2",
    name: "이영희",
    email: "lee@example.com",
    status: "활성",
    profileUrl: "",
  },
  { id: "3", name: "박민수", email: "park@example.com", status: "VIP" },
];

export default function CustomerPage() {
  const [customers] = React.useState<Customer[]>(initialCustomers);
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        c.email.toLowerCase().includes(kw) ||
        c.status.includes(q)
    );
  }, [customers, q]);

  return (
    <CustomerPageLayout
      title="고객 관리"
      subtitle="NoteMap 고객 정보를 조회하고 관리합니다."
      actions={<Button>새 고객 추가</Button>}
      sidebar={
        <div className="space-y-4">
          <Input
            placeholder="고객 검색..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Card className="p-3">
            <div className="mb-2 text-sm font-medium">세그먼트</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">신규</Badge>
              <Badge variant="secondary">활성</Badge>
              <Badge variant="secondary">휴면</Badge>
              <Badge variant="secondary">VIP</Badge>
            </div>
          </Card>
        </div>
      }
    >
      <Card className="p-4">
        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            표시할 고객이 없습니다.
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    {c.profileUrl ? (
                      <AvatarImage src={c.profileUrl} alt={c.name} />
                    ) : null}
                    <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {c.email}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">{c.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </CustomerPageLayout>
  );
}
