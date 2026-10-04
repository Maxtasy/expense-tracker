import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  Compass,
  FileSpreadsheet,
  History,
  Languages,
  Mail,
  Repeat,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { TeaserVideo } from "@/components/teaser-video";
import "./landing.css";

const FEATURES = [
  { icon: ArrowLeftRight, key: "track" },
  { icon: CalendarDays, key: "monthly" },
  { icon: Repeat, key: "recurring" },
  { icon: FileSpreadsheet, key: "backup" },
  { icon: Languages, key: "languages" },
] as const;

// The -vN suffix is bumped whenever the screenshots are regenerated: Next's image optimizer (and
// Vercel's) caches by URL, so reusing a filename can serve the old picture for hours.
const SCREENSHOTS = [
  { src: "/landing/dashboard-v3.png", key: "dashboard" },
  { src: "/landing/insights-v3.png", key: "insights" },
  { src: "/landing/settings-v3.png", key: "settings" },
] as const;

export default async function Home() {
  const t = await getTranslations("landing");

  return (
    <div className="lp">
      <header className="lp-header">
        <div className="lp-wrap">
          <Link href="/" className="lp-brand">
            <Logo size={24} />
            Expense Tracker
          </Link>
          <nav className="lp-nav">
            <LocaleSwitcher />
            <Link href="/login" className="lp-btn lp-btn--ghost">
              {t("nav.login")}
            </Link>
            <Link href="/signup" className="lp-btn lp-btn--primary">
              {t("nav.signup")}
            </Link>
          </nav>
        </div>
      </header>

      <main className="lp-wrap">
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <div className="lp-eyebrow lp-mono">
              <span>~/</span>
              <span>expense-tracker</span>
            </div>
            <h1 className="lp-h1">
              {t.rich("hero.headline", {
                hl: (chunks: ReactNode) => <span className="lp-hl">{chunks}</span>,
              })}
            </h1>
            <p className="lp-lead">{t("hero.subheadline")}</p>
            <span className="lp-chip">
              <Check size={14} />
              {t("hero.tagline")}
            </span>
            <div className="lp-actions">
              <Link href="/signup" className="lp-btn lp-btn--lg lp-btn--primary">
                {t("hero.getStarted")}
              </Link>
              <Link href="/login" className="lp-btn lp-btn--lg lp-btn--secondary">
                {t("hero.login")}
              </Link>
            </div>
          </div>
          <TeaserVideo label={t("videoLabel")} />
        </section>

        <section className="lp-section">
          <div className="lp-grid lp-grid--features">
            {FEATURES.map(({ icon: Icon, key }) => (
              <div key={key} className="lp-card">
                <Icon size={18} className="lp-card-icon" />
                <h3>{t(`features.${key}.title`)}</h3>
                <p>{t(`features.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section">
          <h2 className="lp-h2">{t("screenshotsHeading")}</h2>
          <div className="lp-shots">
            {SCREENSHOTS.map(({ src, key }) => (
              <figure key={src} className="lp-shot">
                <div className="lp-shot-frame">
                  <Image src={src} alt={t(`screenshots.${key}.alt`)} width={780} height={1688} />
                </div>
                <figcaption>{t(`screenshots.${key}.caption`)}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-grid">
            <div className="lp-card">
              <Compass size={18} className="lp-card-icon" />
              <h3>{t("roadmapHeading")}</h3>
              <p>{t("roadmapSubheading")}</p>
            </div>
            <div className="lp-card">
              <Mail size={18} className="lp-card-icon" />
              <h3>{t("feedbackHeading")}</h3>
              <p>{t("feedbackDescription")}</p>
              <a href="mailto:maxtasy888@gmail.com" className="lp-btn lp-btn--secondary lp-mono">
                maxtasy888@gmail.com
              </a>
            </div>
            <div className="lp-card">
              <History size={18} className="lp-card-icon" />
              <h3>{t("changelogHeading")}</h3>
              <p>{t("changelogSubheading")}</p>
              <Link href="/changelog" className="lp-btn lp-btn--secondary">
                {t("changelogCta")}
              </Link>
            </div>
          </div>
          <p className="lp-note">{t("aiDisclosure")}</p>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <span>© {new Date().getFullYear()} Maxtasy</span>
          <span className="lp-mono">maxtasy.me</span>
        </div>
      </footer>
    </div>
  );
}
