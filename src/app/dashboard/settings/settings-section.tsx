import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

const cardClass = "rounded-xl border border-border bg-surface/30";

// A titled card. `danger` gives the destructive-action treatment (red heading and border).
export function SettingsSection({
  id,
  title,
  description,
  danger,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4">
      <h2 id={id} className={`mb-1.5 scroll-mt-20 text-xs font-medium ${danger ? "text-danger" : "text-fg-muted"}`}>
        {title}
      </h2>
      <div className={`${cardClass} p-3`} style={danger ? { borderColor: "var(--color-danger)" } : undefined}>
        {description && <p className="mb-3 text-xs text-fg-muted">{description}</p>}
        {children}
      </div>
    </section>
  );
}

// Several compact rows (label left, control right) inside one card.
export function SettingsRows({ children }: { children: React.ReactNode }) {
  return <div className={`${cardClass} mb-4 divide-y divide-border px-3`}>{children}</div>;
}

export function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-sm text-fg">{label}</div>
        {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
      </div>
      <div className="w-44 shrink-0">{children}</div>
    </div>
  );
}

// Heading of a settings sub-page, with the way back to the top-level Settings list.
export async function SettingsPageHeader({ title }: { title: string }) {
  const t = await getTranslations("settings");
  return (
    <>
      <Link href="/dashboard/settings" className="mb-3 flex min-h-11 items-center gap-1 text-xs text-fg-muted hover:text-fg">
        <ChevronLeft size={14} />
        {t("backToSettings")}
      </Link>
      <h1 className="mb-3 text-sm font-semibold text-fg">{title}</h1>
    </>
  );
}
