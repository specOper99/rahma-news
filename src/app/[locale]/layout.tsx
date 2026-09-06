import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  Newsreader,
  Inter,
  Amiri,
  Cairo,
  JetBrains_Mono,
} from "next/font/google";
import { LOCALES, DEFAULT_LOCALE, dirOf, htmlLangOf, isLocale, type Locale } from "@/lib/locales";
import { SiteHeader } from "@/components/public/SiteHeader";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { SiteFooter } from "@/components/public/SiteFooter";
import { BureauClocks } from "@/components/public/BureauClocks";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { getNavCategories, getNavTags, getSettings } from "@/server/dal/articles";
import { brandNameFromSettings } from "@/lib/brand";
import { absoluteUrl, hreflangMap } from "@/lib/seo";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    alternates: {
      languages: hreflangMap(
        LOCALES.map((l) => ({ locale: l, url: absoluteUrl(`/${l}`) })),
        absoluteUrl(`/${DEFAULT_LOCALE}`),
      ),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = dirOf(locale);
  const categories = await getNavCategories(locale).catch(() => []);
  const tags = await getNavTags(locale).catch(() => []);
  const settings = await getSettings().catch(() => null);
  const siteName = brandNameFromSettings(settings, locale);
  const locales = settings?.locales as
    | Record<string, { tagline?: string; footerBlurb?: string }>
    | undefined;
  const tagline = locales?.[locale]?.tagline;
  const footerBlurb = locales?.[locale]?.footerBlurb;
  const latin = locale === "en";
  const fontVars = [
    inter.variable,
    newsreader.variable,
    amiri.variable,
    cairo.variable,
    jetbrains.variable,
  ].join(" ");
  const display = latin ? newsreader.style.fontFamily : amiri.style.fontFamily;
  const body = latin ? newsreader.style.fontFamily : amiri.style.fontFamily;
  const ui = latin ? inter.style.fontFamily : cairo.style.fontFamily;

  return (
    <html
      lang={htmlLangOf(locale)}
      dir={dir}
      className={`${fontVars} h-full antialiased`}
      style={
        {
          "--font-display": display,
          "--font-body": body,
          "--font-ui": ui,
          "--font-mono": jetbrains.style.fontFamily,
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col bg-surface text-on-surface">
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main"
            className="font-ui sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
          >
            {String((messages as { A11y?: { skip?: string } }).A11y?.skip ?? "Skip")}
          </a>
          <SiteHeader
            locale={locale}
            categories={categories}
            tags={tags}
            siteName={siteName}
            tagline={tagline}
            languageSwitcher={<LanguageSwitcher locale={locale} />}
            clocks={<BureauClocks locale={locale} />}
          />
          <div className="flex-1">{children}</div>
          <SiteFooter
            locale={locale}
            siteName={siteName}
            blurb={footerBlurb}
            categories={categories}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
