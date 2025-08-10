"use client";

import * as React from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/atoms/Input/Input";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Button } from "@/components/atoms/Button/Button";
import { Textarea } from "@/components/atoms/Textarea/Textarea";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  status: z.enum(["판매중", "계약완료"]),
  type: z.enum(["아파트", "오피스텔", "빌라", "상가", "토지"]).optional(),
  priceSale: z.string().optional(), // 매매가
  priceDeposit: z.string().optional(), // 보증금
  priceMonthly: z.string().optional(), // 월세
  area: z.string().optional(), // 면적(㎡)
  rooms: z.number().int().min(0).optional(),
  address: z.string().min(1, "주소는 필수입니다."),
  detailAddress: z.string().optional(),
  description: z.string().optional(),
  isPublished: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).optional(),
});

export type PropertyFormValues = z.infer<typeof schema>;

export type PropertyFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<PropertyFormValues>;
  onSubmit?: (values: PropertyFormValues) => Promise<void> | void;
  className?: string;
};

/** TODO: ImageUploader 컴포넌트 붙이기 (S3 직업로드/백엔드 경유 중 선택)
 *  - props 예: onUploaded: (urls: string[]) => void
 */
function ImageUploaderPlaceholder({
  onChange,
}: {
  onChange?: (urls: string[]) => void;
}) {
  return (
    <div className="rounded-md border p-3 text-sm text-muted-foreground">
      이미지 업로더 자리입니다. (S3 업로드 연동 예정)
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            onChange?.([
              "https://placehold.co/800x600?text=Sample+1",
              "https://placehold.co/800x600?text=Sample+2",
            ])
          }
        >
          샘플 URL 넣기
        </Button>
      </div>
    </div>
  );
}

export function PropertyForm({
  mode,
  defaultValues,
  onSubmit,
  className,
}: PropertyFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    watch,
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(schema) as Resolver<PropertyFormValues>,
    defaultValues: {
      title: "",
      status: "판매중",
      type: "아파트",
      priceSale: "",
      priceDeposit: "",
      priceMonthly: "",
      area: "",
      rooms: 0,
      address: "",
      detailAddress: "",
      description: "",
      isPublished: true,
      imageUrls: [],
      ...defaultValues,
    },
  });

  const imageUrls = watch("imageUrls") || [];

  const submit = handleSubmit(async (values) => {
    // 문자열 가격 -> 숫자 정규화는 onSubmit에서 처리해도 OK
    await onSubmit?.(values);
  });

  return (
    <form onSubmit={submit} className={cn("space-y-6", className)}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">제목 *</label>
          <Input
            placeholder="예) 강남 역세권 오피스텔"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">상태 *</label>
          <select
            className="h-10 w-full rounded-md border px-3 text-sm"
            {...register("status")}
          >
            <option value="판매중">판매중</option>
            <option value="계약완료">계약완료</option>
          </select>
          {errors.status && (
            <p className="text-xs text-red-600">{errors.status.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">유형</label>
          <select
            className="h-10 w-full rounded-md border px-3 text-sm"
            {...register("type")}
          >
            <option>아파트</option>
            <option>오피스텔</option>
            <option>빌라</option>
            <option>상가</option>
            <option>토지</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">면적(㎡)</label>
          <Input placeholder="예) 84" {...register("area")} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">방 개수</label>
          <Input
            type="number"
            min={0}
            {...register("rooms", { valueAsNumber: true })}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">매매가</label>
          <Input placeholder="예) 12억 5,000만" {...register("priceSale")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">보증금</label>
          <Input placeholder="예) 5,000만" {...register("priceDeposit")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">월세</label>
          <Input placeholder="예) 120만" {...register("priceMonthly")} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">주소 *</label>
          <Input placeholder="도로명 주소" {...register("address")} />
          {errors.address && (
            <p className="text-xs text-red-600">{errors.address.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">상세 주소</label>
          <Input placeholder="동/호수 등" {...register("detailAddress")} />
        </div>
      </section>

      <section className="space-y-2">
        <label className="text-sm font-medium">설명</label>
        <Textarea
          rows={5}
          placeholder="추가 설명을 입력하세요"
          {...register("description")}
        />
      </section>

      <section className="space-y-2">
        <label className="text-sm font-medium">이미지</label>
        <ImageUploaderPlaceholder
          onChange={(urls) =>
            setValue("imageUrls", urls, { shouldDirty: true })
          }
        />
        {imageUrls?.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {imageUrls.map((u) => (
              <img
                key={u}
                src={u}
                alt="업로드 이미지"
                className="h-28 w-full rounded-md object-cover"
              />
            ))}
          </div>
        ) : null}
      </section>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox {...register("isPublished")} />
          공개
        </label>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => history.back()}
          >
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {mode === "create" ? "등록" : "수정 저장"}
          </Button>
        </div>
      </div>
    </form>
  );
}
