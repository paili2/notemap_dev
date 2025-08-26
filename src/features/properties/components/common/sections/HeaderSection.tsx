// features/properties/components/modal/sections/Header.tsx
"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";
import type {
  DealStatus,
  Visibility,
} from "@/features/properties/types/property-domain";

type Props = {
  title: string; // 입력중 제목
  fallbackTitle?: string; // item.title 같은 대체 표기
  visibility: Visibility;
  setVisibility: (v: Visibility) => void;
  dealStatus: DealStatus;
  setDealStatus: (v: DealStatus) => void;

  mode: "KN" | "R";
  toggleMode: () => void;
  onClose: () => void;
};

export default function Header({
  title,
  fallbackTitle,
  visibility,
  setVisibility,
  dealStatus,
  setDealStatus,
  mode,
  toggleMode,
  onClose,
}: Props) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">
          {title || fallbackTitle || "매물 수정"}
        </h2>

        {/* 게시 상태 */}
        <Select
          value={visibility}
          onValueChange={(v) => setVisibility(v as Visibility)}
        >
          <SelectTrigger className="h-8 w-24">
            <SelectValue placeholder="게시상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="공개">공개</SelectItem>
            <SelectItem value="보류">보류</SelectItem>
            <SelectItem value="비공개">비공개</SelectItem>
          </SelectContent>
        </Select>

        {/* 거래 상태 */}
        <Select
          value={dealStatus}
          onValueChange={(v) => setDealStatus(v as DealStatus)}
        >
          <SelectTrigger className="h-8 w-28">
            <SelectValue placeholder="거래상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="분양중">분양중</SelectItem>
            <SelectItem value="예약중">예약중</SelectItem>
            <SelectItem value="계약중">계약중</SelectItem>
            <SelectItem value="계약완료">계약완료</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={mode === "R" ? "outline" : "secondary"}
          onClick={toggleMode}
          title={mode === "KN" ? "K&N (공개 메모)" : "R (비밀 메모)"}
          className={cn(
            "h-8 px-3 text-sm",
            mode === "R" && "bg-rose-600 text-white"
          )}
        >
          {mode === "KN" ? "K&N" : "R"}
        </Button>

        <Button variant="ghost" size="icon" onClick={onClose} title="닫기">
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
