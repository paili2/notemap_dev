"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Label } from "@/components/atoms/Label/Label";
import { Button } from "@/components/atoms/Button/Button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms/Select/Select";
import { MoreHorizontal } from "lucide-react";
import type { RoleKey, UserRow } from "../types";

export default function AccountsListPage({
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
          {rows.map((u) => {
            const readOnly = u.protected; // 보호계정만 제한
            return (
              <tr key={u.id} className={u.protected ? "opacity-90" : ""}>
                <td className="p-3">
                  {u.name}
                  {u.protected && (
                    <span className="ml-2 align-middle">
                      <Badge variant="outline">보호됨</Badge>
                    </span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3">
                  {readOnly ? (
                    <Badge variant="secondary">
                      {u.role === "owner"
                        ? "메인관리자"
                        : u.role === "manager"
                        ? "팀장"
                        : "사원"}
                    </Badge>
                  ) : (
                    <RoleSelect
                      value={u.role}
                      onChange={(v) => {
                        if (u.protected) return;
                        onChangeRole(u.id, v);
                      }}
                    />
                  )}
                </td>
                <td className="p-3">
                  <span className={cn("inline-flex items-center gap-2")}>
                    <Checkbox
                      checked={u.active}
                      disabled={readOnly}
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
                    {readOnly ? (
                      <span className="text-xs text-muted-foreground">-</span>
                    ) : (
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
                          {!u.protected && (
                            <DropdownMenuItem
                              onClick={() => onRemove(u.id)}
                              className="text-destructive"
                            >
                              계정 삭제
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
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
  // owner로 변경 금지 → 선택지는 manager/staff만
  const safeValue = value === "owner" ? "manager" : value;
  return (
    <Select value={safeValue} onValueChange={(v: RoleKey) => onChange(v)}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="manager">팀장</SelectItem>
        <SelectItem value="staff">사원</SelectItem>
      </SelectContent>
    </Select>
  );
}
