"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/atoms/Form/Form";

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

export function LoginForm() {
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(
          j?.message || "이메일 또는 비밀번호가 올바르지 않습니다."
        );
      }
      router.replace(redirect);
    } catch (e: any) {
      setError(e?.message ?? "로그인 중 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
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
                <FormLabel htmlFor="email">이메일</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      disabled={submitting}
                      className="pr-9"
                      {...field}
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
                  <FormLabel htmlFor="password">비밀번호</FormLabel>
                  <Link
                    href="/forgot"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={submitting}
                      className="pr-9"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-accent"
                      aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                      disabled={submitting}
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
                    id="remember"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                    disabled={submitting}
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
                <Loader2 className="mr-2 size-4 animate-spin" />
                로그인 중...
              </>
            ) : (
              "로그인"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
