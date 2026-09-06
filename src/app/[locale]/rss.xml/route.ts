import { NextResponse } from "next/server";
import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { articleTranslations } from "@/db/schema";
import { isLocale } from "@/lib/locales";
import { siteUrl } from "@/lib/seo";
import { getSettings } from "@/server/dal/articles";
import { brandNameFromSettings } from "@/lib/brand";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ locale: string }> },
) {
  const { locale } = await ctx.params;
  if (!isLocale(locale)) return new NextResponse("not found", { status: 404 });
  const origin = siteUrl();
  const settings = await getSettings().catch(() => null);
  const title = brandNameFromSettings(settings, locale);
  const items = await db
    .select()
    .from(articleTranslations)
    .where(
      and(
        eq(articleTranslations.locale, locale),
        eq(articleTranslations.status, "published"),
        lte(articleTranslations.publishedAt, new Date()),
      ),
    )
    .orderBy(desc(articleTranslations.publishedAt))
    .limit(50);

  const rssItems = items
    .map((e) => {
      const link = `${origin}/${locale}/article/${e.slug}`;
      return `<item><title><![CDATA[${e.title}]]></title><link>${link}</link><guid isPermaLink="true">${link}</guid><description><![CDATA[${e.dek}]]></description><pubDate>${e.publishedAt?.toUTCString() ?? ""}</pubDate></item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${title}</title><link>${origin}/${locale}</link><language>${locale}</language>${rssItems}</channel></rss>`;
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
