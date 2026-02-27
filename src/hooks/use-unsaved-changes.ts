"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useUnsavedChanges(currentData: unknown) {
  const initialRef = useRef<string>("");
  const [isDirty, setIsDirty] = useState(false);
  const initialized = useRef(false);

  // 초기값 한 번만 고정
  useEffect(() => {
    if (!initialized.current) {
      initialRef.current = JSON.stringify(currentData);
      initialized.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 현재 값과 초기값 비교
  useEffect(() => {
    if (!initialized.current) return;
    const current = JSON.stringify(currentData);
    setIsDirty(current !== initialRef.current);
  }, [currentData]);

  // beforeunload 등록
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const markSaved = useCallback(() => {
    initialRef.current = JSON.stringify(currentData);
    setIsDirty(false);
  }, [currentData]);

  return { isDirty, markSaved };
}
