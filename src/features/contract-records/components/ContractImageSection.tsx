"use client";

import { useState, useRef } from "react";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent, CardHeader } from "@/components/atoms/Card/Card";

interface ImageItem {
  id: string;
  file: File;
  preview: string;
}

interface ContractImageSectionProps {
  onImagesChange?: (images: ImageItem[]) => void;
}

export function ContractImageSection({
  onImagesChange,
}: ContractImageSectionProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: ImageItem[] = [];

    Array.from(files).forEach((file) => {
      // 이미지 파일인지 확인
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 선택할 수 있습니다.");
        return;
      }

      const id = Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(file);

      newImages.push({
        id,
        file,
        preview,
      });
    });

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange?.(updatedImages);

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = (id: string) => {
    const imageToDelete = images.find((img) => img.id === id);
    if (imageToDelete) {
      URL.revokeObjectURL(imageToDelete.preview);
    }

    const updatedImages = images.filter((img) => img.id !== id);
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-base text-gray-700 pb-4">
            계약 이미지
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddImage}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-2">
          {images.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">이미지를 추가해주세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group aspect-square bg-gray-100 rounded-md overflow-hidden"
                >
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteImage(image.id)}
                    className="absolute top-1 right-1 h-5 w-5 p-0 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                    {image.file.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
