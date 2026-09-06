import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ShareBar } from "@/components/public/ShareBar";
import { ViewBeacon } from "@/components/public/ViewBeacon";
import { EditionBar } from "@/components/public/EditionBar";
import { FontSizeControls } from "@/components/public/FontSizeControls";
import { ArticleCard } from "@/components/public/ArticleCard";
import { isLocale, DEFAULT_LOCALE, dirOf, htmlLangOf, type Locale } from "@/lib/locales";
import { absoluteUrl, hreflangMap } from "@/lib/seo";
import { renderEditionBody } from "@/lib/tiptap/render";
import { collectMediaIds, type TipTapNode } from "@/lib/tiptap/schema";
import { verifyPreview } from "@/lib/preview";
import {
  getArticleAuthors,
  getArticleTags,
  getEditionSiblings,
  getMediaForLocale,
  getPublishedEditionBySlug,
  getRelated,
  getSettings,
  getNavCategories,
  getMediaByIds,
} from "@/server/dal/articles";
import { resolveLanguageHrefs } from "@/server/dal/switcher";
import { brandNameFromSettings } from "@/lib/brand";
import { formatStoryDate } from "@/lib/format";
import { headers } from "next/headers";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const sp = await searchParams;
  const row = await getPublishedEditionBySlug(locale, slug).catch(() => null);
  if (!row) return { robots: { index: false, follow: false } };
  const preview = verifyPreview(sp.preview, row.article.id, locale);
  if (!row.isLive && !preview) return { robots: { index: false, follow: false } };
  const og = absoluteUrl(`/og/${locale}/${slug}`);
  if (!row.isLive || preview) {
    return {
      title: row.edition.title,
      robots: { index: false, follow: false },
    };
  }
  const siblings = await getEditionSiblings(row.article.id);
  const live = siblings.filter(
    (s) => s.status === "published" && s.publishedAt && s.publishedAt <= new Date(),
  );
  const languages = hreflangMap(
    live.map((s) => ({
      locale: s.locale as Locale,
      url: absoluteUrl(`/${s.locale}/article/${s.slug}`),
    })),
    live.find((s) => s.locale === DEFAULT_LOCALE)
      ? absoluteUrl(
          `/${DEFAULT_LOCALE}/article/${live.find((s) => s.locale === DEFAULT_LOCALE)!.slug}`,
        )
      : absoluteUrl(`/${locale}/article/${slug}`),
  );
  const description = row.edition.seoDescription || row.edition.dek;
  return {
    title: row.edition.seoTitle || row.edition.title,
    description,
    alternates: {
      canonical: row.edition.canonicalUrl || absoluteUrl(`/${locale}/article/${slug}`),
      languages,
    },
    openGraph: {
      type: "article",
      locale: locale === "en" ? "en_US" : locale === "ar" ? "ar_AR" : "ckb_IQ",
      title: row.edition.title,
      description: row.edition.dek,
      images: [{ url: og, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: row.edition.title,
      description: row.edition.dek,
      images: [og],
    },
  };
}

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);
  const sp = await searchParams;
  const row = await getPublishedEditionBySlug(locale, slug);
  if (!row) notFound();
  const preview = verifyPreview(sp.preview, row.article.id, locale);
  if (!row.isLive && !preview) notFound();
  const t = await getTranslations("Article");
  const tA = await getTranslations("A11y");
  const authors = await getArticleAuthors(row.article.id, locale);
  const tags = await getArticleTags(row.article.id, locale);
  const related = await getRelated(locale, row.article.id, row.article.primaryCategoryId);
  const cats = await getNavCategories(locale).catch(() => []);
  const category = cats.find((c) => c.id === row.article.primaryCategoryId);
  const hero = await getMediaForLocale(row.article.heroMediaId, locale);
  const bodyIds = [...collectMediaIds(row.edition.body as TipTapNode)];
  if (hero) bodyIds.push(hero.id);
  const mediaLookup = await getMediaByIds(bodyIds, locale);
  const settings = await getSettings().catch(() => null);
  const publisher = brandNameFromSettings(settings, locale);
  const url = absoluteUrl(`/${locale}/article/${slug}`);
  const h = await headers();
  const pathname = h.get("x-pathname") || `/${locale}/article/${slug}`;
  const hrefs = await resolveLanguageHrefs(pathname).catch(() => null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: row.edition.title,
    description: row.edition.dek,
    datePublished: row.edition.publishedAt?.toISOString(),
    dateModified: row.edition.updatedAt.toISOString(),
    inLanguage: locale,
    mainEntityOfPage: url,
    wordCount: row.edition.wordCount,
    author: authors.map((a) => ({ "@type": "Person", name: a.name })),
    publisher: { "@type": "Organization", name: publisher },
  };
  const date = formatStoryDate(locale, row.edition.publishedAt);
  const showUpdated =
    row.edition.publishedAt &&
    row.edition.updatedAt.getTime() - row.edition.publishedAt.getTime() > 15 * 60 * 1000;
  const mediaMap = Object.fromEntries(
    Object.entries(mediaLookup).map(([id, m]) => [
      id,
      { src: m.src, alt: m.alt, caption: m.caption, credit: m.credit, width: m.width, height: m.height },
    ]),
  );
  const heroInsideColumn = locale !== "en";
  const heroFigure = hero ? (
    <figure className="mb-8 rounded bg-surface-container-lowest p-1 shadow-[0_1px_8px_rgba(11,19,32,0.04)] sm:p-2">
      <Image
        src={hero.src}
        alt={hero.alt}
        width={hero.width}
        height={hero.height}
        unoptimized={hero.src.endsWith(".svg")}
        className="h-auto max-h-[520px] w-full rounded object-cover"
        priority
      />
      {(hero.caption || hero.credit) && (
        <figcaption className="flex flex-col justify-between gap-1 px-1 pt-3 text-on-surface-variant sm:flex-row sm:items-baseline">
          <p className="text-sm italic">{hero.caption}</p>
          {hero.credit ? <span className="whitespace-nowrap font-mono-num text-xs text-outline">{hero.credit}</span> : null}
        </figcaption>
      )}
    </figure>
  ) : null;

  return (
    <main id="main" className="bg-surface" aria-label={tA("main")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-8">
        {preview ? (
          <p className="mb-4 font-ui text-sm text-error">{t("previewBanner")}</p>
        ) : (
          <ViewBeacon articleId={row.article.id} locale={locale} />
        )}
        {hrefs ? (
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <EditionBar locale={locale} hrefs={hrefs} />
            </div>
            <div className="mb-4 flex items-center gap-2 self-end md:self-auto">
              <FontSizeControls />
              <ShareBar url={url} />
            </div>
          </div>
        ) : (
          <div className="mb-4 flex justify-end">
            <ShareBar url={url} />
          </div>
        )}

        <header className="mb-6 flex max-w-4xl flex-col gap-3">
          <div className="flex items-center gap-2">
            {category ? (
              <Link
                href={`/category/${category.slug}`}
                className="rounded bg-surface-container-high px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary hover:underline"
              >
                {category.name}
              </Link>
            ) : null}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-primary md:text-5xl">
            {row.edition.title}
          </h1>
          {row.edition.dek ? (
            <p className="text-xl leading-relaxed text-on-surface-variant">{row.edition.dek}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded bg-surface-container-lowest p-3 text-sm shadow-[0_1px_8px_rgba(11,19,32,0.04)]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-ui text-on-surface">
              <span className="font-semibold text-primary">
                {authors.map((a, i) => (
                  <span key={a.id}>
                    {i > 0 ? " · " : null}
                    <Link href={`/author/${a.slug}`} className="hover:text-secondary hover:underline">
                      {a.name}
                    </Link>
                  </span>
                ))}
              </span>
              <time
                dateTime={row.edition.publishedAt?.toISOString()}
                className="font-mono-num text-on-surface-variant"
              >
                {date}
              </time>
              {showUpdated ? <span className="text-secondary">{t("updated")}</span> : null}
            </div>
            <span className="rounded bg-surface-container px-2 py-0.5 font-mono-num text-xs text-on-surface-variant">
              {t("minRead", { n: row.edition.readingTimeMin })}
              {row.edition.wordCount ? ` · ${row.edition.wordCount}` : ""}
            </span>
          </div>
        </header>

        {!heroInsideColumn ? heroFigure : null}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <article className="lg:col-span-8" id="article-narrative">
            {heroInsideColumn ? heroFigure : null}
            <div className="article-body text-on-surface" dir={dirOf(locale)} lang={htmlLangOf(locale)}>
              {renderEditionBody(row.edition.body, locale, mediaMap)}
            </div>
            <ul className="mt-8 flex flex-wrap gap-2 font-ui text-sm">
              {tags.map((tag) => (
                <li key={tag.id}>
                  <Link
                    href={`/tag/${tag.slug}`}
                    className="rounded-full bg-surface-container px-3 py-1 text-primary hover:bg-surface-container-high hover:text-secondary"
                  >
                    #{tag.name}
                  </Link>
                </li>
              ))}
            </ul>
            {authors.map((a) => (
              <section key={a.id} className="mt-8 border-t border-border-muted pt-4">
                <h2 className="font-display text-xl font-bold text-primary">
                  <Link href={`/author/${a.slug}`}>{a.name}</Link>
                </h2>
                {a.bio ? <p className="mt-1 text-on-surface-variant">{a.bio}</p> : null}
              </section>
            ))}
          </article>
          {related.length > 0 ? (
            <aside className="space-y-4 lg:col-span-4">
              <h2 className="border-b border-border-muted pb-2 font-ui text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {t("related")}
              </h2>
              <div className="space-y-4">
                {related.map((s) => (
                  <ArticleCard key={s.articleId} story={s} locale={locale} variant="related" />
                ))}
              </div>
            </aside>
          ) : null}
        </div>
        <p className="print-source mt-12 font-ui text-sm">
          {publisher} — {url}
        </p>
      </div>
    </main>
  );
}
