"use client";

import { Badge } from "@/components/atoms/Badge/Badge";

type Props = {
  status?: string; // 공개/보류/비공개
  dealStatus?: string; // 분양중/예약중/계약중/계약완료
};

export default function DealBadges({ status, dealStatus }: Props) {
  const displayStatus = status ?? "공개";
  const displayDeal = dealStatus ?? "분양중";
  return (
    <>
      <Badge variant="secondary">{displayStatus}</Badge>
      <Badge variant={displayDeal === "계약완료" ? "destructive" : "outline"}>
        {displayDeal}
      </Badge>
    </>
  );
}
