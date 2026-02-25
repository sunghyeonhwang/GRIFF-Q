import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MeetingForm } from "@/components/meetings/meeting-form";

export default async function NewMeetingPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">회의록 작성</h1>
        <p className="text-muted-foreground">
          회의 내용과 액션아이템을 기록합니다.
        </p>
      </div>
      <MeetingForm userId={user.id} users={users ?? []} />
    </div>
  );
}
