"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AVATAR_ICONS, DECISION_PATTERNS } from "@/lib/predict-constants";
import { z } from "zod";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useFormShortcuts } from "@/hooks/use-form-shortcuts";
import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { X } from "lucide-react";
import { toast } from "sonner";

const avatarSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요."),
});

interface AvatarFormProps {
  userId: string;
  initialData?: any;
}

export function AvatarForm({ userId, initialData }: AvatarFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    company: initialData?.company ?? "",
    position: initialData?.position ?? "",
    icon: initialData?.icon ?? "user",
    tone_style: initialData?.tone_style ?? "",
    personality_tags: (initialData?.personality_tags as string[]) ?? [],
    decision_pattern: initialData?.decision_pattern ?? "",
    sensitive_topics: (initialData?.sensitive_topics as string[]) ?? [],
    common_phrases: (initialData?.common_phrases as string[]) ?? [],
    response_style: initialData?.response_style ?? "",
    emoji_usage: initialData?.emoji_usage ?? "",
    memo: initialData?.memo ?? "",
  });

  const [personalityInput, setPersonalityInput] = useState("");
  const [sensitiveInput, setSensitiveInput] = useState("");
  const [commonPhrasesInput, setCommonPhrasesInput] = useState("");

  const { validate, clearError, getError, hasError } = useFormErrors(avatarSchema);
  const { markSaved } = useUnsavedChanges(form);

  const saveRef = useRef<() => void>(undefined);
  const cancelRef = useRef<() => void>(undefined);
  saveRef.current = save;
  cancelRef.current = () => router.back();

  useFormShortcuts({
    onSave: useCallback(() => saveRef.current?.(), []),
    onCancel: useCallback(() => cancelRef.current?.(), []),
  });

  function handleTagKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    field: "personality_tags" | "sensitive_topics" | "common_phrases",
    inputValue: string,
    setInputValue: (v: string) => void
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = inputValue.trim();
      if (tag && !form[field].includes(tag)) {
        setForm((p) => ({ ...p, [field]: [...p[field], tag] }));
      }
      setInputValue("");
    }
  }

  function removeTag(field: "personality_tags" | "sensitive_topics" | "common_phrases", tag: string) {
    setForm((p) => ({
      ...p,
      [field]: p[field].filter((t) => t !== tag),
    }));
  }

  async function save() {
    if (!validate({ name: form.name })) return;

    setLoading(true);
    const supabase = createClient();

    const payload = {
      name: form.name,
      company: form.company || null,
      position: form.position || null,
      icon: form.icon,
      tone_style: form.tone_style || null,
      personality_tags: form.personality_tags,
      decision_pattern: form.decision_pattern || null,
      sensitive_topics: form.sensitive_topics,
      common_phrases: form.common_phrases,
      response_style: form.response_style || null,
      emoji_usage: form.emoji_usage || null,
      memo: form.memo || null,
      created_by: userId,
    };

    let error;
    if (initialData?.id) {
      ({ error } = await supabase
        .from("avatars")
        .update(payload)
        .eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("avatars").insert(payload));
    }

    setLoading(false);

    if (error) {
      toast.error("저장 실패", { description: error.message });
      return;
    }

    markSaved();
    router.push("/predict/avatars");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
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
              placeholder="클라이언트 이름"
              className={hasError("name") ? "border-destructive" : ""}
            />
            <FieldError message={getError("name")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>회사</Label>
              <Input
                value={form.company}
                onChange={(e) =>
                  setForm((p) => ({ ...p, company: e.target.value }))
                }
                placeholder="소속 회사"
              />
            </div>
            <div className="space-y-2">
              <Label>직급/역할</Label>
              <Input
                value={form.position}
                onChange={(e) =>
                  setForm((p) => ({ ...p, position: e.target.value }))
                }
                placeholder="직급 또는 역할"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>아이콘</Label>
            <Select
              value={form.icon}
              onValueChange={(v) => setForm((p) => ({ ...p, icon: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="아이콘 선택" />
              </SelectTrigger>
              <SelectContent>
                {AVATAR_ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>인격 프로필</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>말투 스타일</Label>
            <Textarea
              value={form.tone_style}
              onChange={(e) => setForm((p) => ({ ...p, tone_style: e.target.value }))}
              placeholder="말투 스타일을 자유롭게 설명하세요 (예: 격식체, 짧고 간결한 문장, ~합니다 체 사용)"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>성격 키워드</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {form.personality_tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag("personality_tags", tag)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              value={personalityInput}
              onChange={(e) => setPersonalityInput(e.target.value)}
              onKeyDown={(e) =>
                handleTagKeyDown(
                  e,
                  "personality_tags",
                  personalityInput,
                  setPersonalityInput
                )
              }
              placeholder="태그 입력 후 Enter"
            />
          </div>

          <div className="space-y-2">
            <Label>의사결정 패턴</Label>
            <Select
              value={form.decision_pattern}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, decision_pattern: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="의사결정 패턴 선택" />
              </SelectTrigger>
              <SelectContent>
                {DECISION_PATTERNS.map((pattern) => (
                  <SelectItem key={pattern} value={pattern}>
                    {pattern}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>민감한 주제</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {form.sensitive_topics.map((tag) => (
                <Badge key={tag} variant="destructive" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag("sensitive_topics", tag)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              value={sensitiveInput}
              onChange={(e) => setSensitiveInput(e.target.value)}
              onKeyDown={(e) =>
                handleTagKeyDown(
                  e,
                  "sensitive_topics",
                  sensitiveInput,
                  setSensitiveInput
                )
              }
              placeholder="태그 입력 후 Enter"
            />
          </div>

          <div className="space-y-2">
            <Label>자주 쓰는 표현</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {form.common_phrases.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag("common_phrases", tag)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              value={commonPhrasesInput}
              onChange={(e) => setCommonPhrasesInput(e.target.value)}
              onKeyDown={(e) =>
                handleTagKeyDown(
                  e,
                  "common_phrases",
                  commonPhrasesInput,
                  setCommonPhrasesInput
                )
              }
              placeholder="자주 쓰는 표현 입력 후 Enter"
            />
          </div>

          <div className="space-y-2">
            <Label>응답 스타일</Label>
            <Textarea
              value={form.response_style}
              onChange={(e) => setForm((p) => ({ ...p, response_style: e.target.value }))}
              placeholder="응답 길이, 형태, 패턴을 설명하세요 (예: 짧은 문장 위주, 질문에 질문으로 답하는 경향)"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>이모지 사용 패턴</Label>
            <Textarea
              value={form.emoji_usage}
              onChange={(e) => setForm((p) => ({ ...p, emoji_usage: e.target.value }))}
              placeholder="이모지 사용 패턴을 설명하세요 (예: 거의 사용 안함, 문장 끝에 자주 사용)"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>메모</Label>
            <Textarea
              value={form.memo}
              onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))}
              placeholder="추가 정보나 참고 사항을 입력하세요."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={loading}>
          {loading ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
