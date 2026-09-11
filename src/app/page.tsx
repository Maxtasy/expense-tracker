import Image from "next/image";
import Link from "next/link";
import type { ReactNode, CSSProperties } from "react";
import { ArrowLeftRight, CalendarDays, Compass, FileSpreadsheet, History, Languages, Mail, Repeat } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";

const GRADIENT_TEXT_STYLE: CSSProperties = {
  backgroundImage: "linear-gradient(135deg, #6366F1, #38BDF8, #34D399)",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
};

const FEATURES = [
  { icon: ArrowLeftRight, key: "track" },
  { icon: CalendarDays, key: "monthly" },
  { icon: Repeat, key: "recurring" },
  { icon: FileSpreadsheet, key: "backup" },
  { icon: Languages, key: "languages" },
] as const;

const SCREENSHOTS = [
  { src: "/landing/dashboard.png", key: "dashboard" },
  { src: "/landing/insights.png", key: "insights" },
  { src: "/landing/settings.png", key: "settings" },
] as const;

export default async function Home() {
  const t = await getTranslations("landing");

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Logo size={20} />
          Expense Tracker
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <LocaleSwitcher />
          <Link href="/login" className="text-fg-muted hover:text-fg">
            {t("nav.login")}
          </Link>
          <Link href="/signup" className="rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-fg hover:bg-accent-hover">
            {t("nav.signup")}
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-md px-4 py-10 text-center sm:max-w-lg sm:py-16 lg:max-w-5xl lg:py-20">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-semibold text-fg sm:text-3xl lg:text-4xl">
            {t.rich("hero.headline", {
              hl: (chunks: ReactNode) => (
                <span className="font-bold" style={GRADIENT_TEXT_STYLE}>
                  {chunks}
                </span>
              ),
            })}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-fg-muted lg:max-w-lg lg:text-base">{t("hero.subheadline")}</p>
          <p className="mt-3 text-sm font-medium text-success">{t("hero.tagline")}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/signup" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover">
              {t("hero.getStarted")}
            </Link>
            <Link href="/login" className="rounded-lg border border-border px-4 py-2 text-sm text-fg-muted hover:text-fg">
              {t("hero.login")}
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-3 text-left sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-4">
          {FEATURES.map(({ icon: Icon, key }) => (
            <div key={key} className="rounded-xl border border-border bg-surface/30 p-4">
              <Icon size={18} className="text-accent" />
              <p className="mt-3 text-sm font-medium text-fg">{t(`features.${key}.title`)}</p>
              <p className="mt-1 text-xs text-fg-muted">{t(`features.${key}.description`)}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 sm:mt-28">
          <h2 className="text-lg font-semibold text-fg sm:text-xl">{t("screenshotsHeading")}</h2>
          <div className="mt-6 flex flex-col flex-wrap items-center justify-center gap-8 sm:flex-row lg:gap-10">
            {SCREENSHOTS.map(({ src, key }, index) => (
              <figure key={src} className="w-full max-w-[220px] lg:max-w-[260px]">
                <div className="overflow-hidden rounded-[1.75rem] border border-border shadow-2xl shadow-black/40">
                  <Image
                    src={src}
                    alt={t(`screenshots.${key}.alt`)}
                    width={780}
                    height={1688}
                    className="h-auto w-full"
                    priority={index === 0}
                  />
                </div>
                <figcaption className="mt-3 text-xs text-fg-muted">{t(`screenshots.${key}.caption`)}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="mt-24 sm:mt-28">
          <div className="mx-auto max-w-md rounded-xl border border-border bg-surface/30 p-6 text-center">
            <Compass size={20} className="mx-auto text-accent" />
            <h2 className="mt-3 text-base font-semibold text-fg">{t("roadmapHeading")}</h2>
            <p className="mt-2 text-sm text-fg-muted">{t("roadmapSubheading")}</p>
          </div>
          <p className="mx-auto mt-4 max-w-md text-xs text-fg-muted">{t("aiDisclosure")}</p>
        </div>

        <div className="mt-16 sm:mt-20">
          <div className="mx-auto max-w-md rounded-xl border border-border bg-surface/30 p-6">
            <Mail size={20} className="mx-auto text-accent" />
            <h2 className="mt-3 text-base font-semibold text-fg">{t("feedbackHeading")}</h2>
            <p className="mt-2 text-sm text-fg-muted">{t("feedbackDescription")}</p>
            <a
              href="mailto:contact@maxtasy.me"
              className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover"
            >
              contact@maxtasy.me
            </a>
          </div>
        </div>

        <div className="mt-16 sm:mt-20">
          <div className="mx-auto max-w-md rounded-xl border border-border bg-surface/30 p-6 text-center">
            <History size={20} className="mx-auto text-accent" />
            <h2 className="mt-3 text-base font-semibold text-fg">{t("changelogHeading")}</h2>
            <p className="mt-2 text-sm text-fg-muted">{t("changelogSubheading")}</p>
            <Link
              href="/changelog"
              className="mt-4 inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg hover:text-accent"
            >
              {t("changelogCta")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
