"use client";

type OptionsBadgesProps = {
  /** 어댑터에서 넘어오는 옵션 라벨들(예: ["에어컨", "세탁기"]) */
  options?: string[] | null;
  /** 기타 입력(자유 텍스트: "노트북, 컴퓨터" 이런 문자열) */
  optionEtc?: string | null;
};

const SPLIT_RE = /[,\n;/]+/;
const normalize = (s: string) => s.trim().toLowerCase();

export default function OptionsBadges({
  options,
  optionEtc,
}: OptionsBadgesProps) {
  // 1) 기본 옵션 라벨 정리(문자만, 공백 제거)
  const base: string[] = Array.isArray(options)
    ? options
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter((s) => s.length > 0)
    : [];

  // 기본 옵션 중복 제거 (대소문자 무시)
  const seen = new Set<string>();
  const baseDedup: string[] = [];
  for (const label of base) {
    const key = normalize(label);
    if (!seen.has(key)) {
      seen.add(key);
      baseDedup.push(label);
    }
  }

  // 2) optionEtc 문자열을 여러 개로 분리하여 추가
  const extras: string[] =
    typeof optionEtc === "string"
      ? optionEtc
          .split(SPLIT_RE)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];

  const extrasDedup: string[] = [];
  for (const label of extras) {
    const key = normalize(label);
    // 기본 옵션에 이미 있거나, 이전 extra에 있으면 스킵
    if (seen.has(key)) continue;
    seen.add(key);
    extrasDedup.push(label);
  }

  // 최종 리스트: 기본 옵션 + 직접입력 옵션들
  const list = [...baseDedup, ...extrasDedup];

  if (list.length === 0) {
    return (
      <div className="text-sm">
        <span className="text-muted-foreground">옵션</span>
        <div className="mt-1 text-muted-foreground">-</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">옵션</div>
      <div className="flex flex-wrap gap-2" aria-label="옵션 목록">
        {list.map((op, i) => (
          <span
            key={`${op}-${i}`}
            className="inline-flex items-center rounded-full border px-2.5 h-6 text-sm bg-green-50 text-green-700"
          >
            {op}
          </span>
        ))}
      </div>
    </div>
  );
}
