import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayScrum, getCarryOverItems } from "@/actions/scrum";
import { ScrumSession } from "@/components/scrum/scrum-session";

export default async function ScrumPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [scrumData, carryOverItems, schedulesRes, dueSoonRes, userRes] =
    await Promise.all([
      getOrCreateTodayScrum(),
      getCarryOverItems(),
      supabase
        .from("schedules")
        .select("title, start_date, start_time, end_time, is_all_day")
        .eq("start_date", new Date().toISOString().split("T")[0])
        .or(`is_public.eq.true,created_by.eq.${user.id},target_user_id.eq.${user.id}`),
      supabase
        .from("tasks")
        .select("id, title, due_date")
        .eq("assignee_id", user.id)
        .neq("status", "completed")
        .lte("due_date", new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0])
        .gte("due_date", new Date().toISOString().split("T")[0]),
      supabase.from("users").select("id, name").eq("id", user.id).single(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">데일리 스크럼</h1>
        <p className="text-muted-foreground">오늘 하루를 설계하세요</p>
      </div>
      <ScrumSession
        scrum={scrumData.scrum}
        items={scrumData.items}
        carryOverItems={carryOverItems}
        todaySchedules={(schedulesRes.data ?? []).filter((s) => !s.is_all_day)}
        dueSoonTasks={dueSoonRes.data ?? []}
        userName={userRes.data?.name ?? ""}
        userId={user.id}
      />
    </div>
  );
}
