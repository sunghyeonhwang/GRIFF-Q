import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Project, ProjectMember, ProjectMilestone } from "@/types/project.types";
import type { Task, TaskDependency } from "@/types/task.types";

// Graceful fallback: API 키 없으면 null
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export const geminiChat = genAI
  ? genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    })
  : null;

export const geminiReport = genAI
  ? genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
    })
  : null;

// ── Rate Limit (in-memory, 프로덕션에서는 Redis로 교체) ──

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const minuteLimits = new Map<string, RateLimitEntry>();
const dailyLimits = new Map<string, RateLimitEntry>();

const MINUTE_LIMIT = 10;
const DAILY_LIMIT = 100;

export function checkRateLimit(userId: string, projectId: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const minuteKey = `${userId}:${projectId}:min`;
  const dailyKey = `${projectId}:day`;

  // 분당 제한
  const minuteEntry = minuteLimits.get(minuteKey);
  if (minuteEntry && now < minuteEntry.resetAt) {
    if (minuteEntry.count >= MINUTE_LIMIT) {
      return { allowed: false, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요. (분당 10회 제한)" };
    }
    minuteEntry.count++;
  } else {
    minuteLimits.set(minuteKey, { count: 1, resetAt: now + 60_000 });
  }

  // 일일 제한
  const dailyEntry = dailyLimits.get(dailyKey);
  if (dailyEntry && now < dailyEntry.resetAt) {
    if (dailyEntry.count >= DAILY_LIMIT) {
      return { allowed: false, message: "일일 사용 한도에 도달했습니다. (프로젝트당 일 100회 제한)" };
    }
    dailyEntry.count++;
  } else {
    dailyLimits.set(dailyKey, { count: 1, resetAt: now + 86_400_000 });
  }

  return { allowed: true };
}

// ── 프로젝트 컨텍스트 빌드 ──

const PROJECT_ROLE_LABELS: Record<string, string> = {
  pm: "PM",
  planner: "기획자",
  designer: "디자이너",
  developer: "개발자",
  video: "영상",
  operations: "운영",
  allrounder: "올라운더",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  in_progress: "진행중",
  review: "리뷰",
  completed: "완료",
  issue: "이슈",
};

const TASK_PRIORITY_LABELS: Record<string, string> = {
  urgent: "긴급",
  high: "높음",
  normal: "보통",
  low: "낮음",
};

export function buildProjectContext(data: {
  project: Project;
  members: ProjectMember[];
  milestones: ProjectMilestone[];
  tasks: Task[];
  dependencies: TaskDependency[];
}): string {
  const { project, members, milestones, tasks, dependencies } = data;
  const lines: string[] = [];

  // 프로젝트 기본 정보
  lines.push("## 프로젝트 정보");
  lines.push(`- 이름: ${project.name}`);
  lines.push(`- 상태: ${project.status}`);
  lines.push(`- 유형: ${project.project_type}`);
  lines.push(`- 우선순위: ${project.priority}/5`);
  lines.push(`- 진행률: ${project.progress}%`);
  if (project.description) lines.push(`- 설명: ${project.description}`);
  if (project.start_date) lines.push(`- 시작일: ${project.start_date}`);
  if (project.end_date) lines.push(`- 마감일: ${project.end_date}`);

  // 멤버 R&R
  if (members.length > 0) {
    lines.push("");
    lines.push("## 팀 구성");
    for (const m of members) {
      const roleName = PROJECT_ROLE_LABELS[m.role] || m.role;
      const name = m.user?.name || "미지정";
      lines.push(`- ${roleName}: ${name}${m.is_backup ? " (백업)" : ""}`);
    }
  }

  // 마일스톤
  if (milestones.length > 0) {
    lines.push("");
    lines.push("## 마일스톤");
    for (const ms of milestones) {
      const status = ms.status === "completed" ? "[완료]" : "[진행중]";
      const due = ms.due_date ? ` (마감: ${ms.due_date})` : "";
      lines.push(`- ${status} ${ms.title}${due}`);
    }
  }

  // Task 목록
  if (tasks.length > 0) {
    lines.push("");
    lines.push("## Task 목록");

    // 상태별 통계
    const statusCounts: Record<string, number> = {};
    for (const t of tasks) {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    }
    const statsStr = Object.entries(statusCounts)
      .map(([s, c]) => `${TASK_STATUS_LABELS[s] || s}: ${c}건`)
      .join(", ");
    lines.push(`- 전체 ${tasks.length}건 (${statsStr})`);

    // 지연된 Task
    const today = new Date().toISOString().split("T")[0];
    const delayed = tasks.filter(
      (t) => t.due_date && t.due_date < today && t.status !== "completed"
    );
    if (delayed.length > 0) {
      lines.push(`- 지연된 Task: ${delayed.length}건`);
      for (const t of delayed) {
        lines.push(`  - "${t.title}" (마감: ${t.due_date}, 상태: ${TASK_STATUS_LABELS[t.status]})`);
      }
    }

    lines.push("");
    for (const t of tasks) {
      const priority = TASK_PRIORITY_LABELS[t.priority] || t.priority;
      const status = TASK_STATUS_LABELS[t.status] || t.status;
      const assignee = t.assignee?.name || "미배정";
      const due = t.due_date ? `, 마감: ${t.due_date}` : "";
      lines.push(`- [${status}] "${t.title}" (우선순위: ${priority}, 담당: ${assignee}${due})`);
    }
  }

  // 의존성 관계
  if (dependencies.length > 0) {
    lines.push("");
    lines.push("## 의존성 관계");
    const taskMap = new Map(tasks.map((t) => [t.id, t.title]));
    for (const dep of dependencies) {
      const fromName = taskMap.get(dep.depends_on_id) || dep.depends_on_id;
      const toName = taskMap.get(dep.task_id) || dep.task_id;
      lines.push(`- "${fromName}" -> "${toName}" (${dep.dependency_type})`);
    }
  }

  return lines.join("\n");
}
