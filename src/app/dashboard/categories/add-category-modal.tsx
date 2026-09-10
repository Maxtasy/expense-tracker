"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { AddCategoryForm } from "./add-category-form";
import { Dialog } from "../dialog";
import { AddFab } from "../add-fab";

export function AddCategoryModal() {
  const t = useTranslations("categories");
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <AddFab onClick={() => dialogRef.current?.showModal()} label={t("addFabLabel")} />

      <Dialog dialogRef={dialogRef} title={t("addTitle")}>
        <AddCategoryForm onSuccess={() => dialogRef.current?.close()} />
      </Dialog>
    </>
  );
}
