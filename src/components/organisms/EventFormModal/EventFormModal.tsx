"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Textarea } from "@/components/atoms/Textarea/Textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/atoms/Dialog/Dialog";

const schema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  date: z.string().min(1, "날짜는 필수입니다."),
  description: z.string().optional(),
});
export type EventFormValues = z.infer<typeof schema>;

export function EventFormModal({
  defaultDate,
  onCreate,
  triggerLabel = "새 일정",
}: {
  defaultDate?: string;
  onCreate?: (v: EventFormValues) => void | Promise<void>;
  triggerLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", date: defaultDate ?? "", description: "" },
  });

  const submit = handleSubmit(async (values) => {
    await onCreate?.(values);
    reset();
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>일정 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Input placeholder="제목 *" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>
          <div>
            <Input type="date" {...register("date")} />
            {errors.date && (
              <p className="text-xs text-red-600">{errors.date.message}</p>
            )}
          </div>
          <Textarea
            rows={3}
            placeholder="설명 (선택)"
            {...register("description")}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" type="button">
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
