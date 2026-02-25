import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MeetingForm } from "@/components/meetings/meeting-form";

export default async function EditMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", id)
    .single();

  if (!meeting) notFound();

  const { data: actionItems } = await supabase
    .from("action_items")
    .select("*")
    .eq("meeting_id", id)
    .order("created_at");

  const { data: users } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">회의록 수정</h1>
      </div>
      <MeetingForm
        userId={user.id}
        users={users ?? []}
        initialData={meeting}
        initialActionItems={actionItems ?? []}
      />
    </div>
  );
}
