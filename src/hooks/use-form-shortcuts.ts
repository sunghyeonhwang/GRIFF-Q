"use client";

import { useEffect } from "react";

interface FormShortcutsOptions {
  onSave?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function useFormShortcuts({
  onSave,
  onSubmit,
  onCancel,
  disabled = false,
}: FormShortcutsOptions) {
  useEffect(() => {
    if (disabled) return;

    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+S → save
      if (mod && e.key === "s") {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Cmd/Ctrl+Enter → submit
      if (mod && e.key === "Enter") {
        e.preventDefault();
        onSubmit?.();
        return;
      }

      // Esc → cancel
      if (e.key === "Escape") {
        onCancel?.();
        return;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSave, onSubmit, onCancel, disabled]);
}
