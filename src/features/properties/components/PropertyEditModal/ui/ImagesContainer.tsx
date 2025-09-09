"use client";
import { MAX_FILES, MAX_PER_CARD } from "../../constants";
import ImagesSection, {
  ImageFile,
} from "../../sections/ImagesSection/ImagesSection";
import type { EditImagesAPI } from "../hooks/useEditImages";

export default function ImagesContainer({ images }: { images: EditImagesAPI }) {
  const {
    imageFolders,
    verticalImages,
    registerImageInput,
    openImagePicker,
    onPickFilesToFolder,
    addPhotoFolder,
    onChangeImageCaption,
    handleRemoveImage,
    onAddFiles,
    onChangeFileItemCaption,
    handleRemoveFileItem,
  } = images;

  return (
    <ImagesSection
      imagesByCard={imageFolders as unknown as ImageFile[][]}
      onOpenPicker={openImagePicker}
      onChangeFiles={onPickFilesToFolder}
      registerInputRef={registerImageInput}
      onAddPhotoFolder={addPhotoFolder}
      maxPerCard={MAX_PER_CARD}
      onChangeCaption={onChangeImageCaption}
      onRemoveImage={handleRemoveImage}
      fileItems={verticalImages}
      onAddFiles={onAddFiles}
      onChangeFileItemCaption={onChangeFileItemCaption}
      onRemoveFileItem={handleRemoveFileItem}
      maxFiles={MAX_FILES}
    />
  );
}
