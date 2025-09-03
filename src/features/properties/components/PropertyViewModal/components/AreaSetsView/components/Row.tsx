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
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground w-10">{label}</span>

      <div className="h-9 flex items-center rounded-md border px-2 bg-gray-50 text-sm w-24 text-right">
        <span className="truncate">{minM2 || "-"}</span>
      </div>
      <span className="text-muted-foreground">m² ~</span>
      <div className="h-9 flex items-center rounded-md border px-2 bg-gray-50 text-sm w-24 text-right">
        <span className="truncate">{maxM2 || "-"}</span>
      </div>
      <span className="text-muted-foreground">m²</span>

      <div className="w-3" />

      <div className="h-9 flex items-center rounded-md border px-2 bg-gray-50 text-sm w-24 text-right">
        <span className="truncate">{minPy || "-"}</span>
      </div>
      <span className="text-muted-foreground">평 ~</span>
      <div className="h-9 flex items-center rounded-md border px-2 bg-gray-50 text-sm w-24 text-right">
        <span className="truncate">{maxPy || "-"}</span>
      </div>
      <span className="text-muted-foreground">평</span>

      {!has && <span className="text-sm text-muted-foreground ml-2">-</span>}
    </div>
  );
}

export default Row;
