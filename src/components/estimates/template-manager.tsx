"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, FileText, Copy } from "lucide-react";

interface TemplateItem {
  id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  note: string;
  sort_order: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  item_count: number;
}

interface TemplateManagerProps {
  templates: Template[];
  userId: string;
}

function formatNumber(value: number): string {
  return value ? value.toLocaleString() : "";
}

function parseNumber(value: string): number {
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}

export function TemplateManager({ templates, userId }: TemplateManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // New template form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newItems, setNewItems] = useState<TemplateItem[]>([
    { item_name: "", quantity: 1, unit_price: 0, note: "", sort_order: 0 },
  ]);

  function addNewItem() {
    setNewItems((prev) => [
      ...prev,
      {
        item_name: "",
        quantity: 1,
        unit_price: 0,
        note: "",
        sort_order: prev.length,
      },
    ]);
  }

  function removeNewItem(index: number) {
    if (newItems.length <= 1) return;
    setNewItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateNewItem(
    index: number,
    field: keyof TemplateItem,
    value: string | number
  ) {
    setNewItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  async function createTemplate() {
    if (!name.trim()) {
      alert("템플릿 이름을 입력해주세요.");
      return;
    }
    const validItems = newItems.filter((item) => item.item_name.trim());
    if (validItems.length === 0) {
      alert("항목을 최소 1개 이상 입력해주세요.");
      return;
    }

    setCreating(true);

    const { data: template, error } = await supabase
      .from("estimate_templates")
      .insert({ name, description, created_by: userId })
      .select("id")
      .single();

    if (error || !template) {
      alert("템플릿 생성 실패: " + (error?.message ?? "알 수 없는 오류"));
      setCreating(false);
      return;
    }

    const itemsPayload = validItems.map((item, index) => ({
      template_id: template.id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      note: item.note,
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from("estimate_template_items")
      .insert(itemsPayload);

    setCreating(false);

    if (itemsError) {
      alert("항목 저장 실패: " + itemsError.message);
      return;
    }

    setOpen(false);
    setName("");
    setDescription("");
    setNewItems([
      { item_name: "", quantity: 1, unit_price: 0, note: "", sort_order: 0 },
    ]);
    router.refresh();
  }

  async function viewTemplate(template: Template) {
    setSelectedTemplate(template);
    setLoading(true);
    setDetailOpen(true);

    const { data } = await supabase
      .from("estimate_template_items")
      .select("*")
      .eq("template_id", template.id)
      .order("sort_order");

    setTemplateItems(data ?? []);
    setLoading(false);
  }

  async function createEstimateFromTemplate() {
    if (!selectedTemplate) return;
    setCreating(true);

    const today = new Date().toISOString().slice(0, 10);
    const { data: estimate, error } = await supabase
      .from("estimates")
      .insert({
        project_name: selectedTemplate.name,
        client_name: "",
        estimate_date: today,
        status: "draft",
        note: `템플릿 "${selectedTemplate.name}"에서 생성됨`,
        created_by: userId,
      })
      .select("id")
      .single();

    if (error || !estimate) {
      alert("견적서 생성 실패: " + (error?.message ?? "알 수 없는 오류"));
      setCreating(false);
      return;
    }

    if (templateItems.length > 0) {
      const itemsPayload = templateItems.map((item, index) => ({
        estimate_id: estimate.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        specification: "",
        unit: "식",
        highlight: "",
        note: item.note,
        sort_order: index,
      }));

      await supabase.from("estimate_items").insert(itemsPayload);
    }

    setCreating(false);
    setDetailOpen(false);
    router.push(`/estimates/${estimate.id}/edit`);
  }

  async function deleteTemplate(templateId: string) {
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("estimate_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      alert("삭제 실패: " + error.message);
      return;
    }

    setDetailOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">견적서 템플릿</h1>
          <p className="text-muted-foreground">
            자주 사용하는 견적서 구성을 템플릿으로 관리합니다.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              새 템플릿
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 템플릿 만들기</DialogTitle>
              <DialogDescription>
                견적서 항목 구성을 템플릿으로 저장합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>템플릿 이름</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 웹 개발 기본 패키지"
                />
              </div>
              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="템플릿에 대한 설명을 입력하세요."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>항목 목록</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>항목명</TableHead>
                      <TableHead className="w-[80px]">수량</TableHead>
                      <TableHead className="w-[130px]">단가</TableHead>
                      <TableHead className="w-[130px]">비고</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Input
                            value={item.item_name}
                            onChange={(e) =>
                              updateNewItem(index, "item_name", e.target.value)
                            }
                            placeholder="항목명"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={String(item.quantity)}
                            onChange={(e) =>
                              updateNewItem(
                                index,
                                "quantity",
                                parseNumber(e.target.value)
                              )
                            }
                            placeholder="1"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={formatNumber(item.unit_price)}
                            onChange={(e) =>
                              updateNewItem(
                                index,
                                "unit_price",
                                parseNumber(e.target.value)
                              )
                            }
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.note}
                            onChange={(e) =>
                              updateNewItem(index, "note", e.target.value)
                            }
                            placeholder="비고"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeNewItem(index)}
                            disabled={newItems.length <= 1}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button variant="outline" size="sm" onClick={addNewItem}>
                  <Plus className="mr-2 size-4" />
                  항목 추가
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button onClick={createTemplate} disabled={creating}>
                  {creating ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Template cards */}
      {templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => viewTemplate(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-5 text-muted-foreground" />
                    <CardTitle className="text-base">
                      {template.name}
                    </CardTitle>
                  </div>
                  <Badge variant="outline">{template.item_count}개 항목</Badge>
                </div>
                {template.description && (
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {new Date(template.created_at).toLocaleDateString("ko-KR")}{" "}
                  생성
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            아직 등록된 템플릿이 없습니다.
          </CardContent>
        </Card>
      )}

      {/* Template detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            {selectedTemplate?.description && (
              <DialogDescription>
                {selectedTemplate.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-4">
                로딩 중...
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>항목명</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                    <TableHead className="text-right">단가</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead>비고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templateItems.map((item, index) => (
                    <TableRow key={item.id ?? index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {item.item_name}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(item.quantity).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(item.unit_price).toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(
                          Number(item.quantity) * Number(item.unit_price)
                        ).toLocaleString()}
                        원
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.note || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="flex justify-between">
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  selectedTemplate && deleteTemplate(selectedTemplate.id)
                }
              >
                <Trash2 className="mr-2 size-4" />
                삭제
              </Button>
              <Button
                onClick={createEstimateFromTemplate}
                disabled={creating || loading}
              >
                <Copy className="mr-2 size-4" />
                {creating ? "생성 중..." : "이 템플릿으로 견적서 생성"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
