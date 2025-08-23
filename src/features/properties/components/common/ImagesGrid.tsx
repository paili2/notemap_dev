// features/properties/components/common/ImagesGrid.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/atoms/Button/Button";
import Image from "next/image";

type Props = {
  images: string[];
  onPickImage: (idx: number) => void;
  fileInputs: React.RefObject<HTMLInputElement>[];
  onPickFile: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 기본값 3: 마지막 칸을 파일 슬롯으로 처리 */
  contractSlotIndex?: number;
};

export default function ImagesGrid({
  images,
  onPickImage,
  fileInputs,
  onPickFile,
  contractSlotIndex = 3,
}: Props) {
  const isPdf = (url: string) => /\.pdf(?:$|\?)/i.test(url);

  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => {
        const isContract = i === contractSlotIndex;
        const url = images[i];

        return (
          <div
            key={i}
            className={`relative rounded-lg overflow-hidden border bg-muted/30 ${
              isContract ? "h-[360px]" : "h-[160px]"
            }`}
          >
            {/* 라벨 */}
            <div className="absolute left-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
              {isContract ? "파일" : `사진 ${i + 1}`}
            </div>

            {/* 미리보기 */}
            {url ? (
              isContract && isPdf(url) ? (
                // PDF 미리보기 (가능한 경우)
                <object
                  data={url}
                  type="application/pdf"
                  className="block w-full h-full bg-white"
                >
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    PDF 미리보기를 지원하지 않습니다.
                  </div>
                </object>
              ) : (
                <Image
                  src={url}
                  alt={isContract ? "contract-file" : `photo-${i}`}
                  className={`block w-full h-full ${
                    isContract ? "object-contain bg-white" : "object-cover"
                  }`}
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {isContract ? "파일 업로드" : "파일 업로드"}
              </div>
            )}

            {/* 버튼 */}
            <div className="absolute right-2 bottom-2 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onPickImage(i)}
              >
                {images[i] ? "수정" : "업로드"}
              </Button>
            </div>

            {/* 숨겨진 input */}
            <input
              ref={fileInputs[i]}
              type="file"
              accept={isContract ? "image/*,application/pdf" : "image/*"}
              className="hidden"
              onChange={(e) => onPickFile(i, e)}
            />
          </div>
        );
      })}
    </div>
  );
}
