"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Schedule, ScheduleCategory } from "@/types/schedule.types";
import { SCHEDULE_CATEGORY_CONFIG } from "@/types/schedule.types";

export async function createSchedule(data: {
  title: string;
  description?: string;
  category?: ScheduleCategory;
  start_date: string;
  end_date?: string;
  is_all_day?: boolean;
  start_time?: string;
  end_time?: string;
  color?: string;
  is_public?: boolean;
  target_user_id?: string;
}): Promise<Schedule> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  const category = data.category || "other";
  const color = data.color || SCHEDULE_CATEGORY_CONFIG[category].color;

  const { data: schedule, error } = await supabase
    .from("schedules")
    .insert({
      title: data.title,
      description: data.description || null,
      category,
      start_date: data.start_date,
      end_date: data.end_date || null,
      is_all_day: data.is_all_day ?? true,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      color,
      created_by: user.id,
      is_public: data.is_public ?? true,
      target_user_id: data.target_user_id || null,
    })
    .select("*, creator:users!schedules_created_by_fkey(name)")
    .single();

  if (error) throw new Error(`일정 생성 실패: ${error.message}`);

  revalidatePath("/schedule");
  return schedule as Schedule;
}

export async function updateSchedule(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    category: ScheduleCategory;
    start_date: string;
    end_date: string;
    is_all_day: boolean;
    start_time: string;
    end_time: string;
    color: string;
    is_public: boolean;
    target_user_id: string;
  }>
): Promise<Schedule> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 권한 검증: 작성자 또는 관리자
  const { data: existing } = await supabase
    .from("schedules")
    .select("created_by")
    .eq("id", id)
    .single();

  if (!existing) throw new Error("일정을 찾을 수 없습니다.");

  if (existing.created_by !== user.id) {
    const { data: userInfo } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userInfo || !["super", "boss", "manager"].includes(userInfo.role)) {
      throw new Error("수정 권한이 없습니다.");
    }
  }

  const { data: schedule, error } = await supabase
    .from("schedules")
    .update(data)
    .eq("id", id)
    .select("*, creator:users!schedules_created_by_fkey(name)")
    .single();

  if (error) throw new Error(`일정 수정 실패: ${error.message}`);

  revalidatePath("/schedule");
  return schedule as Schedule;
}

export async function deleteSchedule(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 권한 검증
  const { data: existing } = await supabase
    .from("schedules")
    .select("created_by")
    .eq("id", id)
    .single();

  if (!existing) throw new Error("일정을 찾을 수 없습니다.");

  if (existing.created_by !== user.id) {
    const { data: userInfo } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userInfo || !["super", "boss", "manager"].includes(userInfo.role)) {
      throw new Error("삭제 권한이 없습니다.");
    }
  }

  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`일정 삭제 실패: ${error.message}`);

  revalidatePath("/schedule");
}
