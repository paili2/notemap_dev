"use client";

import {
  Phone,
  Trash2,
  Briefcase,
} from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/atoms/Avatar/Avatar";
import type { RoleKey, UserRow } from "@/features/users/types";

type Props = {
  rows: UserRow[];
  onChangeRole: (id: string, role: RoleKey) => void; // (필요 시 모달 등에서 사용)
  onRemove: (id: string) => void;
};

export default function AccountsListPage({
  rows,
  onRemove,
}: Props) {

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.length === 0 ? (
        <div className="col-span-full rounded-xl border p-10 text-center text-muted-foreground">
          데이터가 없습니다.
        </div>
      ) : (
        rows.map((u) => {
          // ====== 카드에 들어갈 필수정보 + 사진 ======
          const phone = u.phone ?? "";
          const position = u.positionRank ?? "";
          const photo = u.photo_url ?? "";
          const isManager = u.role === "team_leader"; // manager이면 팀장 배지 표시

          return (
            <article
              key={u.id}
              className="relative flex flex-col rounded-2xl border bg-background p-4 shadow-sm"
            >
              {/* 팀장 배지 */}
              {isManager && (
                <div className="absolute right-2 top-2">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                    팀장
                  </span>
                </div>
              )}

              {/* 상단: 아바타 + 이름 */}
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  <Avatar className="h-16 w-16 ring-1 ring-border">
                    <AvatarImage
                      src={photo || undefined}
                      alt={`${u.name}의 프로필 사진`}
                    />
                    <AvatarFallback className="text-lg font-semibold">
                      {initials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold leading-5">
                    {u.name}
                  </h3>
                </div>
              </div>

              {/* 본문: 필수정보 2줄 */}
              <div className="mt-3 space-y-2 text-sm">
                <Line
                  icon={<Briefcase className="h-4 w-4" />}
                  label="직위"
                  value={positionRankLabel(position)}
                />
                <Line
                  icon={<Phone className="h-4 w-4" />}
                  label="연락처"
                  value={phone || "-"}
                />
              </div>

              {/* 액션: 모든 카드에서 동일 Y위치(상단 콘텐츠가 동일 구조 + 아래 마진으로 정렬) */}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm("해당 계정을 삭제할까요?")) onRemove(u.id);
                  }}
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </button>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}

/** 한 줄 표현 (아이콘 + 라벨 + 값) */
function Line({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="truncate">{value}</div>
      </div>
    </div>
  );
}

function initials(name: string) {
  try {
    const parts = name.trim().split(/\s+/);
    const s =
      parts.length >= 2
        ? parts[0][0] + parts[parts.length - 1][0]
        : parts[0][0];
    return s.toUpperCase();
  } catch {
    return "U";
  }
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

