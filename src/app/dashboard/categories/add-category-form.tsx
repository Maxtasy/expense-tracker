"use client";

import { useActionState, useRef, useEffect } from "react";
import { createCategory } from "./actions";

export function AddCategoryForm() {
  const [state, formAction, pending] = useActionState(createCategory, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mb-3 flex items-center gap-2">
      <input
        name="name"
        type="text"
        placeholder="New category name"
        required
        maxLength={50}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "..." : "Add"}
      </button>
      {state?.error && <span className="shrink-0 text-xs text-danger">{state.error}</span>}
    </form>
  );
}
