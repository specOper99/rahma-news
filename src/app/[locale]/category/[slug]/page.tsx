import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Pagination } from "@/components/public/Pagination";
import { PublicMain } from "@/components/public/PublicMain";
import { isLocale, type Locale } from "@/lib/locales";
import { getByCategory, getMostRead } from "@/server/dal/articles";
import { MostRead } from "@/components/public/MostRead";
import { LegalRail } from "@/components/public/LegalRail";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);
  const page = Math.max(1, Number((await searchParams).page ?? 1));
  const data = await getByCategory(locale, slug, page);
  if (!data) notFound();
  const tL = await getTranslations("Listing");
  const mostRead = await getMostRead(locale, 2, 5);
  return (
    <PublicMain
      title={data.category.name}
      kicker={tL("section")}
      aside={
        <>
          {mostRead.length ? <MostRead items={mostRead} /> : null}
          <LegalRail />
        </>
      }
    >
      {data.stories.length === 0 ? <p className="text-on-surface-variant">{tL("empty")}</p> : null}
      {data.stories.map((s) => (
        <ArticleCard key={s.articleId} story={s} locale={locale} variant="river" />
      ))}
      <Pagination page={page} hasNext={data.hasNext} basePath={`/category/${slug}`} />
    </PublicMain>
  );
}
