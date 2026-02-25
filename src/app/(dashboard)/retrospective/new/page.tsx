import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RetrospectiveForm } from "@/components/retrospective/retrospective-form";

export default async function NewRetrospectivePage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">회고 작성</h1>
        <p className="text-muted-foreground">
          KPT + SSC 프레임워크로 프로젝트 회고를 작성합니다.
        </p>
      </div>
      <RetrospectiveForm
        userId={user.id}
        userName={user.name}
        projects={projects ?? []}
      />
    </div>
  );
}
