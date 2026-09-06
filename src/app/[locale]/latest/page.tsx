import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Pagination } from "@/components/public/Pagination";
import { PublicMain } from "@/components/public/PublicMain";
import { isLocale, type Locale } from "@/lib/locales";
import { getLatest, getMostRead } from "@/server/dal/articles";
import { MostRead } from "@/components/public/MostRead";
import { LegalRail } from "@/components/public/LegalRail";

export default async function LatestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tL = await getTranslations("Listing");
  const page = Math.max(1, Number((await searchParams).page ?? 1));
  const { stories, hasNext } = await getLatest(locale, page);
  const mostRead = await getMostRead(locale, 2, 5);
  return (
    <PublicMain
      title={t("latest")}
      kicker={tL("archive")}
      aside={
        <>
          {mostRead.length ? <MostRead items={mostRead} /> : null}
          <LegalRail />
        </>
      }
    >
      {stories.length === 0 ? <p className="text-on-surface-variant">{tL("empty")}</p> : null}
      {stories.map((s) => (
        <ArticleCard key={s.articleId} story={s} locale={locale} variant="river" />
      ))}
      <Pagination page={page} hasNext={hasNext} basePath="/latest" />
    </PublicMain>
  );
}
