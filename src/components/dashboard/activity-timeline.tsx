import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  CreditCard,
  MessageSquareText,
  Calculator,
  Settings,
  type LucideIcon,
} from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  table_name: string;
  changed_by_name: string;
  created_at: string;
}

const TABLE_ICONS: Record<string, LucideIcon> = {
  meetings: FileText,
  payments: CreditCard,
  retrospectives: MessageSquareText,
  estimates: Calculator,
};

const TABLE_LABELS: Record<string, string> = {
  meetings: "회의록",
  payments: "결제",
  retrospectives: "회고",
  estimates: "견적서",
  estimate_items: "견적 항목",
  postmortems: "포스트모템",
  projects: "프로젝트",
  users: "사용자",
  action_items: "액션아이템",
  notifications: "알림",
};

const ACTION_LABELS: Record<string, string> = {
  INSERT: "생성",
  UPDATE: "수정",
  DELETE: "삭제",
  insert: "생성",
  update: "수정",
  delete: "삭제",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">최근 활동</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <ScrollArea className="h-[280px]">
            <div className="space-y-3">
              {activities.map((activity) => {
                const Icon = TABLE_ICONS[activity.table_name] ?? Settings;
                const tableName = TABLE_LABELS[activity.table_name] ?? activity.table_name;
                const actionName = ACTION_LABELS[activity.action] ?? activity.action;

                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.changed_by_name}</span>
                        {" "}
                        <span className="text-muted-foreground">
                          {tableName} {actionName}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(activity.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            최근 활동 없음
          </p>
        )}
      </CardContent>
    </Card>
  );
}
