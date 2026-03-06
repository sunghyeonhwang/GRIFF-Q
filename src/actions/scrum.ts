"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DailyScrum, ScrumItem, ScrumItemPriority, CarryOverItem } from "@/types/scrum.types";

// ── 인증 헬퍼 ──
async function authUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");
  return { supabase, user };
}

// ── 1. getOrCreateTodayScrum ──
export async function getOrCreateTodayScrum(): Promise<{
  scrum: DailyScrum;
  items: ScrumItem[];
}> {
  const { supabase, user } = await authUser();
  const today = new Date().toISOString().split("T")[0];

  let { data: scrum } = await supabase
    .from("daily_scrums")
    .select("*")
    .eq("user_id", user.id)
    .eq("scrum_date", today)
    .single();

  if (!scrum) {
    const { data, error } = await supabase
      .from("daily_scrums")
      .insert({ user_id: user.id, scrum_date: today })
      .select()
      .single();
    if (error) throw new Error("스크럼 생성 실패");
    scrum = data;
  }

  const { data: items } = await supabase
    .from("scrum_items")
    .select("*")
    .eq("scrum_id", scrum.id)
    .order("sort_order", { ascending: true });

  return { scrum, items: items ?? [] };
}

// ── 2. updateScrumStatus ──
export async function updateScrumStatus(
  scrumId: string,
  status: DailyScrum["status"]
) {
  const { supabase } = await authUser();
  const { error } = await supabase
    .from("daily_scrums")
    .update({ status })
    .eq("id", scrumId);
  if (error) throw new Error("상태 업데이트 실패");
  revalidatePath("/scrum");
}

// ── 3. skipScrum ──
export async function skipScrum(scrumId: string, reason: string) {
  const { supabase } = await authUser();
  const { error } = await supabase
    .from("daily_scrums")
    .update({ status: "skipped", skip_reason: reason })
    .eq("id", scrumId);
  if (error) throw new Error("건너뛰기 실패");
  revalidatePath("/scrum");
}

// ── 4. addScrumItem ──
export async function addScrumItem(
  scrumId: string,
  data: {
    title: string;
    is_carried_over?: boolean;
    source_task_id?: string;
    estimated_minutes?: number;
  }
): Promise<ScrumItem> {
  const { supabase } = await authUser();

  const { count } = await supabase
    .from("scrum_items")
    .select("*", { count: "exact", head: true })
    .eq("scrum_id", scrumId);

  const { data: item, error } = await supabase
    .from("scrum_items")
    .insert({
      scrum_id: scrumId,
      title: data.title,
      is_carried_over: data.is_carried_over ?? false,
      source_task_id: data.source_task_id ?? null,
      estimated_minutes: data.estimated_minutes ?? 30,
      sort_order: (count ?? 0),
    })
    .select()
    .single();
  if (error) throw new Error("항목 추가 실패");
  revalidatePath("/scrum");
  return item;
}

// ── 5. updateScrumItem ──
export async function updateScrumItem(
  itemId: string,
  data: Partial<{
    title: string;
    priority: ScrumItemPriority;
    priority_order: number;
    time_block_start: string | null;
    time_block_end: string | null;
    estimated_minutes: number;
    status: ScrumItem["status"];
  }>
) {
  const { supabase } = await authUser();
  const { error } = await supabase
    .from("scrum_items")
    .update(data)
    .eq("id", itemId);
  if (error) throw new Error("항목 수정 실패");
  revalidatePath("/scrum");
}

// ── 6. deleteScrumItem ──
export async function deleteScrumItem(itemId: string) {
  const { supabase } = await authUser();
  const { error } = await supabase
    .from("scrum_items")
    .delete()
    .eq("id", itemId);
  if (error) throw new Error("항목 삭제 실패");
  revalidatePath("/scrum");
}

// ── 7. reorderScrumItems ──
export async function reorderScrumItems(scrumId: string, itemIds: string[]) {
  const { supabase } = await authUser();
  const updates = itemIds.map((id, i) =>
    supabase.from("scrum_items").update({ sort_order: i }).eq("id", id)
  );
  await Promise.all(updates);
  revalidatePath("/scrum");
}

// ── 8. completeScrum ──
export async function completeScrum(scrumId: string) {
  const { supabase, user } = await authUser();

  const { data: items } = await supabase
    .from("scrum_items")
    .select("*")
    .eq("scrum_id", scrumId)
    .order("sort_order");

  if (!items) throw new Error("항목이 없습니다.");

  for (const item of items) {
    if (item.source_task_id) {
      await supabase
        .from("scrum_items")
        .update({ generated_task_id: item.source_task_id })
        .eq("id", item.id);
    } else {
      const { data: task } = await supabase
        .from("tasks")
        .insert({
          title: item.title,
          status: "pending",
          priority: item.priority === "urgent" ? "urgent" :
                    item.priority === "important" ? "high" : "normal",
          assignee_id: user.id,
          due_date: new Date().toISOString().split("T")[0],
          source: "scrum",
          source_id: scrumId,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (task) {
        await supabase
          .from("scrum_items")
          .update({ generated_task_id: task.id })
          .eq("id", item.id);
      }
    }
  }

  await supabase
    .from("daily_scrums")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", scrumId);

  revalidatePath("/scrum");
  revalidatePath("/tasks");
}

// ── 9. getCarryOverItems ──
export async function getCarryOverItems(): Promise<CarryOverItem[]> {
  const { supabase, user } = await authUser();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data: yesterdayScrum } = await supabase
    .from("daily_scrums")
    .select("id, scrum_date")
    .eq("user_id", user.id)
    .eq("scrum_date", yesterday)
    .eq("status", "completed")
    .single();

  if (!yesterdayScrum) return [];

  const { data: items } = await supabase
    .from("scrum_items")
    .select("id, title, source_task_id")
    .eq("scrum_id", yesterdayScrum.id)
    .neq("status", "completed");

  return (items ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    source_task_id: i.source_task_id,
    original_scrum_date: yesterdayScrum.scrum_date,
  }));
}

// ── 10. getScrumHistory ──
export async function getScrumHistory(limit = 30) {
  const { supabase, user } = await authUser();
  const { data } = await supabase
    .from("daily_scrums")
    .select("*, scrum_items(*)")
    .eq("user_id", user.id)
    .order("scrum_date", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ── 11. reviewDay ──
export async function reviewDay(
  scrumId: string,
  completedItemIds: string[],
  notes?: string,
) {
  const { supabase } = await authUser();

  if (completedItemIds.length > 0) {
    await supabase
      .from("scrum_items")
      .update({ status: "completed" })
      .in("id", completedItemIds);
  }

  const { data: allItems } = await supabase
    .from("scrum_items")
    .select("id")
    .eq("scrum_id", scrumId)
    .eq("status", "planned");

  const skippedIds = (allItems ?? [])
    .filter((i) => !completedItemIds.includes(i.id))
    .map((i) => i.id);

  if (skippedIds.length > 0) {
    await supabase
      .from("scrum_items")
      .update({ status: "skipped" })
      .in("id", skippedIds);
  }

  for (const itemId of completedItemIds) {
    const { data: item } = await supabase
      .from("scrum_items")
      .select("generated_task_id")
      .eq("id", itemId)
      .single();

    if (item?.generated_task_id) {
      await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", item.generated_task_id);
    }
  }

  revalidatePath("/scrum");
  revalidatePath("/tasks");
}

// ── 12. saveScrumConversation ──
export async function saveScrumConversation(
  scrumId: string,
  conversation: { role: "user" | "assistant"; content: string; timestamp: string }[]
) {
  const { supabase } = await authUser();
  const { error } = await supabase
    .from("daily_scrums")
    .update({ ai_conversation: conversation })
    .eq("id", scrumId);
  if (error) throw new Error("대화 저장 실패");
}
