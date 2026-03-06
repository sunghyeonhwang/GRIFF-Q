import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import type { Schedule } from "@/types/schedule.types";

export default async function SchedulePage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // 일정 조회 (공개 + 내가 대상인 비공개 + 내가 작성한 일정)
  const { data: schedulesData } = await supabase
    .from("schedules")
    .select("*, creator:users!schedules_created_by_fkey(name)")
    .or(`is_public.eq.true,created_by.eq.${user.id},target_user_id.eq.${user.id}`)
    .order("start_date", { ascending: true });

  const schedules = (schedulesData ?? []) as Schedule[];

  // 사용자 목록
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  const users = (allUsers ?? []).map((u) => ({ id: u.id, name: u.name ?? "" }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="일정"
        description="팀 일정을 캘린더로 관리합니다."
      />
      <ScheduleCalendar schedules={schedules} userId={user.id} users={users} />
    </div>
  );
}
