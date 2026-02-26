import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  User,
  UserRound,
  Briefcase,
  Building,
  Crown,
  Shield,
  Star,
  Heart,
  Settings,
  MessageSquare,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  "user-round": UserRound,
  briefcase: Briefcase,
  building: Building,
  crown: Crown,
  shield: Shield,
  star: Star,
  heart: Heart,
};

export default async function AvatarsPage() {
  await requireRole("manager");
  const supabase = await createClient();

  const { data: avatars } = await supabase
    .from("avatars")
    .select("*, users!avatars_created_by_fkey(name)")
    .order("created_at", { ascending: false });

  const items = avatars ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">아바타 목록</h1>
          <p className="text-muted-foreground">
            클라이언트 아바타를 생성하고 관리합니다.
          </p>
        </div>
        <Link href="/predict/avatars/new">
          <Button>
            <Plus className="mr-2 size-4" />
            아바타 생성
          </Button>
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((avatar) => {
            const IconComponent = ICON_MAP[avatar.icon] ?? User;
            return (
              <Card key={avatar.id}>
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <IconComponent className="size-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-base">{avatar.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {[avatar.company, avatar.position]
                        .filter(Boolean)
                        .join(" / ") || "정보 없음"}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  {avatar.personality_tags && avatar.personality_tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {avatar.personality_tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      성격 태그 없음
                    </p>
                  )}
                </CardContent>
                <CardFooter className="gap-2">
                  <Link href={`/predict/avatars/${avatar.id}/settings`}>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-1 size-3" />
                      설정
                    </Button>
                  </Link>
                  <Link href={`/predict/chat/${avatar.id}`}>
                    <Button size="sm">
                      <MessageSquare className="mr-1 size-3" />
                      채팅
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            아직 생성된 아바타가 없습니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
