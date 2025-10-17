"use client";

import {
  Phone,
  PhoneCall,
  MapPin,
  Banknote,
  Pencil,
  Trash2,
  X,
  Eye,
  FileText,
  Image as ImageIcon,
  EyeOff,
} from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/atoms/Avatar/Avatar";
import type { RoleKey, UserRow } from "@/features/users/types";
import AccountEditModal from "./_AccountEditModal";
import { useState } from "react";

type Props = {
  rows: UserRow[];
  onChangeRole: (id: string, role: RoleKey) => void; // (필요 시 모달 등에서 사용)
  onRemove: (id: string) => void;
  onApplyEdit?: (
    id: string,
    patch: Partial<UserRow> & {
      phone?: string;
      emergency_contact?: string;
      address?: string;
      salary_account?: string;
      birthday?: string;
      password?: string;
      photo_url?: string;
      id_photo_url?: string;
      resident_register_url?: string;
      resident_extract_url?: string;
      family_relation_url?: string;
    }
  ) => void;
};

export default function AccountsListPage({
  rows,
  onRemove,
  onApplyEdit,
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);

  const openDetail = (u: UserRow) => {
    setDetailUser(u);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setTimeout(() => setDetailUser(null), 200);
  };

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditOpen(false);
    setTimeout(() => setEditUser(null), 200);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.length === 0 ? (
        <div className="col-span-full rounded-xl border p-10 text-center text-muted-foreground">
          데이터가 없습니다.
        </div>
      ) : (
        rows.map((u) => {
          // ====== 카드에 들어갈 필수정보 + 사진 ======
          const phone = (u as any).phone ?? "";
          const emergency = (u as any).emergency_contact ?? "";
          const address =
            (u as any).address ??
            (u as any).addr ??
            (u as any).address_line ??
            "";
          const salary = (u as any).salary_account ?? "";
          const photo = (u as any).photo_url ?? "";

          return (
            <article
              key={u.id}
              className="relative flex flex-col rounded-2xl border bg-background p-4 shadow-sm"
            >
              {/* 상단: 아바타 + 이름 */}
              <div className="flex items-start gap-3">
                <button
                  className="shrink-0"
                  onClick={() => openDetail(u)}
                  title="상세보기"
                  aria-label={`${u.name} 상세보기`}
                >
                  <Avatar className="h-16 w-16 ring-1 ring-border">
                    <AvatarImage
                      src={photo || undefined}
                      alt={`${u.name}의 프로필 사진`}
                    />
                    <AvatarFallback className="text-lg font-semibold">
                      {initials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold leading-5">
                    {u.name}
                  </h3>
                </div>
              </div>

              {/* 본문: 필수정보 4줄 */}
              <div className="mt-3 space-y-2 text-sm">
                <Line
                  icon={<Phone className="h-4 w-4" />}
                  label="연락처"
                  value={phone || "-"}
                />
                <Line
                  icon={<PhoneCall className="h-4 w-4" />}
                  label="비상연락처"
                  value={emergency || "-"}
                />
                <Line
                  icon={<MapPin className="h-4 w-4" />}
                  label="주소"
                  value={address || "-"}
                />
                <Line
                  icon={<Banknote className="h-4 w-4" />}
                  label="급여계좌"
                  value={salary || "-"}
                />
              </div>

              {/* 액션: 모든 카드에서 동일 Y위치(상단 콘텐츠가 동일 구조 + 아래 마진으로 정렬) */}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                  onClick={() => openDetail(u)}
                  title="상세보기"
                >
                  <Eye className="h-4 w-4" />
                  상세보기
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                  onClick={() => openEdit(u)}
                  title="수정"
                >
                  <Pencil className="h-4 w-4" />
                  수정
                </button>
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

      {/* 상세보기 모달: 추가정보 노출 */}
      {detailOpen && detailUser && (
        <DetailModal user={detailUser} onClose={closeDetail} />
      )}
      {editOpen && editUser && (
        <AccountEditModal
          open={editOpen}
          user={editUser}
          onClose={closeEdit}
          onSave={(patch) => {
            typeof window !== "undefined" && console.debug("edit patch", patch);
            onApplyEdit?.(editUser.id, patch);
            closeEdit();
          }}
        />
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

/** 상세보기 모달: 추가정보 (사진/등본/초본/가족관계/신분증사진) */
function DetailModal({
  user,
  onClose,
}: {
  user: UserRow;
  onClose: () => void;
}) {
  const name = user.name;
  const email = user.email;
  const role = user.role;

  const phone = (user as any).phone ?? "";
  const emergency = (user as any).emergency_contact ?? "";
  const address =
    (user as any).address ??
    (user as any).addr ??
    (user as any).address_line ??
    "";
  const salary = (user as any).salary_account ?? "";

  // 추가정보
  const photo = (user as any).photo_url ?? "";
  const idPhoto = (user as any).id_photo_url ?? "";
  const docResident = (user as any).resident_register_url ?? "";
  const docExtract = (user as any).resident_extract_url ?? "";
  const docFamily = (user as any).family_relation_url ?? "";
  const birthday = (user as any).birthday ?? "";

  // 비밀번호 (마스킹 + 토글)
  const password = (user as any).password ?? "";
  const [showPw, setShowPw] = useState(false);
  const masked = password ? "•".repeat(Math.max(8, password.length)) : "—";

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[780px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold">계정 상세 정보</div>
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
            onClick={onClose}
            aria-label="close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 요약 헤더 */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 ring-1 ring-border">
              <AvatarImage
                src={photo || undefined}
                alt={`${name}의 프로필 사진`}
              />
              <AvatarFallback className="text-lg font-semibold">
                {initials(name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold">{name}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <Badge label={`권한: ${roleLabel(role as RoleKey)}`} />
                {birthday && <Badge label={`생년월일: ${birthday}`} />}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="이메일" value={email} />
                <Field label="연락처" value={phone || "-"} />
                <Field label="비상 연락처" value={emergency || "-"} />
                <Field label="주소" value={address || "-"} />
                <Field label="급여계좌" value={salary || "-"} />

                {/* 비밀번호 표시 (기본 마스킹 + 토글 버튼) */}
                <div className="sm:col-span-2">
                  <div className="mb-1 text-[11px] text-muted-foreground">
                    비밀번호
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {showPw ? password || "—" : masked}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border hover:bg-accent"
                      aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 표시"}
                      title={showPw ? "비밀번호 숨기기" : "비밀번호 표시"}
                    >
                      {showPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 추가정보 블록 */}
        <section className="rounded-xl bg-muted/20 p-4 sm:p-5">
          <div className="mb-3 text-sm font-semibold">추가정보</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DocTile label="사진" url={photo} imagePreferred />
            <DocTile label="신분증사진" url={idPhoto} imagePreferred />
            <DocTile label="등본" url={docResident} />
            <DocTile label="초본" url={docExtract} />
            <DocTile label="가족관계증명서" url={docFamily} />
          </div>
        </section>
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
        <button
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

/** 추가정보 카드 (이미지/파일 자동 처리) */
function DocTile({
  label,
  url,
  imagePreferred,
}: {
  label: string;
  url?: string;
  imagePreferred?: boolean;
}) {
  const safeUrl = (url ?? "").trim();
  const isImg = imagePreferred || isImageUrl(safeUrl);

  if (!safeUrl) {
    return (
      <div className="rounded-lg border p-3">
        <div className="mb-1 text-xs text-muted-foreground">{label}</div>
        <div className="text-sm text-muted-foreground">첨부 없음</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {isImg ? (
          <ImageIcon className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {label}
      </div>
      {isImg ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-md border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={safeUrl}
            alt={`${label} 미리보기`}
            className="h-40 w-full object-cover"
          />
        </a>
      ) : (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <span className="truncate">{fileNameFromUrl(safeUrl)}</span>
          <a
            href={safeUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
          >
            보기
          </a>
        </div>
      )}
    </div>
  );
}

function fileNameFromUrl(u: string) {
  try {
    const url = new URL(u);
    return decodeURIComponent(url.pathname.split("/").pop() || "");
  } catch {
    return u.split("?")[0].split("#")[0].split("/").pop() || u;
  }
}

function isImageUrl(u: string) {
  const ext = u.split("?")[0].split("#")[0].toLowerCase();
  return /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(ext);
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700">
      {label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="truncate text-sm">{value}</div>
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
