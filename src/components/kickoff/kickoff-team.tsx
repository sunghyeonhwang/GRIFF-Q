"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import type { ProjectKickoff, KickoffAcknowledgment } from "@/lib/kickoff-constants";
import { useState } from "react";

interface KickoffTeamProps {
  kickoff: ProjectKickoff;
  users: { id: string; name: string }[];
  acknowledgments: KickoffAcknowledgment[];
  currentUserId: string;
  isPM: boolean;
  onAcknowledge: () => Promise<void>;
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-amber-500",
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function KickoffTeam({
  kickoff,
  users,
  acknowledgments,
  currentUserId,
  isPM,
  onAcknowledge,
}: KickoffTeamProps) {
  const [loading, setLoading] = useState(false);

  const ackMap = new Map(acknowledgments.map((a) => [a.user_id, a]));
  const currentUserAcked = ackMap.has(currentUserId);
  const isInProgress = kickoff.status === "in_progress";

  async function handleAcknowledge() {
    setLoading(true);
    try {
      await onAcknowledge();
    } catch {
      toast.error("숙지 확인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>팀 구성</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {users.map((user, idx) => {
            const ack = ackMap.get(user.id);
            const isCreator = user.id === kickoff.created_by;

            return (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${getAvatarColor(idx)}`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.name}
                    {isCreator && (
                      <span className="ml-1.5 text-xs text-muted-foreground">PM</span>
                    )}
                  </p>
                </div>
                {ack ? (
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <CheckCircle2 className="size-3" />
                    숙지 완료
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 shrink-0">
                    <Clock className="size-3" />
                    미숙지
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {isInProgress && !currentUserAcked && (
          <div className="sticky bottom-0 pt-3 border-t">
            <Button
              className="w-full"
              onClick={handleAcknowledge}
              disabled={loading}
            >
              {loading ? "처리 중..." : "숙지 확인"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
