import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TemplateManager } from "@/components/estimates/template-manager";

export default async function EstimateTemplatesPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("estimate_templates")
    .select("*")
    .order("created_at", { ascending: false });

  // Get item counts per template
  const templateIds = (templates ?? []).map((t) => t.id);
  const { data: items } = templateIds.length
    ? await supabase
        .from("estimate_template_items")
        .select("template_id")
        .in("template_id", templateIds)
    : { data: [] };

  const countMap = new Map<string, number>();
  for (const item of items ?? []) {
    countMap.set(item.template_id, (countMap.get(item.template_id) ?? 0) + 1);
  }

  const templatesWithCount = (templates ?? []).map((t) => ({
    ...t,
    item_count: countMap.get(t.id) ?? 0,
  }));

  return (
    <TemplateManager templates={templatesWithCount} userId={user.id} />
  );
}
