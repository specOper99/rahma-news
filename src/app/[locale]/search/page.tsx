import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Pagination } from "@/components/public/Pagination";
import { PublicMain } from "@/components/public/PublicMain";
import { isLocale, type Locale } from "@/lib/locales";
import { searchEditions, getMostRead } from "@/server/dal/articles";
import { MostRead } from "@/components/public/MostRead";
import { LegalRail } from "@/components/public/LegalRail";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: false } };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page ?? 1));
  const t = await getTranslations("Search");
  const results =
    q.length >= 2 ? await searchEditions(locale, q, page) : { stories: [], hasNext: false };
  const mostRead = await getMostRead(locale, 2, 5);
  return (
    <PublicMain
      title={t("submit")}
      kicker={t("kicker")}
      aside={
        <>
          {mostRead.length ? <MostRead items={mostRead} /> : null}
          <LegalRail />
        </>
      }
    >
      <form className="mb-8 flex flex-col gap-3 font-ui sm:flex-row sm:items-end" action={`/${locale}/search`}>
        <label className="min-w-0 flex-1 text-sm font-medium text-on-surface">
          {t("placeholder")}
          <input
            name="q"
            defaultValue={q}
            className="public-field mt-2"
          />
        </label>
        <button type="submit" className="public-btn shrink-0">
          {t("submit")}
        </button>
      </form>
      {q.length > 0 && q.length < 2 ? <p className="text-on-surface-variant">{t("minChars")}</p> : null}
      {q.length >= 2 && results.stories.length === 0 ? (
        <p className="text-on-surface-variant">{t("noResults", { q })}</p>
      ) : null}
      {q.length >= 2 && results.stories.length > 0 ? (
        <p className="mb-4 font-mono-num text-xs text-outline">{t("results", { n: results.stories.length })}</p>
      ) : null}
      {results.stories.map((s) => (
        <ArticleCard key={s.articleId} story={s} locale={locale} variant="river" />
      ))}
      {q.length >= 2 ? (
        <Pagination page={page} hasNext={results.hasNext} basePath={`/search?q=${encodeURIComponent(q)}`} />
      ) : null}
    </PublicMain>
  );
}
