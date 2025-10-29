"use client";

type OptionsBadgesProps = {
  /** 어댑터에서 넘어오는 옵션 라벨들(예: ["에어컨", "세탁기"]) */
  options?: string[] | null;
  /** 기타 입력(자유 텍스트) */
  optionEtc?: string | null;
};

export default function OptionsBadges({
  options,
  optionEtc,
}: OptionsBadgesProps) {
  // 1) 기본 옵션 라벨 정리(문자만, 공백 제거, 중복 제거)
  const base = Array.isArray(options)
    ? options
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter((s) => s.length > 0)
    : [];

  // 2) optionEtc가 있으면 뒤에 추가(중복 방지)
  const etc = typeof optionEtc === "string" ? optionEtc.trim() : "";
  const list = etc && !base.includes(etc) ? [...base, etc] : base;

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
