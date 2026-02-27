"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useFormShortcuts } from "@/hooks/use-form-shortcuts";
import { FieldError } from "@/components/ui/field-error";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().min(1, "이메일을 입력해주세요.").email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

interface LoginFormProps {
  redirectTo?: string;
  error?: string;
}

export function LoginForm({ redirectTo, error: initialError }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    initialError === "inactive"
      ? "비활성화된 계정입니다. 관리자에게 문의하세요."
      : null
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { validate, clearError, getError, hasError } = useFormErrors(loginSchema);

  const submitRef = useRef<() => void>(undefined);
  submitRef.current = () => handleSubmit();

  useFormShortcuts({
    onSubmit: useCallback(() => submitRef.current?.(), []),
  });

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    if (!validate({ email, password })) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    router.push(redirectTo || "/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">GRIFF-Q</CardTitle>
        <CardDescription>사내 업무 관리 시스템</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일 <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              placeholder="name@griff.co.kr"
              className={hasError("email") ? "border-destructive" : ""}
            />
            <FieldError message={getError("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호 <span className="text-destructive">*</span></Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              className={hasError("password") ? "border-destructive" : ""}
            />
            <FieldError message={getError("password")} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <LoadingButton type="submit" className="w-full" loading={loading} loadingText="로그인 중...">
            로그인
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  );
}
