import { z } from "zod";

export const propertyFormSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  status: z.enum(["판매중", "계약완료"]),
  type: z.enum(["아파트", "오피스텔", "빌라", "상가", "토지"]).optional(),
  priceSale: z.string().optional(),
  priceDeposit: z.string().optional(),
  priceMonthly: z.string().optional(),
  area: z.string().optional(),
  rooms: z.number().int().min(0).optional(),
  address: z.string().min(1, "주소는 필수입니다."),
  detailAddress: z.string().optional(),
  description: z.string().optional(),
  isPublished: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).optional(),
});
export type PropertyStatus = z.infer<typeof propertyFormSchema>["status"];
