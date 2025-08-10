// 로그인 화면
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, Loader2, Github, Chrome } from "lucide-react";

// shadcn/ui
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import { Separator } from "@/components/atoms/Separator/Separator";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/atoms/Form/Form";

// ---- Schema ----
const LoginSchema = z.object({
  email: z
    .string({ required_error: "이메일을 입력해주세요." })
    .email("유효한 이메일 형식이 아닙니다."),
  password: z
    .string({ required_error: "비밀번호를 입력해주세요." })
    .min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
  remember: z.boolean().optional().default(false),
});

export type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", remember: false },
    mode: "onChange",
  });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    setError(null);
    try {
      // TODO: 실제 로그인 API로 변경하세요.
      // 예시: const res = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify(values) })
      await new Promise((r) => setTimeout(r, 800));

      // 폼 값 예시 검증(데모)
      if (
        values.email === "demo@notemap.app" &&
        values.password === "notemap"
      ) {
        router.replace(redirect);
      } else {
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (e: any) {
      setError(e?.message ?? "로그인 중 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100dvh)] grid place-items-center bg-background">
      <Card className="w-full max-w-md shadow-sm border-muted">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div className="size-9 grid place-items-center rounded-xl border">
              {/* 간단한 로고 마크 */}
              <span className="text-sm font-semibold">N</span>
            </div>
            <div className="text-2xl font-bold tracking-tight">NoteMap</div>
          </div>
          <CardTitle className="text-xl text-center mt-2">로그인</CardTitle>
          <CardDescription className="text-center">
            계정에 접근하려면 이메일과 비밀번호를 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          {...field}
                          className="pr-9"
                        />
                        <Mail className="absolute right-2 top-1/2 -translate-y-1/2 size-4 opacity-60" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>비밀번호</FormLabel>
                      <Link
                        className="text-xs text-muted-foreground hover:underline"
                        href="/forgot"
                      >
                        비밀번호를 잊으셨나요?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPw ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          {...field}
                          className="pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent"
                          aria-label={
                            showPw ? "비밀번호 숨기기" : "비밀번호 보기"
                          }
                        >
                          {showPw ? (
                            <EyeOff className="size-4 opacity-60" />
                          ) : (
                            <Eye className="size-4 opacity-60" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remember me */}
              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                        id="remember"
                      />
                    </FormControl>
                    <Label htmlFor="remember" className="font-normal text-sm">
                      로그인 상태 유지
                    </Label>
                  </FormItem>
                )}
              />

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> 로그인
                    중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>
          </Form>

          <div className="my-6">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">또는</span>
              <Separator className="flex-1" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={() => alert("구글 로그인 연결")}
              >
                <Chrome className="mr-2 size-4" /> Google로 계속하기
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={() => alert("GitHub 로그인 연결")}
              >
                <Github className="mr-2 size-4" /> GitHub로 계속하기
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <p className="text-sm text-center text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="text-primary underline-offset-4 hover:underline"
            >
              회원가입
            </Link>
          </p>
          <p className="text-[10px] text-center text-muted-foreground">
            데모 계정:{" "}
            <span className="font-medium">demo@notemap.app / notemap</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
