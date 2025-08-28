import * as React from "react";

import type { ImageItem } from "@/features/properties/types/media";
import MiniCarousel from "./MiniCarousel";
import LightboxModal from "./LightboxModal";

export default function ImageCard({ images }: { images: ImageItem[] }) {
  const [open, setOpen] = React.useState(false);
  const [startIndex, setStartIndex] = React.useState(0);

  return (
    <>
      {/* 카드 내부 미리보기 (클릭으로 라이트박스 열기) */}
      <div
        className="cursor-pointer"
        onClick={() => {
          setStartIndex(0); // 첫 장부터 or 마지막 클릭 인덱스 저장해서 넣어도 됨
          setOpen(true);
        }}
      >
        <MiniCarousel
          images={images}
          aspect="video"
          objectFit="cover"
          showDots={false}
          onImageClick={(i) => {
            setStartIndex(i);
            setOpen(true);
          }}
        />
      </div>

      {/* 라이트박스 모달 */}
      <LightboxModal
        open={open}
        images={images}
        initialIndex={startIndex}
        onClose={() => setOpen(false)}
        objectFit="contain"
      />
    </>
  );
}
