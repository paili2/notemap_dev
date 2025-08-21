import z from "zod";

export const ForgotSchema = z.object({
  email: z
    .string({ required_error: "이메일을 입력해주세요." })
    .email("유효한 이메일 형식이 아닙니다."),
});

export type ForgotValues = z.infer<typeof ForgotSchema>;
