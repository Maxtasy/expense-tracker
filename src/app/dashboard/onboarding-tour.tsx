"use client";

import { useEffect, useRef, useState } from "react";
import { PieChart, Plus, Repeat, Settings, Tags, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";
import { completeOnboarding } from "./actions";

const STEPS: { key: string; icon: LucideIcon | null }[] = [
  { key: "welcome", icon: null },
  { key: "add", icon: Plus },
  { key: "recurring", icon: Repeat },
  { key: "insights", icon: PieChart },
  { key: "categories", icon: Tags },
  { key: "settings", icon: Settings },
];

// Shown automatically once to a new user (autoOpen) and replayable from Settings (trigger).
// Closing it any way -- Done, Skip, Escape, backdrop -- counts as seen, so it never nags.
export function OnboardingTour({ autoOpen = false, trigger = false }: { autoOpen?: boolean; trigger?: boolean }) {
  const t = useTranslations("onboarding");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (autoOpen) dialogRef.current?.showModal();
  }, [autoOpen]);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  function open() {
    setStep(0);
    dialogRef.current?.showModal();
  }

  // Done, Skip, Escape and backdrop all end up in the dialog's close event, which records the tour as seen.
  function finish() {
    dialogRef.current?.close();
  }

  function handleClose() {
    if (autoOpen) void completeOnboarding();
  }

  return (
    <>
      {trigger && (
        <button
          type="button"
          onClick={open}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg hover:bg-surface-hover"
        >
          {t("replayButton")}
        </button>
      )}
      <style>{`
        .onboarding-dialog::backdrop { background: oklch(0.08 0.005 255 / 0.66); backdrop-filter: blur(2px); }
        @keyframes dialog-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .onboarding-dialog[open] { animation: dialog-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1); }
        @media (prefers-reduced-motion: reduce) {
        .onboarding-dialog[open] { animation: none; } }
        .onboarding-dialog { padding: 1.25rem; }
        .onboarding-icon { display: flex; align-items: center; justify-content: center; width: 3rem; height: 3rem; margin-bottom: 1rem; }
        .onboarding-title { margin-bottom: 0.375rem; }
        .onboarding-body { margin-bottom: 1.25rem; }
        .onboarding-dots { display: flex; align-items: center; justify-content: center; gap: 0.375rem; margin-bottom: 1rem; }
        .onboarding-actions { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .onboarding-actions > div { display: flex; gap: 0.5rem; }
      `}</style>
      <dialog
        ref={dialogRef}
        onClose={handleClose}
        aria-label={t("ariaLabel")}
        style={{ position: "fixed", inset: 0, margin: "auto", width: "calc(100% - 2rem)", maxWidth: "24rem" }}
        className="onboarding-dialog rounded-xl border border-border bg-surface text-fg"
      >
        <div className="onboarding-icon rounded-xl border border-border bg-background text-accent-text" aria-hidden="true">
          {Icon ? <Icon size={22} /> : <Logo size={24} />}
        </div>
        {/* live region so a screen reader hears each step as it changes */}
        <div aria-live="polite">
          <h2 className="onboarding-title text-base font-semibold text-fg">{t(`steps.${current.key}.title`)}</h2>
          <p className="onboarding-body text-sm text-fg-muted">{t(`steps.${current.key}.body`)}</p>
        </div>

        <div className="onboarding-dots" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 3 }}
              className={i === step ? "bg-accent" : "bg-border"}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          {isLast ? (
            <span className="text-xs text-fg-muted">{t("progress", { current: step + 1, total: STEPS.length })}</span>
          ) : (
            <button type="button" onClick={finish} className="text-xs text-fg-muted hover:text-fg">
              {t("skip")}
            </button>
          )}
          <div>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-fg hover:bg-surface-hover"
              >
                {t("back")}
              </button>
            )}
            <button
              type="button"
              onClick={isLast ? finish : () => setStep(step + 1)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition hover:bg-accent-hover"
            >
              {isLast ? t("done") : t("next")}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
