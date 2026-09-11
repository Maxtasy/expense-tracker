"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { previewMoneyManagerImport, commitMoneyManagerImport, type CategorySuggestion } from "./actions";
import { Spinner } from "@/components/spinner";

type TxType = "expense" | "income";
type ExistingCategory = { id: string; name: string; type: TxType };
type MappingAction = "create" | "map" | "skip";
type MappingEntry = {
  name: string;
  type: TxType;
  count: number;
  action: MappingAction;
  targetCategoryId?: string;
  newName?: string;
};

function mappingKey(name: string, type: TxType) {
  return `${type}:${name.toLowerCase()}`;
}

function buildInitialMapping(categories: CategorySuggestion[]): Map<string, MappingEntry> {
  const map = new Map<string, MappingEntry>();
  for (const c of categories) {
    map.set(mappingKey(c.name, c.type), {
      name: c.name,
      type: c.type,
      count: c.count,
      action: c.matchedCategoryId ? "map" : "create",
      targetCategoryId: c.matchedCategoryId ?? undefined,
      newName: c.name,
    });
  }
  return map;
}

const selectClass =
  "w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-fg focus:border-accent focus:outline-none";
const inputClass =
  "w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none";

export function ImportWizard({ existingCategories }: { existingCategories: ExistingCategory[] }) {
  const t = useTranslations("settings.moneyManager");
  const tCommon = useTranslations("common");
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewError, setPreviewError] = useState<string | undefined>();
  const [summary, setSummary] = useState<{
    rowCount: number;
    dateRange: { min: string; max: string } | null;
    skippedNonEur: number;
    skippedInvalid: number;
  } | null>(null);
  const [mapping, setMapping] = useState<Map<string, MappingEntry>>(new Map());
  const [commitError, setCommitError] = useState<string | undefined>();
  const [result, setResult] = useState<{ imported: number; skippedDuplicates: number; categoriesCreated: number } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const mappingRows = useMemo(
    () => [...mapping.values()].sort((a, b) => b.count - a.count),
    [mapping],
  );

  function handlePreview(formData: FormData) {
    setPreviewError(undefined);
    startTransition(async () => {
      const res = await previewMoneyManagerImport(null, formData);
      if (res?.error) {
        setPreviewError(res.error);
        return;
      }
      if (res?.result) {
        setSummary({
          rowCount: res.result.rowCount,
          dateRange: res.result.dateRange,
          skippedNonEur: res.result.skippedNonEur,
          skippedInvalid: res.result.skippedInvalid,
        });
        setMapping(buildInitialMapping(res.result.categories));
        setStep("review");
      }
    });
  }

  function updateEntry(key: string, patch: Partial<MappingEntry>) {
    setMapping((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (existing) next.set(key, { ...existing, ...patch });
      return next;
    });
  }

  function handleCommit() {
    if (!file) return;
    setCommitError(undefined);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("mapping", JSON.stringify([...mapping.values()]));
      const res = await commitMoneyManagerImport(null, formData);
      if (res?.error) {
        setCommitError(res.error);
        return;
      }
      if (res?.success) {
        setResult({
          imported: res.imported ?? 0,
          skippedDuplicates: res.skippedDuplicates ?? 0,
          categoriesCreated: res.categoriesCreated ?? 0,
        });
        setStep("done");
      }
    });
  }

  function reset() {
    setStep("upload");
    setFile(null);
    setPreviewError(undefined);
    setSummary(null);
    setMapping(new Map());
    setCommitError(undefined);
    setResult(null);
  }

  if (step === "done" && result) {
    return (
      <div className="rounded-xl border border-border bg-surface/30 p-3">
        <p className="mb-1 text-sm text-success">{t("doneComplete")}</p>
        <ul className="mb-4 space-y-0.5 text-xs text-fg-muted">
          <li>{t("doneImported", { count: result.imported })}</li>
          {result.categoriesCreated > 0 && <li>{t("doneCategoriesCreated", { count: result.categoriesCreated })}</li>}
          {result.skippedDuplicates > 0 && <li>{t("doneDuplicatesSkipped", { count: result.skippedDuplicates })}</li>}
        </ul>
        <div className="flex gap-2">
          <Link href="/dashboard" className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-fg hover:bg-accent-hover">
            {t("goToDashboard")}
          </Link>
          <button onClick={reset} className="rounded-lg border border-border px-3 py-2 text-xs text-fg hover:bg-surface-hover">
            {t("importAnother")}
          </button>
        </div>
      </div>
    );
  }

  if (step === "review" && summary) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-surface/30 p-3">
          <p className="text-xs text-fg-muted">
            {t("summaryCount", { count: summary.rowCount })}
            {summary.dateRange && (
              <>{t("summaryDateRange", { min: summary.dateRange.min, max: summary.dateRange.max })}</>
            )}
            .
            {summary.skippedNonEur > 0 && <>{t("summaryNonEurSkipped", { count: summary.skippedNonEur })}</>}
            {summary.skippedInvalid > 0 && <>{t("summaryInvalidSkipped", { count: summary.skippedInvalid })}</>}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface/30 p-3">
          <h2 className="mb-2 text-xs font-medium text-fg-muted">{t("reviewHeading", { count: mappingRows.length })}</h2>
          <div className="space-y-2">
            {mappingRows.map((entry) => {
              const key = mappingKey(entry.name, entry.type);
              const candidateCategories = existingCategories.filter((c) => c.type === entry.type);
              return (
                <div key={key} className="rounded-lg border border-border bg-surface p-2">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-sm text-fg">{entry.name}</span>
                    <span className="shrink-0 text-xs text-fg-muted">
                      {t("countAndType", { count: entry.count, type: tCommon(entry.type) })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={entry.action}
                      onChange={(e) => updateEntry(key, { action: e.target.value as MappingAction })}
                      className={selectClass}
                    >
                      <option value="create">{t("createNewCategory")}</option>
                      <option value="map">{t("mapToExisting")}</option>
                      <option value="skip">{t("skipTransactions")}</option>
                    </select>
                    {entry.action === "create" && (
                      <input
                        type="text"
                        value={entry.newName ?? ""}
                        onChange={(e) => updateEntry(key, { newName: e.target.value })}
                        maxLength={50}
                        className={inputClass}
                      />
                    )}
                    {entry.action === "map" && (
                      <select
                        value={entry.targetCategoryId ?? ""}
                        onChange={(e) => updateEntry(key, { targetCategoryId: e.target.value })}
                        className={selectClass}
                      >
                        <option value="" disabled>
                          {t("chooseCategory")}
                        </option>
                        {candidateCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {commitError && <p className="text-sm text-danger">{commitError}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleCommit}
            disabled={isPending || mappingRows.some((r) => r.action === "map" && !r.targetCategoryId)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-40"
          >
            {isPending && <Spinner size={14} />}
            {isPending ? t("importing") : t("importButton")}
          </button>
          <button onClick={reset} disabled={isPending} className="rounded-lg border border-border px-3 py-2 text-sm text-fg hover:bg-surface-hover">
            {t("startOver")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={handlePreview} className="rounded-xl border border-border bg-surface/30 p-3">
      <label htmlFor="mmFile" className="mb-1 block text-xs text-fg-muted">
        {t("fileLabel")}
      </label>
      <input
        id="mmFile"
        name="file"
        type="file"
        accept=".xlsx"
        required
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg file:mr-2 file:rounded-md file:border-0 file:bg-accent file:px-2 file:py-1 file:text-xs file:font-medium file:text-accent-fg"
      />
      <button
        type="submit"
        disabled={isPending || !file}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-40"
      >
        {isPending && <Spinner size={14} />}
        {isPending ? t("readingFile") : t("previewImport")}
      </button>
      {previewError && <p className="mt-2 text-sm text-danger">{previewError}</p>}
    </form>
  );
}
