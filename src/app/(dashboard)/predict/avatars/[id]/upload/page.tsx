import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UploadTrainingData } from "@/components/predict/upload-training-data";
import { TrainingDataList } from "@/components/predict/training-data-list";

export default async function AvatarUploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: avatar } = await supabase
    .from("avatars")
    .select("*")
    .eq("id", id)
    .single();

  if (!avatar) notFound();

  const { data: trainingData } = await supabase
    .from("avatar_training_data")
    .select("*")
    .eq("avatar_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/predict/avatars/${id}/settings`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">학습 데이터 업로드</h1>
          <p className="text-muted-foreground">
            {avatar.name}의 대화 데이터를 분석하여 프로필을 강화합니다.
          </p>
        </div>
      </div>
      <UploadTrainingData avatar={avatar} />
      <TrainingDataList avatarId={id} initialData={trainingData ?? []} />
    </div>
  );
}
