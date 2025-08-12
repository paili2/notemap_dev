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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/atoms/Card/Card";
import AccountsListPage from "@/features/users/components/_AccountsListPage";
import AccountCreatePage, {
  CreateAccountPayload,
} from "@/features/users/components/_AccountCreatePage";
import type { RoleKey, UserRow } from "@/features/users/types";
import { DEFAULT_USERS } from "@/features/users/_mock";
import { cryptoRandomId } from "@/lib/cryptoRandomId";

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
      },
    ]);
    // TODO: API 연동
  };

  const updateUser = (id: string, patch: Partial<UserRow>) => {
    setUsers((prev) =>
      prev.map((u) => {
        const nextRole = patch.role ?? u.role;
        return u.id !== id || u.protected || nextRole === "owner"
          ? u
          : { ...u, ...patch, role: nextRole };
      })
    );
  };

  const removeUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => !u.protected && u.id !== id));
  };

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">설정</h1>
        <p className="text-sm text-muted-foreground">직원 계정을 관리합니다.</p>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>직원 계정</CardTitle>
            <CardDescription>
              계정 생성/역할 변경/활성화 상태 관리
            </CardDescription>
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

        <div className="relative min-h-[640px] pt-4">
          <TabsContent
            value="list"
            className="absolute inset-0 overflow-auto data-[state=inactive]:pointer-events-none"
          >
            <AccountsListPage
              rows={filtered}
              onChangeRole={(id: string, role: RoleKey) =>
                updateUser(id, { role })
              }
              onToggleActive={(id: string, next: boolean) =>
                updateUser(id, { active: next })
              }
              onRemove={(id: string) => removeUser(id)}
            />
          </TabsContent>

          <TabsContent
            value="create"
            className="absolute inset-0 overflow-hidden data-[state=inactive]:pointer-events-none"
          >
            <AccountCreatePage onCreate={createUser} />
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}
