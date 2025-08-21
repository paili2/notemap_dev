import z from "zod";

export const LoginSchema = z.object({
  email: z
    .string({ required_error: "이메일을 입력해주세요." })
    .email("유효한 이메일 형식이 아닙니다."),
  password: z
    .string({ required_error: "비밀번호를 입력해주세요." })
    .min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
  remember: z.boolean().optional().default(false),
});

export type LoginValues = z.infer<typeof LoginSchema>;
