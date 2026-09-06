import { NextResponse } from "next/server";
import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { articleTranslations, articles, categoryTranslations } from "@/db/schema";
import { isLocale } from "@/lib/locales";
import { siteUrl } from "@/lib/seo";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await ctx.params;
  if (!isLocale(locale)) return new NextResponse("not found", { status: 404 });
  const [cat] = await db
    .select()
    .from(categoryTranslations)
    .where(and(eq(categoryTranslations.locale, locale), eq(categoryTranslations.slug, slug)))
    .limit(1);
  if (!cat) return new NextResponse("not found", { status: 404 });
  const origin = siteUrl();
  const items = await db
    .select()
    .from(articleTranslations)
    .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
    .where(
      and(
        eq(articleTranslations.locale, locale),
        eq(articleTranslations.status, "published"),
        lte(articleTranslations.publishedAt, new Date()),
        eq(articles.primaryCategoryId, cat.categoryId),
      ),
    )
    .orderBy(desc(articleTranslations.publishedAt))
    .limit(50);
  const rssItems = items
    .map((row) => {
      const e = row.article_translations;
      const link = `${origin}/${locale}/article/${e.slug}`;
      return `<item><title><![CDATA[${e.title}]]></title><link>${link}</link><guid isPermaLink="true">${link}</guid></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>${cat.name}</title><language>${locale}</language>${rssItems}</channel></rss>`;
  return new NextResponse(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
