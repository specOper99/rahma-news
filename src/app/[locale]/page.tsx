import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { BreakingBar } from "@/components/public/BreakingBar";
import { ArticleCard } from "@/components/public/ArticleCard";
import { NewsletterForm } from "@/components/public/NewsletterForm";
import { MostRead } from "@/components/public/MostRead";
import { Icon } from "@/components/ui/Icon";
import { isLocale } from "@/lib/locales";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/locales";
import { absoluteUrl, hreflangMap } from "@/lib/seo";
import { getHomepageBundle } from "@/server/dal/articles";
import { Link } from "@/i18n/navigation";
import { sectionDot } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  const languages = hreflangMap(
    LOCALES.map((l) => ({ locale: l, url: absoluteUrl(`/${l}`) })),
    absoluteUrl(`/${DEFAULT_LOCALE}`),
  );
  return {
    title: t("siteName"),
    description: t("defaultDescription"),
    alternates: {
      canonical: absoluteUrl(`/${locale}`),
      languages,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tA = await getTranslations("A11y");
  let bundle;
  try {
    bundle = await getHomepageBundle(locale);
  } catch {
    return (
      <main id="main" className="mx-auto max-w-[90rem] px-4 py-16 sm:px-8" aria-label={tA("main")}>
        <p>{t("empty")}</p>
      </main>
    );
  }
  const lead = bundle.featured[0];
  const secondaries = bundle.featured.slice(1, 3);
  const moreFeatured = bundle.featured.slice(3, 6);

  return (
    <>
      <BreakingBar items={bundle.breaking} locale={locale} />
      <main id="main" className="mx-auto max-w-[90rem] space-y-10 px-4 py-6 sm:px-8" aria-label={tA("main")}>
        {lead ? null : <h1 className="sr-only">{t("latest")}</h1>}
        {lead ? (
          <section className="space-y-4">
            <div className="flex items-end justify-between border-b-2 border-primary pb-2.5">
              <div className="flex items-center gap-3">
                <span className="h-7 w-3.5 rounded-sm bg-primary" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    {t("featured")}
                  </span>
                  <h2 className="font-display text-2xl font-bold text-primary sm:text-3xl">
                    {lead.categoryName}
                  </h2>
                </div>
              </div>
              {lead.categorySlug ? (
                <Link
                  href={`/category/${lead.categorySlug}`}
                  className="hidden items-center gap-1 text-xs font-bold text-secondary hover:text-tigris-blue sm:inline-flex"
                >
                  {t("moreIn", { category: lead.categoryName })}
                  <Icon name="arrow" size={15} />
                </Link>
              ) : null}
            </div>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              <ArticleCard story={lead} locale={locale} variant="lead" />
              {secondaries.length > 0 ? (
                <div className="flex flex-col gap-4 lg:col-span-4">
                  {secondaries.map((s) => (
                    <ArticleCard key={s.articleId} story={s} locale={locale} variant="secondary" />
                  ))}
                </div>
              ) : null}
            </div>
            {moreFeatured.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {moreFeatured.map((s) => (
                  <ArticleCard key={s.articleId} story={s} locale={locale} variant="rail" />
                ))}
              </div>
            ) : null}
          </section>
        ) : bundle.rails.every((r) => r.stories.length === 0) && bundle.river.length === 0 ? (
          <p>{t("empty")}</p>
        ) : null}

        {bundle.rails.map((rail, i) => (
          <section key={rail.categoryId} className="space-y-4">
            <div className="flex items-end justify-between border-b-2 border-primary pb-2.5">
              <div className="flex items-center gap-3">
                <span className={`h-7 w-3.5 rounded-sm ${sectionDot(i)}`} />
                <h2 className="font-display text-2xl font-bold text-primary sm:text-3xl">{rail.name}</h2>
              </div>
              <Link
                href={`/category/${rail.slug}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-tigris-blue"
              >
                {t("moreIn", { category: rail.name })}
                <Icon name="arrow" size={15} />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {rail.stories.map((s) => (
                <ArticleCard key={s.articleId} story={s} locale={locale} variant="rail" />
              ))}
            </div>
          </section>
        ))}

        <section className="grid grid-cols-1 items-start gap-8 border-t border-border-muted pt-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h2 className="mb-2 font-display text-2xl font-bold text-primary">{t("latest")}</h2>
            {bundle.river.map((s) => (
              <ArticleCard key={s.articleId} story={s} locale={locale} variant="river" />
            ))}
            <Link
              href="/latest"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-border-muted bg-surface-container px-4 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-surface-container-high"
            >
              {t("riverArchive")}
              <Icon name="arrow" size={16} />
            </Link>
          </div>
          <aside className="space-y-6 lg:col-span-4">
            <MostRead items={bundle.mostRead} />
            <div className="space-y-3 rounded-md bg-primary p-5 text-on-primary shadow-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 font-mono-num text-[11px] font-bold text-white">
                  {t("tipKicker")}
                </span>
                <Icon name="lock" size={20} className="text-surface-container-highest" />
              </div>
              <h2 className="font-display text-lg font-bold text-white">{t("tipTitle")}</h2>
              <p className="font-ui text-xs leading-relaxed text-on-primary-container">{t("tipBody")}</p>
              <Link
                href="/contact"
                className="flex w-full items-center justify-center gap-1.5 rounded bg-secondary py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-tigris-blue"
              >
                {t("tipCta")}
              </Link>
            </div>
            <NewsletterForm locale={locale} />
            <div className="space-y-2 rounded-md border border-border-muted bg-surface-container-lowest p-4 text-xs text-on-surface-variant">
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <Icon name="verified" size={16} className="text-secondary" />
                <span>{t("charter")}</span>
              </div>
              <p className="leading-relaxed">{t("charterBody")}</p>
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}
