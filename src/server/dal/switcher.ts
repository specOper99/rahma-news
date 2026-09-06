import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  articleTranslations,
  authorTranslations,
  categoryTranslations,
  tagTranslations,
} from "@/db/schema";
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/lib/locales";

export type SwitcherLink = {
  href: string;
  available: boolean;
  title?: string;
  status?: string;
};

function homes(): Record<Locale, SwitcherLink> {
  return {
    en: { href: "/en", available: true },
    ar: { href: "/ar", available: true },
    ckb: { href: "/ckb", available: true },
  };
}

function prefixSwap(rest: string): Record<Locale, SwitcherLink> {
  const path = rest === "/" ? "" : rest;
  return {
    en: { href: `/en${path}`, available: true },
    ar: { href: `/ar${path}`, available: true },
    ckb: { href: `/ckb${path}`, available: true },
  };
}

async function mapById(
  rows: { locale: string; slug: string }[],
  kind: "category" | "tag" | "author",
): Promise<Record<Locale, SwitcherLink>> {
  const byLoc = new Map(rows.map((r) => [r.locale, r.slug]));
  const out = homes();
  for (const l of LOCALES) {
    const slug = byLoc.get(l);
    if (slug) {
      out[l] = { href: `/${l}/${kind}/${slug}`, available: true };
    } else {
      out[l] = { href: `/${l}`, available: false };
    }
  }
  return out;
}

export async function resolveLanguageHrefs(pathname: string): Promise<Record<Locale, SwitcherLink>> {
  const match = pathname.match(/^\/(en|ar|ckb)(\/.*)?$/);
  const current = (match?.[1] && isLocale(match[1]) ? match[1] : DEFAULT_LOCALE) as Locale;
  const rest = match?.[2] && match[2].length > 0 ? match[2] : "/";

  const article = rest.match(/^\/article\/([^/]+)\/?$/);
  if (article) {
    const slug = decodeURIComponent(article[1]);
    const [row] = await db
      .select()
      .from(articleTranslations)
      .where(and(eq(articleTranslations.locale, current), eq(articleTranslations.slug, slug)))
      .limit(1);
    if (!row) return homes();
    const siblings = await db
      .select()
      .from(articleTranslations)
      .where(eq(articleTranslations.articleId, row.articleId));
    const now = new Date();
    const out = homes();
    for (const l of LOCALES) {
      const s = siblings.find((x) => x.locale === l);
      const live =
        !!s &&
        s.status === "published" &&
        !!s.publishedAt &&
        s.publishedAt <= now;
      out[l] = live
        ? { href: `/${l}/article/${s!.slug}`, available: true, title: s!.title, status: "published" }
        : {
            href: `/${l}`,
            available: false,
            title: s?.title,
            status: s?.status ?? "missing",
          };
    }
    return out;
  }

  const category = rest.match(/^\/category\/([^/]+)\/?$/);
  if (category) {
    const slug = decodeURIComponent(category[1]);
    const [row] = await db
      .select()
      .from(categoryTranslations)
      .where(and(eq(categoryTranslations.locale, current), eq(categoryTranslations.slug, slug)))
      .limit(1);
    if (!row) return homes();
    const all = await db
      .select()
      .from(categoryTranslations)
      .where(eq(categoryTranslations.categoryId, row.categoryId));
    return mapById(all, "category");
  }

  const tag = rest.match(/^\/tag\/([^/]+)\/?$/);
  if (tag) {
    const slug = decodeURIComponent(tag[1]);
    const [row] = await db
      .select()
      .from(tagTranslations)
      .where(and(eq(tagTranslations.locale, current), eq(tagTranslations.slug, slug)))
      .limit(1);
    if (!row) return homes();
    const all = await db
      .select()
      .from(tagTranslations)
      .where(eq(tagTranslations.tagId, row.tagId));
    return mapById(all, "tag");
  }

  const author = rest.match(/^\/author\/([^/]+)\/?$/);
  if (author) {
    const slug = decodeURIComponent(author[1]);
    const [row] = await db
      .select()
      .from(authorTranslations)
      .where(and(eq(authorTranslations.locale, current), eq(authorTranslations.slug, slug)))
      .limit(1);
    if (!row) return homes();
    const all = await db
      .select()
      .from(authorTranslations)
      .where(eq(authorTranslations.authorId, row.authorId));
    return mapById(all, "author");
  }

  return prefixSwap(rest);
}
