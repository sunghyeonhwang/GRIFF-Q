"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban } from "lucide-react";
import Link from "next/link";

interface ProjectItem {
  id: string;
  name: string;
  progress: number;
  status: string;
}

interface DashboardProjectsWidgetProps {
  projects: ProjectItem[];
}

const STATUS_LABEL: Record<string, string> = {
  planning: "계획",
  in_progress: "진행중",
  on_hold: "보류",
  completed: "완료",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  planning: "secondary",
  in_progress: "default",
  on_hold: "outline",
  completed: "outline",
};

export function DashboardProjectsWidget({ projects }: DashboardProjectsWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-card-title">활성 프로젝트</CardTitle>
        <FolderKanban className="size-4 text-brand" />
      </CardHeader>
      <CardContent className="space-y-2">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2 text-center">
            활성 프로젝트 없음
          </p>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 4).map((project) => {
              const pct = Math.min(100, Math.max(0, project.progress ?? 0));
              return (
                <Link key={project.id} href={`/projects/${project.id}`} className="block group">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium truncate group-hover:underline">
                      {project.name}
                    </span>
                    <Badge
                      variant={STATUS_VARIANT[project.status] ?? "outline"}
                      className="text-xs shrink-0"
                    >
                      {STATUS_LABEL[project.status] ?? project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-brand transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <div className="pt-1">
          <Link href="/projects" className="text-xs text-brand hover:underline">
            전체 보기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
