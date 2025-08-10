// 직원 계정 관리, 권한 관리
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Separator } from "@/components/atoms/Separator/Separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms/Select/Select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/atoms/Tabs/Tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/atoms/Form/Form";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Plus, Shield, UserPlus2, Users } from "lucide-react";

// ---- Types ----
export type RoleKey = "admin" | "manager" | "staff";
export type PermissionKey =
  | "pins.create"
  | "pins.update"
  | "pins.delete"
  | "users.invite"
  | "users.manage"
  | "billing.view";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  active: boolean;
};

type Role = {
  key: RoleKey;
  label: string;
  description?: string;
  permissions: Record<PermissionKey, boolean>;
};

// ---- Mock data ----
const PERMISSIONS: { key: PermissionKey; label: string }[] = [
  { key: "pins.create", label: "핀 생성" },
  { key: "pins.update", label: "핀 수정" },
  { key: "pins.delete", label: "핀 삭제" },
  { key: "users.invite", label: "직원 초대" },
  { key: "users.manage", label: "직원 관리" },
  { key: "billing.view", label: "결제 열람" },
];

const DEFAULT_ROLES: Role[] = [
  {
    key: "admin",
    label: "관리자",
    description: "모든 권한 보유",
    permissions: {
      "pins.create": true,
      "pins.update": true,
      "pins.delete": true,
      "users.invite": true,
      "users.manage": true,
      "billing.view": true,
    },
  },
  {
    key: "manager",
    label: "팀장",
    description: "팀 운영 및 편집 권한",
    permissions: {
      "pins.create": true,
      "pins.update": true,
      "pins.delete": true,
      "users.invite": true,
      "users.manage": false,
      "billing.view": true,
    },
  },
  {
    key: "staff",
    label: "직원",
    description: "일반 편집 권한",
    permissions: {
      "pins.create": true,
      "pins.update": true,
      "pins.delete": false,
      "users.invite": false,
      "users.manage": false,
      "billing.view": false,
    },
  },
];

const DEFAULT_USERS: UserRow[] = [
  {
    id: "u-1",
    name: "김서린",
    email: "seorin@example.com",
    role: "admin",
    active: true,
  },
  {
    id: "u-2",
    name: "박지훈",
    email: "jihoon@example.com",
    role: "manager",
    active: true,
  },
  {
    id: "u-3",
    name: "이민아",
    email: "mina@example.com",
    role: "staff",
    active: false,
  },
];

// ---- Invite Schema ----
const InviteSchema = z.object({
  name: z.string({ required_error: "이름을 입력하세요." }).min(1),
  email: z
    .string({ required_error: "이메일을 입력하세요." })
    .email("이메일 형식이 올바르지 않습니다."),
  role: z
    .custom<RoleKey>()
    .refine(
      (v) => ["admin", "manager", "staff"].includes(String(v)),
      "역할을 선택해주세요."
    ),
  active: z.boolean().default(true),
});
type InviteValues = z.infer<typeof InviteSchema>;

// ---- Page ----
export default function SettingsPage() {
  const [users, setUsers] = React.useState<UserRow[]>(DEFAULT_USERS);
  const [roles, setRoles] = React.useState<Role[]>(DEFAULT_ROLES);
  const [query, setQuery] = React.useState("");

  const [openInvite, setOpenInvite] = React.useState(false);

  const filtered = React.useMemo(() => {
    const kw = query.trim().toLowerCase();
    if (!kw) return users;
    return users.filter((u) =>
      [u.name, u.email, u.role, u.active ? "active" : "inactive"]
        .join(" ")
        .toLowerCase()
        .includes(kw)
    );
  }, [users, query]);

  // form
  const form = useForm<InviteValues>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { name: "", email: "", role: "staff", active: true },
    mode: "onChange",
  });

  const onInvite = (v: InviteValues) => {
    setUsers((prev) => [
      ...prev,
      {
        id: cryptoRandomId(),
        name: v.name,
        email: v.email,
        role: v.role,
        active: v.active,
      },
    ]);
    form.reset({ name: "", email: "", role: "staff", active: true });
    setOpenInvite(false);
  };

  const updateUser = (id: string, patch: Partial<UserRow>) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const removeUser = (id: string) =>
    setUsers((prev) => prev.filter((u) => u.id !== id));

  const setRolePermission = (
    roleKey: RoleKey,
    perm: PermissionKey,
    next: boolean
  ) =>
    setRoles((prev) =>
      prev.map((r) =>
        r.key === roleKey
          ? { ...r, permissions: { ...r.permissions, [perm]: next } }
          : r
      )
    );

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">설정</h1>
        <p className="text-sm text-muted-foreground">
          직원 계정과 권한을 관리합니다.
        </p>
      </header>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> 직원 계정
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" /> 권한 관리
          </TabsTrigger>
        </TabsList>

        {/* 직원 계정 */}
        <TabsContent value="users" className="space-y-6 pt-4">
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>직원 계정</CardTitle>
                <CardDescription>
                  직원 추가/역할 변경/활성화 상태를 관리합니다.
                </CardDescription>
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                <div className="relative md:w-64">
                  <Input
                    placeholder="이름/이메일/역할 검색"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button className="gap-2" onClick={() => setOpenInvite(true)}>
                  <UserPlus2 className="h-4 w-4" /> 직원 초대
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <UsersTable
                rows={filtered}
                onChangeRole={(id, role) => updateUser(id, { role })}
                onToggleActive={(id, next) => updateUser(id, { active: next })}
                onRemove={removeUser}
              />
            </CardContent>
          </Card>

          {/* 초대 폼 (Card로 인라인 표시) */}
          {openInvite && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> 새 직원 초대
                </CardTitle>
                <CardDescription>
                  이메일로 초대장을 보내고 역할을 지정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onInvite)}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이름</FormLabel>
                          <FormControl>
                            <Input placeholder="홍길동" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이메일</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="you@example.com"
                              type="email"
                              autoComplete="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>역할</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">관리자</SelectItem>
                                <SelectItem value="manager">팀장</SelectItem>
                                <SelectItem value="staff">직원</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>상태</FormLabel>
                          <FormControl>
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(v) =>
                                  field.onChange(Boolean(v))
                                }
                              />
                              활성화
                            </label>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenInvite(false)}
                      >
                        취소
                      </Button>
                      <Button type="submit">초대 보내기</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 권한 관리 */}
        <TabsContent value="roles" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>역할 & 권한</CardTitle>
              <CardDescription>
                역할별로 기능 권한을 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PermissionMatrix
                roles={roles}
                permissions={PERMISSIONS}
                onToggle={(roleKey, permKey, next) =>
                  setRolePermission(roleKey, permKey, next)
                }
              />
              <Separator />
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {PERMISSIONS.map((p) => (
                  <span key={p.key} className="inline-flex items-center gap-2">
                    <Badge variant="outline">{p.label}</Badge>
                    <code className="rounded bg-muted px-1.5 py-0.5">
                      {p.key}
                    </code>
                  </span>
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button>변경사항 저장</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* ---------------- Components ---------------- */

function UsersTable({
  rows,
  onChangeRole,
  onToggleActive,
  onRemove,
}: {
  rows: UserRow[];
  onChangeRole: (id: string, role: RoleKey) => void;
  onToggleActive: (id: string, next: boolean) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="p-3 font-medium">이름</th>
            <th className="p-3 font-medium">이메일</th>
            <th className="p-3 font-medium">역할</th>
            <th className="p-3 font-medium">상태</th>
            <th className="p-3 font-medium text-right">액션</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((u) => (
            <tr key={u.id}>
              <td className="p-3">{u.name}</td>
              <td className="p-3 text-muted-foreground">{u.email}</td>
              <td className="p-3">
                <RoleSelect
                  value={u.role}
                  onChange={(v) => onChangeRole(u.id, v)}
                />
              </td>
              <td className="p-3">
                <span className={cn("inline-flex items-center gap-2")}>
                  <Checkbox
                    checked={u.active}
                    onCheckedChange={(v) => onToggleActive(u.id, Boolean(v))}
                    id={`active-${u.id}`}
                  />
                  <Label htmlFor={`active-${u.id}`} className="text-sm">
                    {u.active ? "활성" : "비활성"}
                  </Label>
                </span>
              </td>
              <td className="p-3">
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`${u.name} 더보기`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel>작업</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => alert("비밀번호 초기화")}
                      >
                        비밀번호 초기화
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onRemove(u.id)}
                        className="text-destructive"
                      >
                        계정 삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="p-6 text-center text-muted-foreground">
                표시할 직원이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
}: {
  value: RoleKey;
  onChange: (v: RoleKey) => void;
}) {
  return (
    <Select value={value} onValueChange={(v: RoleKey) => onChange(v)}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">관리자</SelectItem>
        <SelectItem value="manager">팀장</SelectItem>
        <SelectItem value="staff">직원</SelectItem>
      </SelectContent>
    </Select>
  );
}

function PermissionMatrix({
  roles,
  permissions,
  onToggle,
}: {
  roles: Role[];
  permissions: { key: PermissionKey; label: string }[];
  onToggle: (role: RoleKey, perm: PermissionKey, next: boolean) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-3 text-left font-medium">권한</th>
            {roles.map((r) => (
              <th key={r.key} className="p-3 text-left font-medium">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{r.label}</Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {r.description}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {permissions.map((p) => (
            <tr key={p.key}>
              <td className="p-3 font-medium">{p.label}</td>
              {roles.map((r) => {
                const checked = r.permissions[p.key];
                return (
                  <td key={`${r.key}-${p.key}`} className="p-3">
                    <label className="inline-flex items-center gap-2">
                      <Checkbox
                        checked={!!checked}
                        onCheckedChange={(v) =>
                          onToggle(r.key, p.key, Boolean(v))
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {checked ? "허용" : "차단"}
                      </span>
                    </label>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return (crypto as any).randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 9);
}
