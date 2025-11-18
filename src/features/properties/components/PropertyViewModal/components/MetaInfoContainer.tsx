"use client";

type Props = {
  /** q.data 전체(or fallback) */
  details: any;
};

/** 다양한 키/형태에서 이름 뽑기 */
function toName(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") {
    const s = v.trim();
    return s || null;
  }
  if (typeof v === "object" && "name" in v && v.name) {
    const s = String(v.name).trim();
    return s || null;
  }
  return null;
}

/** details / view / raw 에서 우선순위대로 값 찾기 */
function pick(details: any, ...keys: string[]) {
  return keys.reduce<any>((acc, k) => {
    if (acc != null) return acc;
    return details?.[k] ?? details?.view?.[k] ?? details?.raw?.[k] ?? undefined;
  }, undefined);
}

/** YYYY-MM-DD 로만 표시 */
function fmtDate(v: any): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10); // "2025-11-17"
}

function MetaItem({
  label,
  name,
  date,
}: {
  label: string;
  name: string | null;
  date: string | null;
}) {
  const text = name && date ? `${name} · ${date}` : name || date || "—";

  return (
    <div className="flex items-center gap-1 text-xs text-slate-600">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="text-slate-400">:</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

export default function MetaInfoContainer({ details }: Props) {
  if (!details) return null;

  // 생성
  const creatorName =
    toName(pick(details, "creator", "creatorInfo", "creatorName")) ??
    pick(details, "createdByName", "creator_name") ??
    null;
  const createdAt = fmtDate(pick(details, "createdAt", "created_at"));

  // 답사
  const surveyorName =
    toName(
      pick(details, "surveyor", "surveyInfo", "surveyedBy", "inspector")
    ) ??
    pick(details, "inspectedByName", "surveyedByName", "surveyed_by_name") ??
    null;
  const surveyedAt = fmtDate(
    pick(details, "surveyedAt", "surveyed_at", "inspectedAt")
  );

  // 마지막 수정
  const lastEditorName =
    toName(pick(details, "lastEditor", "modifier", "updatedBy")) ??
    pick(details, "updatedByName", "lastModifierName", "updated_by_name") ??
    null;
  const updatedAt = fmtDate(
    pick(details, "updatedAt", "updated_at", "modifiedAt")
  );

  return (
    <section className="mt-4 rounded-2xl border bg-slate-50 px-4 py-3">
      <h3 className="mb-2 text-xs font-semibold text-slate-900">기록 정보</h3>

      {/* 모바일: 세로 1열 / sm 이상: 3열 가로 배치 */}
      <div className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-3 sm:items-center sm:gap-2">
        <div className="text-left sm:text-left">
          <MetaItem label="생성" name={creatorName} date={createdAt} />
        </div>

        <div className="text-left sm:text-center">
          <MetaItem label="답사" name={surveyorName} date={surveyedAt} />
        </div>

        <div className="text-left sm:text-right">
          <MetaItem
            label="마지막 수정"
            name={lastEditorName}
            date={updatedAt}
          />
        </div>
      </div>
    </section>
  );
}
