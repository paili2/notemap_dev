"use client";

import {
  Phone,
  Trash2,
  X,
  Eye,
  Briefcase,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/atoms/Avatar/Avatar";
import type { RoleKey, UserRow } from "@/features/users/types";
import { useState, useEffect } from "react";

type Props = {
  rows: UserRow[];
  onChangeRole: (id: string, role: RoleKey) => void; // (필요 시 모달 등에서 사용)
  onRemove: (id: string) => void;
};

export default function AccountsListPage({
  rows,
  onRemove,
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);

  const openDetail = (u: UserRow) => {
    setDetailUser(u);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setTimeout(() => setDetailUser(null), 200);
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
                       className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                       onClick={() => openDetail(u)}
                       title="상세보기"
                     >
                       <Eye className="h-4 w-4" />
                       상세보기
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

      {/* 상세보기 모달 */}
      {detailOpen && detailUser && (
        <DetailModal user={detailUser} onClose={closeDetail} />
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
  const [detailData, setDetailData] = useState<{
    id: string;
    email: string;
    role: string;
    disabled: boolean;
    account: {
      id: string;
      name: string | null;
      phone: string | null;
      emergencyContact: string | null;
      address: string | null;
      salaryBankName: string | null;
      salaryAccount: string | null;
      profileUrl: string | null;
      isProfileCompleted: boolean;
      isDeleted: boolean;
      deletedAt: string | null;
    } | null;
    team: {
      id: string;
      name: string;
      code: string;
      isActive: boolean;
      role: "manager" | "staff" | null;
      isPrimary: boolean;
      joinedAt: string | null;
    } | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const { getCredentialIdFromAccountId, getCredentialDetail } = await import(
          "@/features/users/api/account"
        );
        // credentialId 조회 시도
        let credentialId: string | null = null;
        try {
          credentialId = await getCredentialIdFromAccountId(user.id);
        } catch (error) {
          console.warn("credentialId 조회 실패, 기본 정보만 표시:", error);
        }

        if (!credentialId) {
          // credentialId를 찾을 수 없는 경우 기본 정보만 사용
          setDetailData({
            id: user.id,
            email: user.email || "",
            role: user.role,
            disabled: false,
            account: {
              id: user.id,
              name: user.name,
              phone: user.phone || null,
              emergencyContact: null,
              address: null,
              salaryBankName: null,
              salaryAccount: null,
              profileUrl: user.photo_url || null,
              isProfileCompleted: false,
              isDeleted: false,
              deletedAt: null,
            },
            team: null,
          });
          setIsLoading(false);
          return;
        }

        // getCredentialDetail API 호출
        try {
          const data = await getCredentialDetail(credentialId);
          setDetailData(data);
        } catch (error) {
          console.error("상세 정보 조회 실패:", error);
          // getCredentialDetail 실패 시에도 기본 정보 표시
          setDetailData({
            id: user.id,
            email: user.email || "",
            role: user.role,
            disabled: false,
            account: {
              id: user.id,
              name: user.name,
              phone: user.phone || null,
              emergencyContact: null,
              address: null,
              salaryBankName: null,
              salaryAccount: null,
              profileUrl: user.photo_url || null,
              isProfileCompleted: false,
              isDeleted: false,
              deletedAt: null,
            },
            team: null,
          });
        }
      } catch (error) {
        console.error("상세 정보 조회 실패:", error);
        // 에러 발생 시 기본 정보만 사용
        setDetailData({
          id: user.id,
          email: user.email || "",
          role: user.role,
          disabled: false,
          account: {
            id: user.id,
            name: user.name,
            phone: user.phone || null,
            emergencyContact: null,
            address: null,
            salaryBankName: null,
            salaryAccount: null,
            profileUrl: user.photo_url || null,
            isProfileCompleted: false,
            isDeleted: false,
            deletedAt: null,
          },
          team: null,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetail();
  }, [user]);

  if (isLoading || !detailData) {
    return (
      <div className="fixed inset-0 z-[60]">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute left-1/2 top-1/2 w-[780px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background shadow-xl">
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">
                상세 정보를 불러오는 중...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const account = detailData.account;
  const team = detailData.team;

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
                src={account?.profileUrl || undefined}
                alt={`${account?.name || ""}의 프로필 사진`}
              />
              <AvatarFallback className="text-lg font-semibold">
                {initials(account?.name || "")}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold">{account?.name || "-"}</div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {account && (
                  <>
                    <Field label="직위" value={positionRankLabel((user as any).positionRank) || "-"} />
                    <Field label="연락처" value={account.phone || "-"} />
                    <Field label="이메일" value={detailData.email || "-"} />
                    <Field label="주소" value={account.address || "-"} className="sm:col-span-2" />
                    <Field label="비상 연락처" value={account.emergencyContact || "-"} />
                    <Field
                      label="급여계좌"
                      value={
                        account.salaryBankName && account.salaryAccount
                          ? `${account.salaryBankName} ${account.salaryAccount}`
                          : account.salaryAccount || "-"
                      }
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
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

function Badge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "destructive";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-gray-200 bg-gray-50 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
}

function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
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

