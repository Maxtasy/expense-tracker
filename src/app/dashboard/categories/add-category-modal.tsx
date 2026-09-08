"use client";

import { useRef } from "react";
import { AddCategoryForm } from "./add-category-form";
import { Dialog } from "../dialog";
import { AddFab } from "../add-fab";

export function AddCategoryModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <AddFab onClick={() => dialogRef.current?.showModal()} label="Add category" />

      <Dialog dialogRef={dialogRef} title="Add category">
        <AddCategoryForm onSuccess={() => dialogRef.current?.close()} />
      </Dialog>
    </>
  );
}
