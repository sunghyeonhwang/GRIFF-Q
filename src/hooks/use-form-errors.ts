"use client";

import { useState, useCallback } from "react";
import type { ZodType } from "zod";

type FieldErrors = Record<string, string>;

export function useFormErrors<T>(schema: ZodType<T>) {
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = useCallback(
    (data: unknown): data is T => {
      const result = schema.safeParse(data);
      if (result.success) {
        setErrors({});
        return true;
      }
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return false;
    },
    [schema]
  );

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const hasError = useCallback(
    (field: string) => Boolean(errors[field]),
    [errors]
  );

  const getError = useCallback(
    (field: string) => errors[field] ?? "",
    [errors]
  );

  return { errors, validate, clearError, hasError, getError, setErrors };
}
