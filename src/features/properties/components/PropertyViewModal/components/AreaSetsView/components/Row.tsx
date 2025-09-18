"use client";

import { toPy } from "@/features/properties/lib/area";

type RowProps = {
  label: string;
  minM2: string;
  maxM2: string;
};

function Row({ label, minM2, maxM2 }: RowProps) {
  const minPy = minM2 ? toPy(minM2) : "";
  const maxPy = maxM2 ? toPy(maxM2) : "";
  const has = minM2 || maxM2 || minPy || maxPy;

  // 고정 폭 상수 (박스/단위/물결을 동일 폭으로)
  const BOX_W = "w-28"; // 입력 박스 폭 (m²/평 모두 동일)
  const UNIT_W = "w-6"; // 단위 텍스트 폭 (m²/평 동일)
  const TILDE_W = "w-5"; // 물결(~) 폭

  return (
    <div className="flex items-center gap-2">
      {/* 라벨 */}
      <span className="text-sm text-muted-foreground w-10 shrink-0">
        {label}
      </span>

      {/* 값: 모바일은 세로, md 이상은 가로 */}
      <div className="flex flex-col md:flex-row md:items-center md:gap-4 flex-1">
        {/* m² 구간 */}
        <div className="flex items-center gap-1">
          <div
            className={`h-9 flex items-center rounded-md border px-2 bg-gray-50 text-sm ${BOX_W} text-right`}
          >
            <span className="truncate">{minM2 || "-"}</span>
          </div>

          {/* 단위/물결도 고정 폭으로 정렬 */}
          <span
            className={`text-muted-foreground inline-block ${UNIT_W} text-center`}
          >
            m²
          </span>
          <span
            className={`text-muted-foreground inline-block ${TILDE_W} text-center`}
          >
            ~
          </span>

          <div
            className={`h-9 flex items-center rounded-md border px-2 bg-gray-50 text-sm ${BOX_W} text-right`}
          >
            <span className="truncate">{maxM2 || "-"}</span>
          </div>
          <span
            className={`text-muted-foreground inline-block ${UNIT_W} text-center`}
          >
            m²
          </span>
        </div>

        {/* 평 구간 */}
        <div className="flex items-center gap-1 mt-2 md:mt-0">
          <div
            className={`h-9 flex items-center rounded-md border px-2 bg-gray-50 text-sm ${BOX_W} text-right`}
          >
            <span className="truncate">{minPy || "-"}</span>
          </div>
          <span
            className={`text-muted-foreground inline-block ${UNIT_W} text-center`}
          >
            평
          </span>
          <span
            className={`text-muted-foreground inline-block ${TILDE_W} text-center`}
          >
            ~
          </span>
          <div
            className={`h-9 flex items-center rounded-md border px-2 bg-gray-50 text-sm ${BOX_W} text-right`}
          >
            <span className="truncate">{maxPy || "-"}</span>
          </div>
          <span
            className={`text-muted-foreground inline-block ${UNIT_W} text-center`}
          >
            평
          </span>
        </div>
      </div>

      {!has && <span className="text-sm text-muted-foreground ml-2">-</span>}
    </div>
  );
}

export default Row;
