// 로그인 화면 (polished)
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, Loader2, Github, Chrome } from "lucide-react";

// shadcn/ui atoms (project-local)
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
      await new Promise((r) => setTimeout(r, 800));

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
    <div className="relative min-h-[100dvh] grid place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 to-white dark:from-slate-950 dark:to-slate-950">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-indigo-200/50 blur-3xl dark:bg-indigo-500/10" />
      </div>

      <Card className="w-full max-w-md rounded-2xl border border-border/60 bg-background/80 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader className="space-y-2">
          <div className="mx-auto mt-2 flex items-center gap-2">
            <div className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-indigo-400">
                NoteMap
              </span>
            </div>
          </div>
          <CardTitle className="text-center text-2xl">로그인</CardTitle>
          <CardDescription className="text-center">
            계정에 접근하려면 이메일과 비밀번호를 입력하세요.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}

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
                        <Mail
                          aria-hidden
                          className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 opacity-60"
                        />
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
                        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
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
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-accent"
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
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                        id="remember"
                      />
                    </FormControl>
                    <Label htmlFor="remember" className="text-sm font-normal">
                      로그인 상태 유지
                    </Label>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !form.formState.isValid}
              >
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
        </CardContent>
      </Card>
    </div>
  );
}
