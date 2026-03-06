import { requireAuth } from "@/lib/auth";
import { getScrumHistory } from "@/actions/scrum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle, SkipForward, Clock } from "lucide-react";
import Link from "next/link";

export default async function ScrumHistoryPage() {
  await requireAuth();
  const history = await getScrumHistory(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">스크럼 이력</h1>
        <p className="text-muted-foreground">최근 30일간의 데일리 스크럼 기록</p>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            스크럼 기록이 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {history.map((scrum) => {
            const items = scrum.scrum_items ?? [];
            const completedCount = items.filter(
              (i: { status: string }) => i.status === "completed"
            ).length;
            const totalMinutes = items.reduce(
              (sum: number, i: { estimated_minutes: number }) =>
                sum + (i.estimated_minutes ?? 0),
              0
            );

            return (
              <Link key={scrum.id} href={`/scrum/history/${scrum.scrum_date}`}>
                <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{scrum.scrum_date}</p>
                          <p className="text-xs text-muted-foreground">
                            {items.length}건 계획
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {scrum.status === "completed" && (
                          <>
                            <Badge variant="default" className="text-xs gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {completedCount}/{items.length}
                            </Badge>
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(totalMinutes / 60)}h
                            </Badge>
                          </>
                        )}
                        {scrum.status === "skipped" && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <SkipForward className="h-3 w-3" />
                            건너뜀
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
