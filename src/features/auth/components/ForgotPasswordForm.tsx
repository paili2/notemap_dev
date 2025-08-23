"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/atoms/Form/Form";
import { ForgotSchema, ForgotValues } from "../schemas/forgot";
import { useState } from "react";

export function ForgotPasswordForm({
  onBackToLogin,
}: {
  onBackToLogin?: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const form = useForm<ForgotValues>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  async function onSubmit(values: ForgotValues) {
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(values),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "요청 처리에 실패했어요.");
      setMsg(
        j?.message || "재설정 링크를 전송했습니다. 메일함을 확인해주세요."
      );
    } catch (e: any) {
      setMsg(e?.message ?? "요청 처리 중 문제가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
          {msg}
        </div>
      )}
      <Form {...(form as any)}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="fp-email">이메일</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="fp-email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
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

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onBackToLogin}
              disabled={submitting}
              className="w-28"
            >
              돌아가기
            </Button>
            <Button
              type="submit"
              disabled={submitting || !form.formState.isValid}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  전송 중...
                </>
              ) : (
                "재설정 링크 보내기"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
