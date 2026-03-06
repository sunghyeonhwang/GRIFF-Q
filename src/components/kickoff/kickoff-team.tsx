import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { ProjectMember, ProjectRole } from "@/types/project.types";

interface KickoffTeamProps {
  members: ProjectMember[];
  projectId: string;
}

const ROLE_LABELS: Record<ProjectRole, string> = {
  pm: "PM",
  planner: "기획자",
  designer: "디자이너",
  developer: "개발자",
  video: "영상 담당",
  operations: "운영 담당",
  allrounder: "올라운더",
};

export function KickoffTeam({ members, projectId }: KickoffTeamProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">팀 구성 ({members.length})</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/projects/${projectId}/settings`}>
            멤버 관리 <ExternalLink className="size-3 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {members.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg border"
              >
                <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {(member.user?.name ?? "?").charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {member.user?.name ?? "미배정"}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            팀원이 배정되지 않았습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
