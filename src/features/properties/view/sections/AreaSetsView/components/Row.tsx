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

  // 공통 박스 스타일 (모바일: 그냥 텍스트, PC: 박스)
  const boxClass =
    "flex items-center h-8 w-auto px-0 bg-transparent text-xs text-right shrink-0 " +
    "md:h-9 md:w-24 md:px-2 md:rounded-md md:border md:bg-gray-50 md:text-sm";

  return (
    <div className="flex items-center gap-1 md:gap-2 whitespace-nowrap px-2 md:px-0">
      {/* 라벨 */}
      <span className="text-xs md:text-sm text-muted-foreground w-8 md:w-10 shrink-0">
        {label}
      </span>

      {/* 최소 m² */}
      <div className={boxClass}>
        <span className="truncate">{minM2 || "-"}</span>
      </div>
      <span className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
        m²&nbsp;~
      </span>

      {/* 최대 m² */}
      <div className={boxClass}>
        <span className="truncate">{maxM2 || "-"}</span>
      </div>
      <span className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
        m²
      </span>

      <span className="mx-1 md:mx-2" />

      {/* 최소 평 */}
      <div className={boxClass}>
        <span className="truncate">{minPy || "-"}</span>
      </div>
      <span className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
        평&nbsp;~
      </span>

      {/* 최대 평 */}
      <div className={boxClass}>
        <span className="truncate">{maxPy || "-"}</span>
      </div>
      <span className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
        평
      </span>

      {!has && (
        <span className="text-xs md:text-sm text-muted-foreground ml-1 md:ml-2">
          -
        </span>
      )}
    </div>
  );
}

export default Row;
