// ImagesSection.tsx
"use client";

import ImagesGrid from "../ImagesGrid";

export default function ImagesSection({
  images,
  fileInputs,
  onPickFile,
}: {
  images: string[];
  fileInputs: React.RefObject<HTMLInputElement>[];
  onPickFile: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const pickImage = (idx: number) => fileInputs[idx].current?.click();
  return (
    <ImagesGrid
      images={images}
      onPickImage={pickImage}
      fileInputs={fileInputs}
      onPickFile={onPickFile}
    />
  );
}
