import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RetrospectiveForm } from "@/components/retrospective/retrospective-form";

export default async function EditRetrospectivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: retro } = await supabase
    .from("retrospectives")
    .select("*")
    .eq("id", id)
    .single();

  if (!retro) notFound();

  const canEdit =
    retro.status === "draft" ||
    user.role === "super" ||
    user.role === "boss";

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {canEdit ? "회고 수정" : "회고 상세"}
        </h1>
      </div>
      <RetrospectiveForm
        userId={user.id}
        userName={user.name}
        projects={projects ?? []}
        initialData={retro}
        readOnly={!canEdit}
      />
    </div>
  );
}
