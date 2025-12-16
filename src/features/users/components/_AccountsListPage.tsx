"use client";

import { Trash2, Edit } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/atoms/Avatar/Avatar";
import { Badge } from "@/components/atoms/Badge/Badge";
import type { UserRow, RoleKey } from "@/features/users/types";

type Props = {
  rows: UserRow[];
  onChangeRole?: (id: string, role: RoleKey) => void; // optional - 필요 시 사용
  onRemove: (id: string) => void;
  onEdit?: (credentialId: string) => void; // optional - 팀 관리에서는 수정 불필요
};

export default function AccountsListPage({
  rows,
  onChangeRole,
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
              <th className="px-4 py-3 text-center font-medium">프로필 사진</th>
              <th className="px-4 py-3 text-left font-medium">이름</th>
              <th className="px-4 py-3 text-left font-medium">연락처</th>
              <th className="px-4 py-3 text-left font-medium">팀 가입일</th>
              <th className="px-4 py-3 text-center font-medium">팀원 삭제</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const phone = u.phone ?? "-";
              // 날짜 포맷팅 (YYYY-MM-DD -> YYYY년 MM월 DD일)
              const formatDate = (dateString: string | null | undefined) => {
                if (!dateString) return "-";
                try {
                  const date = new Date(dateString);
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  return `${year}년 ${month}월 ${day}일`;
                } catch {
                  return dateString;
                }
              };
              const joinedAtFormatted = formatDate(u.joinedAt);

              // 이름 첫 글자로 아바타 초기값 생성
              const initials = u.name ? u.name.charAt(0).toUpperCase() : "?";

              return (
                <tr
                  key={u.id}
                  className="border-b last:border-b-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={u.photo_url || undefined}
                          alt={u.name}
                        />
                        <AvatarFallback className="bg-muted text-sm font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {joinedAtFormatted}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <button
                          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50"
                          onClick={() => onEdit(u.id)}
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                          수정
                        </button>
                      )}
                      {/* 팀장(team_leader)은 삭제 불가, 뱃지 표시 */}
                      {u.role === "team_leader" ? (
                        <Badge variant="info">팀장</Badge>
                      ) : (
                        <button
                          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("해당 계정을 팀에서 삭제하시겠습니까?"))
                              onRemove(u.id);
                          }}
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                          삭제
                        </button>
                      )}
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
