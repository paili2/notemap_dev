"use client";

import Image from "next/image";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/utils";

type Props = {
  images: string[]; // 길이 4 예상 (0~2 사진, 3 '파일' 용)
  fileInputs?: React.RefObject<HTMLInputElement>[]; // 편집 모드에서만
  onPickFile?: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditing?: boolean; // 편집 모드일 때 업로드 버튼/인풋 표시
};

export default function DisplayImagesSection({
  images,
  fileInputs,
  onPickFile,
  isEditing = false,
}: Props) {
  const safe = [0, 1, 2, 3].map((i) => images?.[i] ?? "");

  return (
    <div className="space-y-3">
      {safe.map((url, i) => {
        const isContract = i === 3;
        return (
          <div
            key={i}
            className={cn(
              "relative rounded-lg overflow-hidden border bg-muted/30",
              isContract ? "h-[360px]" : "h-[160px]"
            )}
          >
            <div className="absolute left-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
              {isContract ? "파일" : `사진 ${i + 1}`}
            </div>

            {url ? (
              <Image
                src={url}
                alt={isContract ? "contract" : `photo-${i}`}
                fill
                sizes="(max-width: 980px) 95vw, 980px"
                className={cn(
                  "block",
                  isContract ? "object-contain bg-white" : "object-cover"
                )}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                이미지 없음
              </div>
            )}

            {isEditing && fileInputs && onPickFile && (
              <>
                <div className="absolute right-2 bottom-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => fileInputs[i]?.current?.click()}
                  >
                    {url ? "수정" : "업로드"}
                  </Button>
                </div>
                <input
                  ref={fileInputs[i]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickFile(i, e)}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
