"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/atoms/Dialog/Dialog";
import { FormError } from "@/components/atoms/FormError/FormError";
import { Plus } from "lucide-react";
import { createTeam } from "../api";
import { useToast } from "@/hooks/use-toast";

const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, "팀 이름은 최소 2글자 이상이어야 합니다")
    .max(100, "팀 이름은 최대 100글자까지 가능합니다"),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

interface CreateTeamFormProps {
  onTeamCreated?: () => void;
}

export function CreateTeamForm({ onTeamCreated }: CreateTeamFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
  });

  const onSubmit = async (data: CreateTeamFormData) => {
    setIsLoading(true);
    try {
      await createTeam({
        name: data.name,
        code: data.name.replace(/\s+/g, "").toLowerCase(),
        isActive: true,
      });

      toast({
        title: "팀 생성 완료",
        description: `"${data.name}" 팀이 성공적으로 생성되었습니다.`,
      });

      reset();
      setOpen(false);
      onTeamCreated?.();
    } catch (error) {
      console.error("팀 생성 실패:", error);
      toast({
        title: "팀 생성 실패",
        description: "팀 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />새 팀 생성
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새 팀 생성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">팀 이름</Label>
            <Input
              id="name"
              placeholder="예: 개발팀, 마케팅팀"
              {...register("name")}
              disabled={isLoading}
            />
            <FormError error={errors.name} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "생성 중..." : "팀 생성"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
