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
    <form ref={formRef} action={formAction} style={{ display: "flex", gap: 8, alignItems: "center", margin: "1rem 0" }}>
      <input name="name" type="text" placeholder="New category name" required maxLength={50} />
      <button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add category"}
      </button>
      {state?.error && <span style={{ color: "red" }}>{state.error}</span>}
    </form>
  );
}
