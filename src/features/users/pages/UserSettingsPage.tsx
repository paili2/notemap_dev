"use client";

import { useMemo, useState } from "react";
import { Users, Shield } from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/atoms/Tabs/Tabs";
import { Input } from "@/components/atoms/Input/Input";

import AccountsListPage from "@/features/users/components/_AccountsListPage";
import AccountCreatePage, {
  CreateAccountPayload,
} from "@/features/users/components/_AccountCreatePage";

import type { RoleKey, UserRow } from "@/features/users/types";
import { DEFAULT_USERS } from "@/features/users/_mock";
import { cryptoRandomId } from "@/lib/cryptoRandomId";
import { Card, CardHeader, CardTitle } from "@/components/atoms/Card/Card";

export default function UserSettingsPage() {
  const [users, setUsers] = useState<UserRow[]>(DEFAULT_USERS);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const kw = query.trim().toLowerCase();
    if (!kw) return users;
    return users.filter((u) =>
      [u.name, u.email, u.role, u.active ? "active" : "inactive"]
        .join(" ")
        .toLowerCase()
        .includes(kw)
    );
  }, [users, query]);

  const createUser = (p: CreateAccountPayload) => {
    setUsers((prev) => [
      ...prev,
      {
        id: cryptoRandomId(),
        name: p.name,
        email: p.email,
        role: p.role,
        active: true,
        // 보안: 실제 서비스에선 해시 저장. (지금은 mock이라 원문 유지)
        password: p.password,
        phone: p.phone,
        emergency_contact: p.emergency_contact,
        address: p.address,
        salary_account: p.salary_account,
        photo_url: p.photo_url,
        id_photo_url: p.id_photo_url,
        resident_register_url: p.resident_register_url,
        resident_extract_url: p.resident_extract_url,
        family_relation_url: p.family_relation_url,
        birthday: p.birthday,
      } as any,
    ]);
    // TODO: API 연동
  };

  const updateUser = (id: string, patch: Partial<UserRow>) => {
    setUsers((prev) =>
      prev.map((u) => {
        const nextRole = (patch.role ?? u.role) as RoleKey;
        // 보호 계정/owner는 수정 금지
        if (u.id !== id || (u as any).protected || nextRole === "owner")
          return u;
        return { ...u, ...patch, role: nextRole };
      })
    );
  };

  const removeUser = (id: string) => {
    setUsers((prev) =>
      prev.filter((u) => !(u as any).protected && u.id !== id)
    );
  };

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">직원 관리</h1>
        <p className="text-sm text-muted-foreground">
          직원 계정을 생성하고 관리합니다.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>직원 현황</CardTitle>
          </div>
          <Input
            placeholder="이름/이메일/역할 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-80"
          />
        </CardHeader>
      </Card>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <Users className="h-4 w-4" /> 계정 목록
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-2">
            <Shield className="h-4 w-4" /> 계정 생성
          </TabsTrigger>
        </TabsList>

        {/* absolute/inset 제거, 스크롤 가능 */}
        <div className="pt-4 space-y-6">
          <TabsContent value="list" className="data-[state=inactive]:hidden">
            <div className="p-1 pb-8">
              <AccountsListPage
                rows={filtered}
                onChangeRole={(id: string, role: RoleKey) =>
                  updateUser(id, { role })
                }
                onToggleActive={(id: string, next: boolean) =>
                  updateUser(id, { active: next })
                }
                onRemove={(id: string) => removeUser(id)}
                onEdit={(row) => {
                  // 필요 시 편집 다이얼로그를 연결하세요.
                  // 여기서는 예시로 활성 토글만 수행:
                  updateUser(row.id, { active: !row.active });
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="create" className="data-[state=inactive]:hidden">
            <div className="p-1 pb-8">
              <AccountCreatePage onCreate={createUser} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}
