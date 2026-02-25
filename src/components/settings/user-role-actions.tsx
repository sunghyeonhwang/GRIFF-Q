"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UserRoleActionsProps {
  userId: string;
  currentRole: string;
  currentUserRole: string;
}

const ROLE_OPTIONS = [
  { value: "super", label: "슈퍼관리자" },
  { value: "boss", label: "대표" },
  { value: "manager", label: "매니저" },
  { value: "normal", label: "일반" },
];

export function UserRoleActions({
  userId,
  currentRole,
  currentUserRole,
}: UserRoleActionsProps) {
  const router = useRouter();
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (currentUserRole !== "super") {
    return null;
  }

  function handleRoleSelect(value: string) {
    if (value !== currentRole) {
      setPendingRole(value);
    }
  }

  async function confirmRoleChange() {
    if (!pendingRole) return;
    setIsUpdating(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ role: pendingRole })
      .eq("id", userId);

    setIsUpdating(false);

    if (error) {
      alert("역할 변경 실패: " + error.message);
      setPendingRole(null);
      return;
    }

    setPendingRole(null);
    router.refresh();
  }

  const pendingLabel = ROLE_OPTIONS.find((r) => r.value === pendingRole)?.label;
  const currentLabel = ROLE_OPTIONS.find((r) => r.value === currentRole)?.label;

  return (
    <>
      <Select value={currentRole} onValueChange={handleRoleSelect}>
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog
        open={pendingRole !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRole(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>역할 변경 확인</DialogTitle>
            <DialogDescription>
              이 사용자의 역할을 <strong>{currentLabel}</strong>에서{" "}
              <strong>{pendingLabel}</strong>(으)로 변경하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingRole(null)}
              disabled={isUpdating}
            >
              취소
            </Button>
            <Button onClick={confirmRoleChange} disabled={isUpdating}>
              {isUpdating ? "변경 중..." : "변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
