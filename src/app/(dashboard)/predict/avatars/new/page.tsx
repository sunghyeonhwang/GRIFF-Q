import { requireRole } from "@/lib/auth";
import { AvatarForm } from "@/components/predict/avatar-form";

export default async function NewAvatarPage() {
  const user = await requireRole("manager");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">아바타 생성</h1>
        <p className="text-muted-foreground">
          클라이언트 아바타의 프로필 정보를 입력합니다.
        </p>
      </div>
      <AvatarForm userId={user.id} />
    </div>
  );
}
