import { useEffect, useRef, useState } from "react";
import type { ImageItem } from "@/features/properties/types/media";

export function useLocalImageState() {
  const [imageFolders, setImageFolders] = useState<ImageItem[][]>([[]]);
  const [verticalImages, setVerticalImages] = useState<ImageItem[]>([]);

  const imageFoldersRef = useRef<ImageItem[][]>([]);
  const verticalImagesRef = useRef<ImageItem[]>([]);

  useEffect(() => {
    imageFoldersRef.current = imageFolders;
  }, [imageFolders]);

  useEffect(() => {
    verticalImagesRef.current = verticalImages;
  }, [verticalImages]);

  // 언마운트 시 blob url 정리
  useEffect(() => {
    return () => {
      imageFoldersRef.current.flat().forEach((f) => {
        if (f?.url?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(f.url);
          } catch {}
        }
      });
      verticalImagesRef.current.forEach((f) => {
        if (f?.url?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(f.url);
          } catch {}
        }
      });
    };
  }, []);

  return {
    imageFolders,
    setImageFolders,
    verticalImages,
    setVerticalImages,
    imageFoldersRef,
    verticalImagesRef,
  };
}
