import { NextResponse } from "next/server";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { articleTranslations, articles } from "@/db/schema";
import { hreflangOf, isLocale, LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/locales";
import { siteUrl } from "@/lib/seo";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ locale: string }> },
) {
  const { locale } = await ctx.params;
  if (!isLocale(locale)) {
    return new NextResponse("not found", { status: 404 });
  }
  const origin = siteUrl();
  const rows = await db
    .select()
    .from(articleTranslations)
    .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
    .where(
      and(
        eq(articleTranslations.locale, locale),
        eq(articleTranslations.status, "published"),
        lte(articleTranslations.publishedAt, new Date()),
      ),
    );

  const allLive = await db
    .select()
    .from(articleTranslations)
    .where(
      and(
        eq(articleTranslations.status, "published"),
        lte(articleTranslations.publishedAt, new Date()),
      ),
    );

  const byArticle = new Map<string, typeof allLive>();
  for (const e of allLive) {
    const list = byArticle.get(e.articleId) ?? [];
    list.push(e);
    byArticle.set(e.articleId, list);
  }

  const urls = rows
    .map((row) => {
      const loc = `${origin}/${locale}/article/${row.article_translations.slug}`;
      const siblings = byArticle.get(row.articles.id) ?? [];
      const links = siblings
        .map(
          (s) =>
            `<xhtml:link rel="alternate" hreflang="${hreflangOf(s.locale as Locale)}" href="${origin}/${s.locale}/article/${s.slug}"/>`,
        )
        .join("");
      const ar = siblings.find((s) => s.locale === DEFAULT_LOCALE);
      const xDef = ar
        ? `${origin}/${DEFAULT_LOCALE}/article/${ar.slug}`
        : loc;
      return `<url><loc>${loc}</loc><lastmod>${row.article_translations.updatedAt.toISOString()}</lastmod>${links}<xhtml:link rel="alternate" hreflang="x-default" href="${xDef}"/></url>`;
    })
    .join("");

  const homes = LOCALES.map(
    (l) =>
      `<xhtml:link rel="alternate" hreflang="${hreflangOf(l)}" href="${origin}/${l}"/>`,
  ).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<url><loc>${origin}/${locale}</loc>${homes}<xhtml:link rel="alternate" hreflang="x-default" href="${origin}/${DEFAULT_LOCALE}"/></url>
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
