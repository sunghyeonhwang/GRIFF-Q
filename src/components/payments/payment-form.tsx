"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BANKS } from "@/lib/payment-constants";
import { z } from "zod";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useFormShortcuts } from "@/hooks/use-form-shortcuts";
import { FieldError } from "@/components/ui/field-error";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const paymentSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요."),
  amount: z.string().min(1, "금액을 입력해주세요."),
  bank: z.string().min(1, "은행을 선택해주세요."),
  account_number: z.string().min(1, "계좌번호를 입력해주세요."),
});

interface PaymentFormProps {
  userId: string;
  initialData?: any;
  readOnly?: boolean;
}

export function PaymentForm({
  userId,
  initialData,
  readOnly = false,
}: PaymentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    amount: initialData?.amount ? String(initialData.amount) : "",
    bank: initialData?.bank ?? "",
    account_number: initialData?.account_number ?? "",
    depositor_name: initialData?.depositor_name ?? "",
    due_date: initialData?.due_date ?? "",
    note: initialData?.note ?? "",
  });

  const { validate, clearError, getError, hasError } = useFormErrors(paymentSchema);
  const { markSaved } = useUnsavedChanges(form);

  const saveRef = useRef<() => void>(undefined);
  const cancelRef = useRef<() => void>(undefined);
  saveRef.current = save;
  cancelRef.current = () => router.back();

  useFormShortcuts({
    onSave: useCallback(() => saveRef.current?.(), []),
    onCancel: useCallback(() => cancelRef.current?.(), []),
    disabled: readOnly,
  });

  function formatAmount(value: string) {
    const num = value.replace(/[^0-9]/g, "");
    return num ? Number(num).toLocaleString() : "";
  }

  function handleAmountChange(value: string) {
    const raw = value.replace(/[^0-9]/g, "");
    setForm((p) => ({ ...p, amount: raw }));
    clearError("amount");
  }

  async function save() {
    if (!validate(form)) return;

    setLoading(true);
    const supabase = createClient();

    const payload = {
      name: form.name,
      amount: Number(form.amount),
      bank: form.bank,
      account_number: form.account_number,
      depositor_name: form.depositor_name,
      due_date: form.due_date || null,
      note: form.note,
      created_by: userId,
    };

    let error;
    if (initialData?.id) {
      ({ error } = await supabase
        .from("payments")
        .update(payload)
        .eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("payments").insert(payload));
    }

    setLoading(false);

    if (error) {
      toast.error("저장 실패", { description: error.message });
      return;
    }

    markSaved();
    toast.success(initialData?.id ? "결제 정보가 수정되었습니다" : "결제가 등록되었습니다");
    router.push("/payments");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>결제 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>이름 <span className="text-destructive">*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                clearError("name");
              }}
              placeholder="입금/결제 대상 이름"
              disabled={readOnly}
              className={hasError("name") ? "border-destructive" : ""}
            />
            <FieldError message={getError("name")} />
          </div>

          <div className="space-y-2">
            <Label>금액 <span className="text-destructive">*</span></Label>
            <Input
              value={formatAmount(form.amount)}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              disabled={readOnly}
              className={hasError("amount") ? "border-destructive" : ""}
            />
            <FieldError message={getError("amount")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>은행 <span className="text-destructive">*</span></Label>
              <Select
                value={form.bank}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, bank: v }));
                  clearError("bank");
                }}
                disabled={readOnly}
              >
                <SelectTrigger className={hasError("bank") ? "border-destructive" : ""}>
                  <SelectValue placeholder="은행 선택" />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={getError("bank")} />
            </div>
            <div className="space-y-2">
              <Label>계좌번호 <span className="text-destructive">*</span></Label>
              <Input
                value={form.account_number}
                onChange={(e) => {
                  setForm((p) => ({ ...p, account_number: e.target.value }));
                  clearError("account_number");
                }}
                placeholder="계좌번호"
                disabled={readOnly}
                className={hasError("account_number") ? "border-destructive" : ""}
              />
              <FieldError message={getError("account_number")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>입금자명</Label>
              <Input
                value={form.depositor_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, depositor_name: e.target.value }))
                }
                placeholder="입금자명"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>마감일</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, due_date: e.target.value }))
                }
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>비고</Label>
            <Textarea
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="비고 사항을 입력하세요."
              rows={3}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex justify-end">
          <LoadingButton onClick={save} loading={loading} loadingText="저장 중...">
            저장
          </LoadingButton>
        </div>
      )}
    </div>
  );
}
