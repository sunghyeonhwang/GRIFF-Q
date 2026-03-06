import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { ProjectMilestoneTimeline } from "@/components/projects/project-milestone-timeline";
import type { ProjectMilestone } from "@/types/project.types";

interface KickoffMilestonesProps {
  milestones: ProjectMilestone[];
  projectId: string;
}

export function KickoffMilestones({ milestones, projectId }: KickoffMilestonesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">마일스톤</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/projects/${projectId}/settings`}>
            마일스톤 관리 <ExternalLink className="size-3 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {milestones.length > 0 ? (
          <ProjectMilestoneTimeline projectId={projectId} milestones={milestones} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            마일스톤이 설정되지 않았습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
