// 매물 등록/수정 모달 (사진 업로드 포함)
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/atoms/Dialog/Dialog";
import { PropertyFormValues } from "@/features/properties/types/propertyForm";
import { Button } from "@/components/atoms/Button/Button";
import { PropertyForm } from "./PropertyForm";

type PropertyModalProps = {
  mode?: "create" | "edit";
  defaultValues?: Partial<PropertyFormValues>;
  triggerLabel?: string;
  onSubmit?: (values: PropertyFormValues) => Promise<void> | void;
};

export function PropertyModal({
  mode = "create",
  defaultValues,
  triggerLabel = "매물 등록",
  onSubmit,
}: PropertyModalProps) {
  const [open, setOpen] = React.useState(false);

  const handleSubmit = async (values: PropertyFormValues) => {
    await onSubmit?.(values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "매물 등록" : "매물 수정"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "새로운 매물 정보를 입력하세요."
              : "매물 정보를 수정하세요."}
          </DialogDescription>
        </DialogHeader>
        <PropertyForm
          mode={mode}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
