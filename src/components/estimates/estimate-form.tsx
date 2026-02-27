"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VAT_RATE } from "@/lib/estimate-constants";
import { z } from "zod";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useAutoSaveStatus } from "@/hooks/use-auto-save-status";
import { useFormShortcuts } from "@/hooks/use-form-shortcuts";
import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const estimateSchema = z.object({
  project_name: z.string().min(1, "프로젝트명을 입력해주세요."),
  client_name: z.string().min(1, "고객명을 입력해주세요."),
  estimate_date: z.string().min(1, "견적일을 입력해주세요."),
});

interface EstimateItem {
  item_name: string;
  quantity: string;
  unit_price: string;
  note: string;
  highlight: string;
}

interface EstimateFormProps {
  userId: string;
  initialData?: any;
  initialItems?: any[];
  readOnly?: boolean;
}

function createEmptyItem(): EstimateItem {
  return {
    item_name: "",
    quantity: "1",
    unit_price: "",
    note: "",
    highlight: "",
  };
}

function formatNumber(value: string): string {
  const num = value.replace(/[^0-9]/g, "");
  return num ? Number(num).toLocaleString() : "";
}

function parseNumber(value: string): number {
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}

const HIGHLIGHT_OPTIONS = [
  { value: "", label: "없음" },
  { value: "yellow", label: "노랑" },
  { value: "red", label: "빨강" },
  { value: "green", label: "초록" },
  { value: "blue", label: "파랑" },
];

export function EstimateForm({
  userId,
  initialData,
  initialItems,
  readOnly = false,
}: EstimateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    project_name: initialData?.project_name ?? "",
    client_name: initialData?.client_name ?? "",
    estimate_date: initialData?.estimate_date ?? "",
    valid_until: initialData?.valid_until ?? "",
    note: initialData?.note ?? "",
  });

  const [items, setItems] = useState<EstimateItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems.map((item) => ({
          item_name: item.item_name ?? "",
          quantity: item.quantity ? String(item.quantity) : "1",
          unit_price: item.unit_price ? String(item.unit_price) : "",
          note: item.note ?? "",
          highlight: item.highlight ?? "",
        }))
      : [createEmptyItem()]
  );

  const { validate, clearError, getError, hasError } = useFormErrors(estimateSchema);
  const { markSaved } = useUnsavedChanges({ form, items });
  const autoSave = useAutoSaveStatus();

  const saveRef = useRef<() => void>(undefined);
  const cancelRef = useRef<() => void>(undefined);
  saveRef.current = save;
  cancelRef.current = () => router.back();

  useFormShortcuts({
    onSave: useCallback(() => saveRef.current?.(), []),
    onCancel: useCallback(() => cancelRef.current?.(), []),
    disabled: readOnly,
  });

  function updateItem(index: number, field: keyof EstimateItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, createEmptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function getItemAmount(item: EstimateItem): number {
    const qty = parseNumber(item.quantity);
    const price = parseNumber(item.unit_price);
    return qty * price;
  }

  const subtotal = items.reduce((sum, item) => sum + getItemAmount(item), 0);
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  async function save() {
    if (!validate(form)) return;

    const validItems = items.filter((item) => item.item_name.trim());
    if (validItems.length === 0) {
      toast.error("항목을 최소 1개 이상 입력해주세요.");
      return;
    }

    setLoading(true);
    autoSave.setSaving();
    const supabase = createClient();

    const estimatePayload = {
      project_name: form.project_name,
      client_name: form.client_name,
      estimate_date: form.estimate_date,
      valid_until: form.valid_until || null,
      note: form.note,
      created_by: userId,
    };

    let error;

    if (initialData?.id) {
      ({ error } = await supabase
        .from("estimates")
        .update(estimatePayload)
        .eq("id", initialData.id));

      if (!error) {
        ({ error } = await supabase
          .from("estimate_items")
          .delete()
          .eq("estimate_id", initialData.id));

        if (!error) {
          const itemsPayload = validItems.map((item, index) => ({
            estimate_id: initialData.id,
            item_name: item.item_name,
            quantity: parseNumber(item.quantity),
            unit_price: parseNumber(item.unit_price),
            amount: getItemAmount(item),
            note: item.note,
            highlight: item.highlight || null,
            sort_order: index,
          }));

          ({ error } = await supabase
            .from("estimate_items")
            .insert(itemsPayload));
        }
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("estimates")
        .insert(estimatePayload)
        .select("id")
        .single();

      error = insertError;

      if (!error && data) {
        const itemsPayload = validItems.map((item, index) => ({
          estimate_id: data.id,
          item_name: item.item_name,
          quantity: parseNumber(item.quantity),
          unit_price: parseNumber(item.unit_price),
          amount: getItemAmount(item),
          note: item.note,
          highlight: item.highlight || null,
          sort_order: index,
        }));

        ({ error } = await supabase
          .from("estimate_items")
          .insert(itemsPayload));
      }
    }

    setLoading(false);

    if (error) {
      autoSave.setError();
      toast.error("저장 실패", { description: error.message });
      return;
    }

    autoSave.setSaved();
    markSaved();
    router.push("/estimates");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>프로젝트명 <span className="text-destructive">*</span></Label>
              <Input
                value={form.project_name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, project_name: e.target.value }));
                  clearError("project_name");
                }}
                placeholder="프로젝트명을 입력하세요"
                disabled={readOnly}
                className={hasError("project_name") ? "border-destructive" : ""}
              />
              <FieldError message={getError("project_name")} />
            </div>
            <div className="space-y-2">
              <Label>고객명 <span className="text-destructive">*</span></Label>
              <Input
                value={form.client_name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, client_name: e.target.value }));
                  clearError("client_name");
                }}
                placeholder="고객명을 입력하세요"
                disabled={readOnly}
                className={hasError("client_name") ? "border-destructive" : ""}
              />
              <FieldError message={getError("client_name")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>견적일 <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={form.estimate_date}
                onChange={(e) => {
                  setForm((p) => ({ ...p, estimate_date: e.target.value }));
                  clearError("estimate_date");
                }}
                disabled={readOnly}
                className={hasError("estimate_date") ? "border-destructive" : ""}
              />
              <FieldError message={getError("estimate_date")} />
            </div>
            <div className="space-y-2">
              <Label>유효기간</Label>
              <Input
                type="date"
                value={form.valid_until}
                onChange={(e) =>
                  setForm((p) => ({ ...p, valid_until: e.target.value }))
                }
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>비고</Label>
            <Textarea
              value={form.note}
              onChange={(e) =>
                setForm((p) => ({ ...p, note: e.target.value }))
              }
              placeholder="비고 사항을 입력하세요."
              rows={3}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>항목 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>항목명</TableHead>
                <TableHead className="w-[100px]">수량</TableHead>
                <TableHead className="w-[150px]">단가</TableHead>
                <TableHead className="w-[150px]">금액</TableHead>
                <TableHead className="w-[150px]">비고</TableHead>
                <TableHead className="w-[120px]">강조색</TableHead>
                {!readOnly && (
                  <TableHead className="w-[60px]" />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell>
                    <Input
                      value={item.item_name}
                      onChange={(e) =>
                        updateItem(index, "item_name", e.target.value)
                      }
                      placeholder="항목명"
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          e.target.value.replace(/[^0-9]/g, "")
                        )
                      }
                      placeholder="0"
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={formatNumber(item.unit_price)}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "unit_price",
                          e.target.value.replace(/[^0-9]/g, "")
                        )
                      }
                      placeholder="0"
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {getItemAmount(item).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.note}
                      onChange={(e) =>
                        updateItem(index, "note", e.target.value)
                      }
                      placeholder="비고"
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.highlight}
                      onValueChange={(v) =>
                        updateItem(index, "highlight", v === "none" ? "" : v)
                      }
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="없음" />
                      </SelectTrigger>
                      <SelectContent>
                        {HIGHLIGHT_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value || "none"}
                            value={opt.value || "none"}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!readOnly && (
            <div className="mt-4">
              <Button variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                항목 추가
              </Button>
            </div>
          )}

          <div className="mt-6 flex flex-col items-end space-y-1 text-sm">
            <div className="flex w-[300px] justify-between">
              <span className="text-muted-foreground">소계</span>
              <span className="font-medium">{subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex w-[300px] justify-between">
              <span className="text-muted-foreground">
                부가세({Math.round(VAT_RATE * 100)}%)
              </span>
              <span className="font-medium">{vat.toLocaleString()}원</span>
            </div>
            <div className="flex w-[300px] justify-between border-t pt-1">
              <span className="font-semibold">총액</span>
              <span className="font-semibold text-lg">
                {total.toLocaleString()}원
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex items-center justify-end gap-3">
          {autoSave.statusText && (
            <span className={`text-sm ${autoSave.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
              {autoSave.statusText}
            </span>
          )}
          <Button onClick={save} disabled={loading}>
            {loading ? "저장 중..." : "저장"}
          </Button>
        </div>
      )}
    </div>
  );
}
