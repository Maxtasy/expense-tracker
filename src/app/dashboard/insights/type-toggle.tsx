import { getTranslations } from "next-intl/server";

export async function TypeToggle({ mode, month, type }: { mode: "month" | "year"; month: string; type: "expense" | "income" }) {
  const t = await getTranslations("dashboard.summary");
  const tabs: { key: "expense" | "income"; label: string }[] = [
    { key: "expense", label: t("expenses") },
    { key: "income", label: t("income") },
  ];

  return (
    <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface/30 p-1">
      {tabs.map((tab) => (
        <a
          key={tab.key}
          href={`/dashboard/insights?mode=${mode}&month=${month}&type=${tab.key}`}
          className={`rounded-lg py-1.5 text-center text-sm font-medium transition ${
            type === tab.key ? "bg-accent text-accent-fg" : "text-fg-muted hover:text-fg"
          }`}
        >
          {tab.label}
        </a>
      ))}
    </div>
  );
}
