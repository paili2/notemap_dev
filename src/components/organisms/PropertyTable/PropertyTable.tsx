"use client";

import * as React from "react";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/atoms/Badge/Badge";

export type PropertyStatus = "판매중" | "계약완료";
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const statusToVariant = {
  판매중: "success",
  계약완료: "secondary",
} as const satisfies Record<PropertyStatus, BadgeVariant>;

export interface Property {
  id: number | string;
  title: string;
  price: string;
  location: string;
  status: PropertyStatus;
  imageUrl?: string;
}

type ColumnKey = "title" | "price" | "location" | "status";

export function PropertyTable({
  properties,
  onRowClick,
  onViewClick,
  className,
}: {
  properties: Property[];
  onRowClick?: (item: Property) => void;
  onViewClick?: (item: Property) => void;
  className?: string;
}) {
  const [sortBy, setSortBy] = React.useState<ColumnKey>("title");
  const [asc, setAsc] = React.useState(true);

  const sorted = React.useMemo(() => {
    const copy = [...properties];
    copy.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      // 가격 문자열은 숫자만 추출해서 비교(예: "5억 2,000만원")
      if (sortBy === "price") {
        const an = Number(String(av).replace(/[^\d]/g, "")) || 0;
        const bn = Number(String(bv).replace(/[^\d]/g, "")) || 0;
        return asc ? an - bn : bn - an;
      }
      const as = String(av);
      const bs = String(bv);
      return asc ? as.localeCompare(bs) : bs.localeCompare(as);
    });
    return copy;
  }, [properties, sortBy, asc]);

  const handleSort = (key: ColumnKey) => {
    if (sortBy === key) setAsc((v) => !v);
    else {
      setSortBy(key);
      setAsc(true);
    }
  };

  const thBtn = (label: string, key: ColumnKey) => (
    <button
      type="button"
      onClick={() => handleSort(key)}
      className="inline-flex items-center gap-1 font-medium hover:opacity-80"
      aria-label={`${label} 정렬`}
    >
      {label}
      <span className="text-xs opacity-70">
        {sortBy === key ? (asc ? "▲" : "▼") : "—"}
      </span>
    </button>
  );

  const statusVariant = (s: PropertyStatus) =>
    s === "판매중" ? "success" : "secondary";

  return (
    <div className={className}>
      <div className="rounded-xl border bg-background">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40">
            <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
              <th className="w-[88px]">이미지</th>
              <th>{thBtn("제목", "title")}</th>
              <th className="whitespace-nowrap">{thBtn("가격", "price")}</th>
              <th className="whitespace-nowrap">{thBtn("지역", "location")}</th>
              <th className="whitespace-nowrap">{thBtn("상태", "status")}</th>
              <th className="w-[96px] text-center">액션</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr
                key={item.id}
                className="border-t hover:bg-muted/30 cursor-pointer"
                onClick={() => onRowClick?.(item)}
              >
                <td className="px-3 py-2">
                  <div className="h-14 w-20 overflow-hidden rounded-md bg-muted">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{item.title}</div>
                </td>
                <td className="px-3 py-2 font-semibold">{item.price}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {item.location}
                </td>
                <td className="px-3 py-2">
                  <Badge variant={statusToVariant[item.status]}>
                    {item.status}
                  </Badge>
                </td>
                <td
                  className="px-3 py-2 text-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewClick?.(item);
                  }}
                >
                  <Button size="sm">상세</Button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td
                  className="px-3 py-8 text-center text-muted-foreground"
                  colSpan={6}
                >
                  표시할 매물이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
