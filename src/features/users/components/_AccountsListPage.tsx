"use client";

import { Trash2, Edit } from "lucide-react";
import type { RoleKey, UserRow } from "@/features/users/types";

type Props = {
  rows: UserRow[];
  onChangeRole: (id: string, role: RoleKey) => void; // (필요 시 모달 등에서 사용)
  onRemove: (id: string) => void;
  onEdit: (credentialId: string) => void;
};

export default function AccountsListPage({
  rows,
  onRemove,
  onEdit,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      {rows.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">
          데이터가 없습니다.
        </div>
      ) : (
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">이름</th>
              <th className="px-4 py-3 text-left font-medium">이메일</th>
              <th className="px-4 py-3 text-left font-medium">역할</th>
              <th className="px-4 py-3 text-left font-medium">연락처</th>
              <th className="px-4 py-3 text-left font-medium">상태</th>
              <th className="px-4 py-3 text-right font-medium">액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const phone = u.phone ?? "-";
              const position = u.positionRank ?? "-";
              const role = roleLabel(u.role);
              const statusLabel = u.disabled ? "비활성" : "활성";
              const statusClass = u.disabled
                ? "bg-gray-100 text-gray-700 border border-gray-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200";

              return (
                <tr
                  key={u.id}
                  className="border-b last:border-b-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">{role}</td>
                  <td className="px-4 py-3">{phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50"
                        onClick={() => onEdit(u.id)}
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                        수정
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("해당 계정을 삭제할까요?")) onRemove(u.id);
                        }}
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function roleLabel(r: RoleKey) {
  switch (r) {
    case "owner":
      return "관리자";
    case "manager":
      return "관리자";
    case "team_leader":
      return "팀장";
    case "deputy_manager":
      return "과장";
    case "general_manager":
      return "실장";
    case "department_head":
      return "부장";
    case "staff":
      return "사원";
    default:
      return r;
  }
}

function positionRankLabel(rank: string | null | undefined): string {
  if (!rank) return "-";
  switch (rank) {
    case "STAFF":
      return "사원";
    case "ASSISTANT_MANAGER":
      return "대리";
    case "MANAGER":
      return "과장";
    case "DEPUTY_GENERAL":
      return "차장";
    case "GENERAL_MANAGER":
      return "부장";
    case "DIRECTOR":
      return "실장";
    default:
      return rank;
  }
}

