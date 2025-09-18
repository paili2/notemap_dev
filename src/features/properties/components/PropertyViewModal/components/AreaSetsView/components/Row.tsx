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

  return (
    <div className="flex items-center gap-1 md:gap-2 whitespace-nowrap">
      <span className="text-xs md:text-sm text-muted-foreground w-8 md:w-10 shrink-0">
        {label}
      </span>

      <div className="h-8 md:h-9 flex items-center rounded-md border px-1.5 md:px-2 bg-gray-50 text-xs md:text-sm w-[64px] md:w-24 text-right shrink-0">
        <span className="truncate">{minM2 || "-"}</span>
      </div>
      <span className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
        m²&nbsp;~
      </span>
      <div className="h-8 md:h-9 flex items-center rounded-md border px-1.5 md:px-2 bg-gray-50 text-xs md:text-sm w-[64px] md:w-24 text-right shrink-0">
        <span className="truncate">{maxM2 || "-"}</span>
      </div>
      <span className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
        m²
      </span>

      <span className="mx-1 md:mx-2" />

      <div className="h-8 md:h-9 flex items-center rounded-md border px-1.5 md:px-2 bg-gray-50 text-xs md:text-sm w-[64px] md:w-24 text-right shrink-0">
        <span className="truncate">{minPy || "-"}</span>
      </div>
      <span className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
        평&nbsp;~
      </span>
      <div className="h-8 md:h-9 flex items-center rounded-md border px-1.5 md:px-2 bg-gray-50 text-xs md:text-sm w-[64px] md:w-24 text-right shrink-0">
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
