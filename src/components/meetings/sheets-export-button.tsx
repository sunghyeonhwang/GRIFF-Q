"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SheetsExportButtonProps {
  meetingId: string;
}

export function SheetsExportButton({ meetingId }: SheetsExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/sheets`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Google Sheets 내보내기에 실패했습니다.");
        return;
      }

      window.open(data.url, "_blank");
    } catch {
      toast.error("Google Sheets 내보내기에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Sheet className="mr-2 size-4" />
      )}
      Sheets
    </Button>
  );
}
