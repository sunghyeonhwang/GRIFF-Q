"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, ArrowLeft } from "lucide-react";
import { RealtimeEstimateEditor } from "./realtime-estimate-editor";
import {
  ESTIMATE_STATUS_LABELS,
  ESTIMATE_STATUS_VARIANTS,
} from "@/lib/estimate-constants";
import { createClient } from "@/lib/supabase/client";

interface Estimate {
  id: string;
  project_name: string;
  client_name: string;
  estimate_date: string | null;
  status: string;
  created_at: string;
  users?: { name: string } | { name: string }[] | null;
}

interface EstimateItem {
  id: string;
  estimate_id: string;
  item_name: string;
  specification: string;
  quantity: number;
  unit_price: number;
  unit: string;
  highlight: string;
  note: string;
  sort_order: number;
}

interface CollabEstimateViewProps {
  estimates: Estimate[];
  userId: string;
  userName: string;
}

export function CollabEstimateView({
  estimates,
  userId,
  userName,
}: CollabEstimateViewProps) {
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(
    null
  );
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function selectEstimate(estimate: Estimate) {
    setLoading(true);
    const supabase = createClient();

    const { data } = await supabase
      .from("estimate_items")
      .select("*")
      .eq("estimate_id", estimate.id)
      .order("sort_order");

    setItems(data ?? []);
    setSelectedEstimate(estimate);
    setLoading(false);
  }

  function goBack() {
    setSelectedEstimate(null);
    setItems([]);
  }

  // 에디터 모드
  if (selectedEstimate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {selectedEstimate.project_name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedEstimate.client_name} ·{" "}
              {selectedEstimate.estimate_date
                ? new Date(
                    selectedEstimate.estimate_date
                  ).toLocaleDateString("ko-KR")
                : "-"}
            </p>
          </div>
          <Badge
            variant={
              ESTIMATE_STATUS_VARIANTS[selectedEstimate.status] ?? "outline"
            }
            className="ml-auto"
          >
            {ESTIMATE_STATUS_LABELS[selectedEstimate.status] ??
              selectedEstimate.status}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-5" />
              실시간 동시 편집
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealtimeEstimateEditor
              estimateId={selectedEstimate.id}
              initialItems={items}
              userId={userId}
              userName={userName}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 목록 모드
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">동시견적 확인</h1>
        <p className="text-muted-foreground">
          견적서를 선택하면 실시간 동시 편집 모드로 진입합니다.
        </p>
      </div>

      {estimates.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>프로젝트명</TableHead>
                    <TableHead>클라이언트</TableHead>
                    <TableHead>견적일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimates.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        {e.project_name}
                      </TableCell>
                      <TableCell>{e.client_name}</TableCell>
                      <TableCell className="text-sm">
                        {e.estimate_date
                          ? new Date(e.estimate_date).toLocaleDateString(
                              "ko-KR"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ESTIMATE_STATUS_VARIANTS[e.status] ?? "outline"
                          }
                        >
                          {ESTIMATE_STATUS_LABELS[e.status] ?? e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {Array.isArray(e.users)
                          ? e.users[0]?.name ?? "-"
                          : e.users?.name ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => selectEstimate(e)}
                          disabled={loading}
                        >
                          <Users className="mr-2 size-4" />
                          편집
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            등록된 견적서가 없습니다. 심플 견적에서 먼저 견적서를 생성해주세요.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
