import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track and categorize your personal income and expenses",
};

export const viewport: Viewport = {
  themeColor: "#0b0e14",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-fg">
        {/* next/script with beforeInteractive, not a React effect: PWA/store-listing
            crawlers (e.g. PWABuilder) check for a service worker within a fixed window
            and won't wait for the JS bundle to hydrate first. A raw <script> tag works
            for this too, but React logs "Encountered a script tag while rendering a
            React component" since browsers only auto-execute <script> from parsed HTML,
            not from React-managed DOM nodes — next/script is the supported way to inject
            an early inline script without that warning. */}
        <Script
          id="register-sw"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            // Dev server chunk URLs aren't content-hashed, and sw.js caches /_next/static/*
            // cache-first, so in development a registered worker serves stale JS/CSS after any
            // code change or branch switch. Dev therefore unregisters instead of registering.
            __html:
              process.env.NODE_ENV === "production"
                ? `if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js").catch(function () {}); }`
                : `if ("serviceWorker" in navigator) { navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); }); if (window.caches) { caches.keys().then(function (ks) { ks.forEach(function (k) { caches.delete(k); }); }); } }`,
          }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
