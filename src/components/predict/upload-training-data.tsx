"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Type } from "lucide-react";

interface UploadTrainingDataProps {
  avatar: {
    id: string;
    name: string;
    tone_style: string | null;
    personality_tags: string[] | null;
    decision_pattern: string | null;
    sensitive_topics: string[] | null;
    common_phrases: string[] | null;
    response_style: string | null;
    emoji_usage: string | null;
  };
}

interface AnalysisResult {
  tone_style: string;
  personality_tags: string[];
  decision_pattern: string;
  sensitive_topics: string[];
  common_phrases: string[];
  response_style: string;
  emoji_usage: string;
  summary: string;
}

export function UploadTrainingData({ avatar }: UploadTrainingDataProps) {
  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const [fileType, setFileType] = useState<string>("kakaotalk");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptTypes = fileType === "kakaotalk" ? ".txt" : ".csv";

  const handleFile = useCallback((file: File) => {
    setError(null);
    setAnalysis(null);
    setApplied(false);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target?.result as string);
    };
    reader.onerror = () => {
      setError("파일을 읽을 수 없습니다.");
    };
    reader.readAsText(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function analyzeFile() {
    const content = inputMode === "file" ? fileContent : pasteText.trim();
    const name = inputMode === "file" ? fileName : "pasted-text";
    if (!content || (inputMode === "file" && !fileName)) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/predict/analyze-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarId: avatar.id,
          content,
          fileType,
          fileName: name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "분석에 실패했습니다.");
        return;
      }

      setAnalysis(data.analysis);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function applyToProfile() {
    if (!analysis) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("avatars")
        .update({
          tone_style: analysis.tone_style,
          personality_tags: analysis.personality_tags,
          decision_pattern: analysis.decision_pattern,
          sensitive_topics: analysis.sensitive_topics,
          common_phrases: analysis.common_phrases,
          response_style: analysis.response_style,
          emoji_usage: analysis.emoji_usage,
        })
        .eq("id", avatar.id);

      if (updateError) {
        setError("프로필 업데이트에 실패했습니다.");
        return;
      }

      setApplied(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Input mode toggle + file type selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">입력 방식 및 유형</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={inputMode === "file" ? "default" : "outline"}
              size="sm"
              onClick={() => setInputMode("file")}
            >
              <Upload className="mr-2 size-4" />
              파일 업로드
            </Button>
            <Button
              variant={inputMode === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setInputMode("text")}
            >
              <Type className="mr-2 size-4" />
              텍스트 붙여넣기
            </Button>
          </div>

          <Select value={fileType} onValueChange={setFileType}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kakaotalk">카카오톡 대화 (.txt)</SelectItem>
              <SelectItem value="email_csv">이메일/CSV (.csv)</SelectItem>
              <SelectItem value="slack">슬랙 대화</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Upload / Paste area */}
      <Card>
        <CardContent className="pt-6">
          {inputMode === "file" ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptTypes}
                onChange={handleFileInput}
                className="hidden"
              />
              {fileName ? (
                <>
                  <FileText className="mb-3 size-10 text-muted-foreground" />
                  <p className="font-medium">{fileName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    클릭하여 다른 파일 선택
                  </p>
                </>
              ) : (
                <>
                  <Upload className="mb-3 size-10 text-muted-foreground" />
                  <p className="font-medium">파일을 드래그하거나 클릭하여 업로드</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {fileType === "kakaotalk"
                      ? ".txt 파일 (카카오톡 대화 내보내기)"
                      : fileType === "slack"
                        ? ".txt 또는 .json 파일 (슬랙 대화 내보내기)"
                        : ".csv 파일 (이메일 또는 CSV)"}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  setAnalysis(null);
                  setApplied(false);
                  setError(null);
                }}
                placeholder="대화 내용을 여기에 붙여넣으세요..."
                rows={12}
                className="font-mono text-sm"
              />
              {pasteText && (
                <p className="text-xs text-muted-foreground">
                  {pasteText.length.toLocaleString()}자 입력됨
                </p>
              )}
            </div>
          )}

          {((inputMode === "file" && fileContent) || (inputMode === "text" && pasteText.trim())) && !analysis && (
            <div className="mt-4 flex justify-end">
              <Button onClick={analyzeFile} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  "분석 시작"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="size-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Analysis results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="size-5 text-green-600" />
              분석 완료
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                요약
              </p>
              <p className="text-sm">{analysis.summary}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                말투 스타일
              </p>
              <p className="text-sm">{analysis.tone_style}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                성격 키워드
              </p>
              <div className="flex flex-wrap gap-1">
                {analysis.personality_tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                의사결정 패턴
              </p>
              <p className="text-sm">{analysis.decision_pattern}</p>
            </div>

            {analysis.sensitive_topics.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  민감한 주제
                </p>
                <div className="flex flex-wrap gap-1">
                  {analysis.sensitive_topics.map((topic) => (
                    <Badge key={topic} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.common_phrases?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  자주 쓰는 표현
                </p>
                <div className="flex flex-wrap gap-1">
                  {analysis.common_phrases.map((phrase) => (
                    <Badge key={phrase} variant="secondary">
                      {phrase}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.response_style && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  응답 스타일
                </p>
                <p className="text-sm">{analysis.response_style}</p>
              </div>
            )}

            {analysis.emoji_usage && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  이모지 사용 패턴
                </p>
                <p className="text-sm">{analysis.emoji_usage}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              {applied ? (
                <Button disabled variant="outline">
                  <CheckCircle className="mr-2 size-4 text-green-600" />
                  프로필에 반영 완료
                </Button>
              ) : (
                <Button onClick={applyToProfile} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      반영 중...
                    </>
                  ) : (
                    "프로필에 반영"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
