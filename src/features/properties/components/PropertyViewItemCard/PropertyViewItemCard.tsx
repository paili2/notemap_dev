"use client";

import { X, Star } from "lucide-react";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { PropertyViewDetails, Registry } from "../../types/property-domain";

/* ===== 타입 ===== */
type PropertyViewItemCardProps = {
  open: boolean;
  onClose: () => void;
  item: PropertyViewDetails;
};

/* ===== 상수 ===== */

const REGISTRY_LIST: Registry[] = ["주택", "APT", "OP", "도/생", "근/생"];
const ALL_OPTIONS = [
  "에어컨",
  "냉장고",
  "김치냉장고",
  "세탁기",
  "건조기",
  "공기순환기",
  "건조대",
  "식기세척기",
  "스타일러",
  "시스템장",
  "비데",
  "붙박이",
  "개별창고",
];

export default function PropertyViewItemCard({
  open,
  onClose,
  item,
}: PropertyViewItemCardProps) {
  if (!open) return null;

  // 요구사항: 옵션은 에어컨/냉장고/세탁기 선택된 상태로 노출
  const forcedOptions = ["에어컨", "냉장고", "세탁기"];

  // 보기에서 체크로 노출하고 싶은 등기 기본값 (필요 시 조정)
  const effectiveRegistry =
    item.registry && item.registry.length
      ? item.registry
      : (["APT"] as Registry[]);

  const images = item.images ?? ["", "", "", ""];

  // 요구사항: 주차평점은 별 3개(노란색)로 고정 노출 (읽기전용)
  const parkingStars = 3;

  return (
    <div className="fixed inset-0 z-[110]">
      {/* dim */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* panel */}
      <div
        className="
          absolute left-1/2 top-1/2 w-[980px] max-w-[95vw] max-h-[92vh]
          -translate-x-1/2 -translate-y-1/2
          rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col
        "
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{item.title || "매물"}</h2>
            <Badge variant="secondary">{item.status ?? "공개"}</Badge>
            {item.type && <Badge variant="outline">{item.type}</Badge>}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose} title="닫기">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* 바디 */}
        <div
          className="
            grid grid-cols-[300px_1fr] gap-6 px-5 py-4
            flex-1 min-h-0 overflow-y-auto overscroll-y-contain
          "
        >
          {/* 좌: 이미지 (0~2 : 가로, 3 : 계약서 세로) */}
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => {
              const isContract = i === 3;
              const url = images[i];
              return (
                <div
                  key={i}
                  className={[
                    "relative rounded-lg overflow-hidden border bg-muted/30",
                    isContract ? "h-[360px]" : "h-[160px]",
                  ].join(" ")}
                >
                  <div className="absolute left-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
                    {isContract ? "계약서" : `사진 ${i + 1}`}
                  </div>

                  {url ? (
                    <img
                      src={url}
                      alt={isContract ? "contract" : `photo-${i}`}
                      className={[
                        "block w-full h-full",
                        isContract ? "object-contain bg-white" : "object-cover",
                      ].join(" ")}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      이미지 없음
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 우: 상세정보 (읽기 전용) — 라벨/섹션은 생성 폼과 동일 */}
          <div className="space-y-6 text-[13px]">
            <Field label="주소">
              <div className="h-9 flex items-center">{item.address || "—"}</div>
            </Field>

            <Field label="전세가">
              <div className="h-9 flex items-center">
                {item.jeonsePrice || "—"}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-6">
              <Field label="엘리베이터">
                <div className="h-9 flex items-center">
                  {item.elevator ?? "—"}
                </div>
              </Field>

              {/* ★ 주차평점: 별 3개 노란색 */}
              <Field label="주차평점">
                <div className="h-9 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i < parkingStars;
                    return (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          filled
                            ? "fill-current text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    );
                  })}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* ★ 경사도: 상만 파란 버튼, 중/하 미표시 */}
              <Field label="경사도">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    type="button"
                    className="px-3 bg-blue-600 hover:bg-blue-600/90 text-white"
                    disabled
                  >
                    상
                  </Button>
                </div>
              </Field>

              {/* ★ 구조(등급): 상만 파란 버튼, 중/하 미표시 */}
              <Field label="구조(등급)">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    type="button"
                    className="px-3 bg-blue-600 hover:bg-blue-600/90 text-white"
                    disabled
                  >
                    상
                  </Button>
                </div>
              </Field>
            </div>

            {/* 등기 */}
            <Field label="등기">
              <div className="flex flex-wrap gap-3">
                {REGISTRY_LIST.map((r) => (
                  <label
                    key={r}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={effectiveRegistry.includes(r)}
                      disabled
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </Field>

            {/* 옵션 — 에어컨/냉장고/세탁기 체크 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">옵션</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ALL_OPTIONS.map((op) => (
                  <label
                    key={op}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <Checkbox checked={forcedOptions.includes(op)} disabled />
                    <span>{op}</span>
                  </label>
                ))}
              </div>
              {item.optionEtc ? (
                <div className="text-xs text-muted-foreground">
                  기타: {item.optionEtc}
                </div>
              ) : null}
            </div>

            {/* 구조별 입력(요약) */}
            <div className="space-y-2">
              <div className="text-sm font-medium">구조별 입력</div>
              {(item.unitLines?.length ?? 0) === 0 ? (
                <div className="text-xs text-muted-foreground">—</div>
              ) : (
                <div className="space-y-1">
                  {item.unitLines!.map((l, idx) => (
                    <div
                      key={idx}
                      className="rounded border px-2 py-1 text-xs flex flex-wrap items-center gap-2"
                    >
                      <span>
                        {l.rooms}/{l.baths}
                      </span>
                      <span className="opacity-60">|</span>
                      <span>복층 {l.duplex ? "O" : "X"}</span>
                      <span className="opacity-60">|</span>
                      <span>테라스 {l.terrace ? "O" : "X"}</span>
                      {(l.primary || l.secondary) && (
                        <>
                          <span className="opacity-60">|</span>
                          <span>
                            {l.primary || "-"} / {l.secondary || "-"}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 공개 메모 */}
            <div className="rounded-md border bg-amber-50/60 p-3">
              <div className="text-sm font-medium mb-1">특이사항(공개)</div>
              <div className="whitespace-pre-wrap text-[13px]">
                {item.publicMemo || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 작은 유틸 ---------- */

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-3 text-[13px]">
      <div className="text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}
