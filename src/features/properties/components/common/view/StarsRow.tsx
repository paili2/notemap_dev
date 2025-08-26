"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { value: number; max?: number };

export default function StarsRow({ value, max = 5 }: Props) {
  return (
    <div className="h-9 flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value;
        return (
          <Star
            key={i}
            className={cn(
              "h-5 w-5",
              filled ? "fill-current text-yellow-500" : "text-gray-300"
            )}
          />
        );
      })}
    </div>
  );
}
