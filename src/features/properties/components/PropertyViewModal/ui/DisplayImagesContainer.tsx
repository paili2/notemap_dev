"use client";

import DisplayImagesSection from "../components/DisplayImagesSection/DisplayImagesSection";

type Card = any; // 필요 시 정확 타입으로 교체
type Img = any; // 필요 시 정확 타입으로 교체
type File = any; // 필요 시 정확 타입으로 교체

export default function DisplayImagesContainer({
  cards,
  images,
  files,
}: {
  cards: Card[];
  images?: Img[];
  files: File[];
}) {
  return <DisplayImagesSection cards={cards} images={images} files={files} />;
}
