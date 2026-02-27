"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Eye, RotateCw, FileText, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
  tone_style?: string;
  personality_tags?: string[];
  decision_pattern?: string;
  sensitive_topics?: string[];
  common_phrases?: string[];
  response_style?: string;
  emoji_usage?: string;
  summary?: string;
}

interface TrainingData {
  id: string;
  avatar_id: string;
  file_name: string;
  file_type: string;
  raw_content: string;
  analysis_result: AnalysisResult | null;
  created_by: string;
  created_at: string;
}

interface TrainingDataListProps {
  avatarId: string;
  initialData: TrainingData[];
}

const FILE_TYPE_LABELS: Record<string, string> = {
  kakaotalk: "카카오톡",
  email_csv: "이메일/CSV",
  slack: "슬랙",
};

export function TrainingDataList({
  avatarId,
  initialData,
}: TrainingDataListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [data, setData] = useState(initialData);
  const [selectedItem, setSelectedItem] = useState<TrainingData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reanalyzing, setReanalyzing] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("이 학습 데이터를 삭제하시겠습니까?")) return;
    setDeleting(id);

    const { error } = await supabase
      .from("avatar_training_data")
      .delete()
      .eq("id", id);

    setDeleting(null);

    if (error) {
      toast.error("삭제 실패", { description: error.message });
      return;
    }

    setData((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem?.id === id) {
      setDetailOpen(false);
      setSelectedItem(null);
    }
  }

  async function handleReanalyze(item: TrainingData) {
    setReanalyzing(item.id);

    try {
      const res = await fetch("/api/predict/analyze-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarId,
          content: item.raw_content,
          fileType: item.file_type,
          fileName: item.file_name,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("재분석 실패", { description: result.error || "알 수 없는 오류" });
        return;
      }

      // Refresh data from server
      router.refresh();

      const { data: refreshed } = await supabase
        .from("avatar_training_data")
        .select("*")
        .eq("avatar_id", avatarId)
        .order("created_at", { ascending: false });

      if (refreshed) setData(refreshed);
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setReanalyzing(null);
    }
  }

  function viewDetail(item: TrainingData) {
    setSelectedItem(item);
    setDetailOpen(true);
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="size-5" />
            학습 데이터 이력 ({data.length}건)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>파일명</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>분석 상태</TableHead>
                  <TableHead>업로드일</TableHead>
                  <TableHead className="w-[140px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {item.file_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {FILE_TYPE_LABELS[item.file_type] || item.file_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.analysis_result ? (
                        <Badge variant="default">분석 완료</Badge>
                      ) : (
                        <Badge variant="secondary">미분석</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {item.analysis_result && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewDetail(item)}
                            title="분석 결과 보기"
                          >
                            <Eye className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReanalyze(item)}
                          disabled={reanalyzing === item.id}
                          title="재분석"
                        >
                          <RotateCw
                            className={`size-4 ${reanalyzing === item.id ? "animate-spin" : ""}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                          title="삭제"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Analysis detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              {selectedItem?.file_name}
            </DialogTitle>
            <DialogDescription>
              {selectedItem &&
                new Date(selectedItem.created_at).toLocaleDateString("ko-KR")}{" "}
              분석 결과
            </DialogDescription>
          </DialogHeader>
          {selectedItem?.analysis_result && (
            <div className="space-y-4 mt-4">
              {selectedItem.analysis_result.summary && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    요약
                  </p>
                  <p className="text-sm">
                    {selectedItem.analysis_result.summary}
                  </p>
                </div>
              )}

              {selectedItem.analysis_result.tone_style && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    말투 스타일
                  </p>
                  <p className="text-sm">
                    {selectedItem.analysis_result.tone_style}
                  </p>
                </div>
              )}

              {selectedItem.analysis_result.personality_tags &&
                selectedItem.analysis_result.personality_tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      성격 키워드
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedItem.analysis_result.personality_tags.map(
                        (tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

              {selectedItem.analysis_result.decision_pattern && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    의사결정 패턴
                  </p>
                  <p className="text-sm">
                    {selectedItem.analysis_result.decision_pattern}
                  </p>
                </div>
              )}

              {selectedItem.analysis_result.sensitive_topics &&
                selectedItem.analysis_result.sensitive_topics.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      민감한 주제
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedItem.analysis_result.sensitive_topics.map(
                        (topic) => (
                          <Badge key={topic} variant="outline">
                            {topic}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

              {selectedItem.analysis_result.common_phrases &&
                selectedItem.analysis_result.common_phrases.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      자주 쓰는 표현
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedItem.analysis_result.common_phrases.map(
                        (phrase) => (
                          <Badge key={phrase} variant="secondary">
                            {phrase}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

              {selectedItem.analysis_result.response_style && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    응답 스타일
                  </p>
                  <p className="text-sm">
                    {selectedItem.analysis_result.response_style}
                  </p>
                </div>
              )}

              {selectedItem.analysis_result.emoji_usage && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    이모지 사용 패턴
                  </p>
                  <p className="text-sm">
                    {selectedItem.analysis_result.emoji_usage}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
