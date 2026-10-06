"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PieChart, Repeat, Settings, Tags } from "lucide-react";
import { useTranslations } from "next-intl";

const LINKS = [
  { href: "/dashboard/recurring", key: "recurring", Icon: Repeat },
  { href: "/dashboard/insights", key: "insights", Icon: PieChart },
  { href: "/dashboard/categories", key: "categories", Icon: Tags },
  { href: "/dashboard/settings", key: "settings", Icon: Settings },
] as const;

export function HeaderNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("ariaLabel")} className="flex items-center gap-1 text-fg-muted">
      {LINKS.map(({ href, key, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-label={t(key)}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-lg hover:text-fg ${active ? "text-fg" : ""}`}
          >
            <Icon size={18} />
          </Link>
        );
      })}
    </nav>
  );
}
