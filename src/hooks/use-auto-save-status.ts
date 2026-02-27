"use client";

import { useState, useCallback, useRef } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutoSaveStatus() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setSaving = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("saving");
  }, []);

  const setSaved = useCallback(() => {
    setStatus("saved");
    timerRef.current = setTimeout(() => setStatus("idle"), 3000);
  }, []);

  const setError = useCallback(() => {
    setStatus("error");
    timerRef.current = setTimeout(() => setStatus("idle"), 5000);
  }, []);

  const statusText: Record<SaveStatus, string> = {
    idle: "",
    saving: "저장 중...",
    saved: "저장됨",
    error: "저장 실패",
  };

  return { status, statusText: statusText[status], setSaving, setSaved, setError };
}
