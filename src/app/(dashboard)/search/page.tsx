import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  link: string;
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  await requireAuth();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let results: {
    estimates: SearchResult[];
    meetings: SearchResult[];
    payments: SearchResult[];
    retrospectives: SearchResult[];
  } = { estimates: [], meetings: [], payments: [], retrospectives: [] };

  if (query.length >= 2) {
    const supabase = await createClient();
    const pattern = `%${query}%`;

    const [estimatesRes, meetingsRes, paymentsRes, retrospectivesRes] =
      await Promise.all([
        supabase
          .from("estimates")
          .select("id, project_name, client_name")
          .or(
            `project_name.ilike.${pattern},client_name.ilike.${pattern}`
          )
          .limit(10),
        supabase
          .from("meetings")
          .select("id, title, meeting_date")
          .or(`title.ilike.${pattern},content.ilike.${pattern}`)
          .limit(10),
        supabase
          .from("payments")
          .select("id, name, amount, bank")
          .or(`name.ilike.${pattern},note.ilike.${pattern}`)
          .limit(10),
        supabase
          .from("retrospectives")
          .select("id, project_id, projects(name)")
          .or(
            `keeps::text.ilike.${pattern},problems::text.ilike.${pattern},tries::text.ilike.${pattern}`
          )
          .limit(10),
      ]);

    results = {
      estimates: (estimatesRes.data ?? []).map((e) => ({
        id: e.id,
        title: e.project_name,
        subtitle: e.client_name,
        type: "견적서",
        link: `/estimates/${e.id}`,
      })),
      meetings: (meetingsRes.data ?? []).map((m) => ({
        id: m.id,
        title: m.title,
        subtitle: m.meeting_date,
        type: "회의록",
        link: `/meetings/${m.id}`,
      })),
      payments: (paymentsRes.data ?? []).map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: `${Number(p.amount).toLocaleString()}원 · ${p.bank}`,
        type: "입금/결제",
        link: `/payments/${p.id}`,
      })),
      retrospectives: (retrospectivesRes.data ?? []).map((r) => ({
        id: r.id,
        title: (r as Record<string, unknown>).projects
          ? (
              (r as Record<string, unknown>).projects as { name: string }
            ).name
          : "회고",
        subtitle: "",
        type: "회고",
        link: `/retrospective/${r.id}`,
      })),
    };
  }

  const totalCount =
    results.estimates.length +
    results.meetings.length +
    results.payments.length +
    results.retrospectives.length;

  const sections = [
    { key: "estimates", label: "견적서", items: results.estimates },
    { key: "meetings", label: "회의록", items: results.meetings },
    { key: "payments", label: "입금/결제", items: results.payments },
    { key: "retrospectives", label: "회고", items: results.retrospectives },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">검색 결과</h1>
        {query ? (
          <p className="text-muted-foreground">
            &quot;{query}&quot;에 대한 검색 결과 {totalCount}건
          </p>
        ) : (
          <p className="text-muted-foreground">검색어를 입력하세요</p>
        )}
      </div>

      {query.length >= 2 && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="mb-4 size-12 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">
            검색 결과 없음
          </p>
          <p className="text-sm text-muted-foreground/70">
            다른 키워드로 검색해 보세요
          </p>
        </div>
      )}

      {sections.map(
        ({ key, label, items }) =>
          items.length > 0 && (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-lg">{label}</CardTitle>
                <CardDescription>{items.length}건</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.link}
                      className="flex items-center justify-between py-3 transition-colors hover:bg-accent/50 -mx-2 px-2 rounded-sm"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-sm text-muted-foreground">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">{item.type}</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
      )}
    </div>
  );
}
