import { InsightsLink } from "./insights-nav";
import { getTranslations } from "next-intl/server";
import { typeButtonClass } from "@/lib/type-theme";

export async function TypeToggle({ mode, month, type }: { mode: "month" | "year"; month: string; type: "expense" | "income" | "all" }) {
  const [t, tInsights] = await Promise.all([getTranslations("dashboard.summary"), getTranslations("insights")]);
  const tabs: { key: "expense" | "income" | "all"; label: string }[] = [
    { key: "expense", label: t("expenses") },
    { key: "income", label: t("income") },
    { key: "all", label: tInsights("all") },
  ];

  return (
    <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface/30 p-1">
      {tabs.map((tab) => (
        <InsightsLink
          key={tab.key}
          href={`/dashboard/insights?mode=${mode}&month=${month}&type=${tab.key}`}
          className={`rounded-lg py-1.5 text-center text-sm font-medium transition ${
            type === tab.key
              ? tab.key === "all"
                ? "bg-surface-hover text-fg"
                : typeButtonClass(tab.key)
              : "text-fg-muted hover:text-fg"
          }`}
        >
          {tab.label}
        </InsightsLink>
      ))}
    </div>
  );
}
