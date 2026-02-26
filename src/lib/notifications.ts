import { SupabaseClient } from "@supabase/supabase-js";

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(
  supabase: SupabaseClient,
  params: CreateNotificationParams
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link ?? null,
  });
  return { error };
}

export async function createNotificationForAllUsers(
  supabase: SupabaseClient,
  params: Omit<CreateNotificationParams, "userId">
) {
  const { data: users } = await supabase
    .from("users")
    .select("id")
    .eq("is_active", true);

  if (!users?.length) return;

  const rows = users.map((u) => ({
    user_id: u.id,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link ?? null,
  }));

  await supabase.from("notifications").insert(rows);
}

/**
 * Check for approaching deadlines and create notifications.
 * Call this on dashboard load. Uses a dedup key to avoid duplicates.
 */
export async function checkDeadlineNotifications(
  supabase: SupabaseClient,
  userId: string
) {
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const today = new Date().toISOString().split("T")[0];
  const cutoff = threeDaysLater.toISOString().split("T")[0];

  // Check action items with approaching deadlines
  const { data: actionItems } = await supabase
    .from("action_items")
    .select("id, title, due_date, meetings(title)")
    .in("status", ["pending", "in_progress"])
    .gte("due_date", today)
    .lte("due_date", cutoff);

  for (const ai of actionItems ?? []) {
    const dedupType = `deadline_action_${ai.id}_${ai.due_date}`;

    // Check if notification already exists
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", dedupType);

    if ((count ?? 0) > 0) continue;

    const meetingTitle = (ai as any).meetings?.title ?? "회의";
    const dueDate = new Date(ai.due_date).toLocaleDateString("ko-KR");

    await createNotification(supabase, {
      userId,
      type: dedupType,
      title: "마감 임박 액션아이템",
      message: `"${ai.title}" (${meetingTitle}) 마감일: ${dueDate}`,
      link: "/dashboard",
    });
  }

  // Check payments with approaching deadlines
  const { data: payments } = await supabase
    .from("payments")
    .select("id, name, due_date, amount")
    .eq("status", "pending")
    .gte("due_date", today)
    .lte("due_date", cutoff);

  for (const p of payments ?? []) {
    const dedupType = `deadline_payment_${p.id}_${p.due_date}`;

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", dedupType);

    if ((count ?? 0) > 0) continue;

    const dueDate = new Date(p.due_date).toLocaleDateString("ko-KR");
    const amount = Number(p.amount).toLocaleString();

    await createNotification(supabase, {
      userId,
      type: dedupType,
      title: "결제 마감 임박",
      message: `"${p.name}" ${amount}원 — 마감일: ${dueDate}`,
      link: `/payments/${p.id}`,
    });
  }
}
