import * as React from "react";
import { PropertyViewDetails } from "../../types/property-view";
import { fmt } from "../modal/PropertyViewModal/utils";

export default function MetaBlock({ item }: { item: PropertyViewDetails }) {
  return (
    <div className="rounded-md border bg-white px-3 py-2">
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div className="flex flex-col">
          <span className="text-muted-foreground">생성자</span>
          <span className="font-medium">{item.createdByName ?? "-"}</span>
          <span className="text-muted-foreground">{fmt(item.createdAt)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground">답사자</span>
          <span className="font-medium">{item.inspectedByName ?? "-"}</span>
          <span className="text-muted-foreground">{fmt(item.inspectedAt)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground">수정자</span>
          <span className="font-medium">{item.updatedByName ?? "-"}</span>
          <span className="text-muted-foreground">{fmt(item.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
