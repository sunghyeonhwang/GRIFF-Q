import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AvatarForm } from "@/components/predict/avatar-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function AvatarSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("manager");
  const { id } = await params;
  const supabase = await createClient();

  const { data: avatar } = await supabase
    .from("avatars")
    .select("*")
    .eq("id", id)
    .single();

  if (!avatar) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/predict/avatars">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">아바타 설정</h1>
          <p className="text-muted-foreground">
            {avatar.name}의 프로필을 수정합니다.
          </p>
        </div>
      </div>
      <AvatarForm userId={user.id} initialData={avatar} />
    </div>
  );
}
