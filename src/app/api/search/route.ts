import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({
      estimates: [],
      meetings: [],
      payments: [],
      retrospectives: [],
    });
  }

  const pattern = `%${q}%`;

  // Search estimates
  const { data: estimates } = await supabase
    .from("estimates")
    .select("id, project_name, client_name")
    .or(`project_name.ilike.${pattern},client_name.ilike.${pattern}`)
    .limit(5);

  // Search meetings
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, meeting_date")
    .or(`title.ilike.${pattern},content.ilike.${pattern}`)
    .limit(5);

  // Search payments
  const { data: payments } = await supabase
    .from("payments")
    .select("id, name, amount, bank")
    .or(`name.ilike.${pattern},note.ilike.${pattern}`)
    .limit(5);

  // Search retrospectives (cast jsonb arrays to text for ILIKE)
  const { data: retrospectives } = await supabase
    .from("retrospectives")
    .select("id, project_id, projects(name)")
    .or(
      `keeps::text.ilike.${pattern},problems::text.ilike.${pattern},tries::text.ilike.${pattern}`
    )
    .limit(5);

  return NextResponse.json({
    estimates: (estimates ?? []).map((e) => ({
      id: e.id,
      title: e.project_name,
      subtitle: e.client_name,
      type: "견적서",
      link: `/estimates/${e.id}`,
    })),
    meetings: (meetings ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      subtitle: m.meeting_date,
      type: "회의록",
      link: `/meetings/${m.id}`,
    })),
    payments: (payments ?? []).map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: `${Number(p.amount).toLocaleString()}원 · ${p.bank}`,
      type: "입금/결제",
      link: `/payments/${p.id}`,
    })),
    retrospectives: (retrospectives ?? []).map((r) => ({
      id: r.id,
      title: (r as Record<string, unknown>).projects
        ? ((r as Record<string, unknown>).projects as { name: string }).name
        : "회고",
      subtitle: "",
      type: "회고",
      link: `/retrospective/${r.id}`,
    })),
  });
}
