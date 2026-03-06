import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectProgressBar } from "@/components/projects/project-progress-bar";

interface ProjectBoardItem {
  id: string;
  name: string;
  status: string;
  project_type?: string | null;
  priority?: number | null;
  progress?: number | null;
  start_date: string | null;
  end_date: string | null;
  users?: { name: string } | null;
  [key: string]: unknown;
}

const STATUS_COLUMNS: { key: string; label: string; color: string }[] = [
  { key: "active", label: "진행 중", color: "border-t-blue-500" },
  { key: "completed", label: "완료", color: "border-t-green-500" },
  { key: "on_hold", label: "보류", color: "border-t-gray-400" },
];

const TYPE_LABELS: Record<string, string> = {
  general: "일반",
  event: "행사",
  content: "콘텐츠",
  maintenance: "유지보수",
};

interface ProjectBoardViewProps {
  items: ProjectBoardItem[];
}

export function ProjectBoardView({ items }: ProjectBoardViewProps) {
  const grouped = STATUS_COLUMNS.map((col) => ({
    ...col,
    projects: items.filter((p) => p.status === col.key),
  }));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {grouped.map((column) => (
        <div key={column.key} className="space-y-3">
          {/* Column header */}
          <div className="flex items-center gap-2 px-1">
            <h3 className="font-medium text-sm">{column.label}</h3>
            <Badge variant="outline" className="text-xs">
              {column.projects.length}
            </Badge>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            {column.projects.length > 0 ? (
              column.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block group"
                >
                  <Card
                    className={`border-t-2 ${column.color} transition-all hover:shadow-md hover:scale-[1.01]`}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Title */}
                      <h4 className="font-medium text-sm truncate group-hover:text-brand transition-colors">
                        {project.name}
                      </h4>

                      {/* Type badge */}
                      {project.project_type && (
                        <Badge variant="outline" className="text-xs">
                          {TYPE_LABELS[project.project_type] ??
                            project.project_type}
                        </Badge>
                      )}

                      {/* Progress bar */}
                      <ProjectProgressBar
                        progress={project.progress ?? 0}
                      />

                      {/* Footer: lead + dates */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {project.users?.name ?? "미배정"}
                        </span>
                        <span>
                          {project.end_date
                            ? new Date(
                                project.end_date,
                              ).toLocaleDateString("ko-KR")
                            : "-"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                프로젝트 없음
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
