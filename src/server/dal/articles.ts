import "server-only";
import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  articleAuthors,
  articleTags,
  articleTranslations,
  articleViews,
  articles,
  authorTranslations,
  authors,
  categories,
  categoryTranslations,
  contactMessages,
  media,
  mediaTranslations,
  newsletterSubscribers,
  siteSettings,
  tagTranslations,
  tags,
} from "@/db/schema";
import { isLocale, type Locale } from "@/lib/locales";

const published = (locale: Locale) =>
  and(
    eq(articleTranslations.locale, locale),
    eq(articleTranslations.status, "published"),
    lte(articleTranslations.publishedAt, new Date()),
  );

export async function promoteDueScheduled() {
  const now = new Date();
  await db
    .update(articleTranslations)
    .set({ status: "published" })
    .where(
      and(
        eq(articleTranslations.status, "scheduled"),
        lte(articleTranslations.publishedAt, now),
      ),
    );
}

export type CardStory = {
  articleId: string;
  slug: string;
  title: string;
  dek: string;
  publishedAt: Date | null;
  readingTimeMin: number;
  categoryName: string;
  categorySlug: string;
  heroSrc: string | null;
  heroAlt: string;
  isBreaking: boolean;
  isFeatured: boolean;
  featuredRank: number | null;
  updatedAt: Date;
  viewCount?: number;
};

async function hydrateCards(
  locale: Locale,
  rows: {
    articleId: string;
    slug: string;
    title: string;
    dek: string;
    publishedAt: Date | null;
    readingTimeMin: number;
    updatedAt: Date;
    primaryCategoryId: string;
    heroMediaId: string | null;
    isBreaking: boolean;
    isFeatured: boolean;
    featuredRank: number | null;
  }[],
): Promise<CardStory[]> {
  if (rows.length === 0) return [];
  const catIds = [...new Set(rows.map((r) => r.primaryCategoryId))];
  const mediaIds = rows.map((r) => r.heroMediaId).filter((x): x is string => !!x);
  const cats = await db
    .select()
    .from(categoryTranslations)
    .where(
      and(
        eq(categoryTranslations.locale, locale),
        inArray(categoryTranslations.categoryId, catIds),
      ),
    );
  const catMap = new Map(cats.map((c) => [c.categoryId, c]));
  const mediaRows =
    mediaIds.length > 0
      ? await db
          .select()
          .from(media)
          .leftJoin(
            mediaTranslations,
            and(
              eq(mediaTranslations.mediaId, media.id),
              eq(mediaTranslations.locale, locale),
            ),
          )
          .where(inArray(media.id, mediaIds))
      : [];
  const mediaMap = new Map(
    mediaRows.map((m) => [
      m.media.id,
      {
        src: m.media.storageKey,
        alt: m.media_translations?.alt ?? "",
      },
    ]),
  );
  return rows.map((r) => ({
    articleId: r.articleId,
    slug: r.slug,
    title: r.title,
    dek: r.dek,
    publishedAt: r.publishedAt,
    readingTimeMin: r.readingTimeMin,
    updatedAt: r.updatedAt,
    categoryName: catMap.get(r.primaryCategoryId)?.name ?? "",
    categorySlug: catMap.get(r.primaryCategoryId)?.slug ?? "",
    heroSrc: r.heroMediaId ? (mediaMap.get(r.heroMediaId)?.src ?? null) : null,
    heroAlt: r.heroMediaId ? (mediaMap.get(r.heroMediaId)?.alt ?? "") : "",
    isBreaking: r.isBreaking,
    isFeatured: r.isFeatured,
    featuredRank: r.featuredRank,
  }));
}

async function listPublished(
  locale: Locale,
  extra?: ReturnType<typeof and>,
  limit = 20,
  offset = 0,
) {
  const where = extra ? and(published(locale), extra) : published(locale);
  const rows = await db
    .select({
      articleId: articles.id,
      slug: articleTranslations.slug,
      title: articleTranslations.title,
      dek: articleTranslations.dek,
      publishedAt: articleTranslations.publishedAt,
      readingTimeMin: articleTranslations.readingTimeMin,
      updatedAt: articleTranslations.updatedAt,
      primaryCategoryId: articles.primaryCategoryId,
      heroMediaId: articles.heroMediaId,
      isBreaking: articles.isBreaking,
      isFeatured: articles.isFeatured,
      featuredRank: articles.featuredRank,
    })
    .from(articleTranslations)
    .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
    .where(where)
    .orderBy(desc(articleTranslations.publishedAt))
    .limit(limit)
    .offset(offset);
  return hydrateCards(locale, rows);
}

export async function getNavCategories(locale: Locale) {
  return db
    .select({
      id: categories.id,
      slug: categoryTranslations.slug,
      name: categoryTranslations.name,
      position: categories.position,
    })
    .from(categoryTranslations)
    .innerJoin(categories, eq(categories.id, categoryTranslations.categoryId))
    .where(eq(categoryTranslations.locale, locale))
    .orderBy(categories.position);
}

export async function getSettings() {
  const [row] = await db.select().from(siteSettings).limit(1);
  return row;
}

async function resolveRailCategory(token: string, locale: Locale) {
  const [byId] = await db
    .select()
    .from(categoryTranslations)
    .where(
      and(eq(categoryTranslations.categoryId, token), eq(categoryTranslations.locale, locale)),
    )
    .limit(1);
  if (byId) return byId;
  const [bySlug] = await db
    .select()
    .from(categoryTranslations)
    .where(and(eq(categoryTranslations.slug, token), eq(categoryTranslations.locale, "en")))
    .limit(1);
  if (!bySlug) return null;
  if (locale === "en") return bySlug;
  const [localized] = await db
    .select()
    .from(categoryTranslations)
    .where(
      and(
        eq(categoryTranslations.categoryId, bySlug.categoryId),
        eq(categoryTranslations.locale, locale),
      ),
    )
    .limit(1);
  return localized ?? null;
}

export async function getHomepageBundle(locale: Locale) {
  await promoteDueScheduled();
  const breaking = await listPublished(
    locale,
    eq(articles.isBreaking, true),
    3,
  );
  const featuredRows = await db
    .select({
      articleId: articles.id,
      slug: articleTranslations.slug,
      title: articleTranslations.title,
      dek: articleTranslations.dek,
      publishedAt: articleTranslations.publishedAt,
      readingTimeMin: articleTranslations.readingTimeMin,
      updatedAt: articleTranslations.updatedAt,
      primaryCategoryId: articles.primaryCategoryId,
      heroMediaId: articles.heroMediaId,
      isBreaking: articles.isBreaking,
      isFeatured: articles.isFeatured,
      featuredRank: articles.featuredRank,
    })
    .from(articleTranslations)
    .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
    .where(and(published(locale), eq(articles.isFeatured, true)))
    .orderBy(articles.featuredRank)
    .limit(6);
  const featured = await hydrateCards(locale, featuredRows);
  const used = new Set([...breaking, ...featured].map((s) => s.articleId));
  const settings = await getSettings();
  const layout = (settings?.homepageLayout as { rails?: string[] } | null) ?? {};
  const railIds = layout.rails ?? [];
  const rails: { categoryId: string; name: string; slug: string; stories: CardStory[] }[] =
    [];
  for (const token of railIds) {
    const cat = await resolveRailCategory(token, locale);
    if (!cat) continue;
    const stories = (
      await listPublished(locale, eq(articles.primaryCategoryId, cat.categoryId), 8)
    ).filter((s) => !used.has(s.articleId)).slice(0, 4);
    stories.forEach((s) => used.add(s.articleId));
    rails.push({
      categoryId: cat.categoryId,
      name: cat.name,
      slug: cat.slug,
      stories,
    });
  }
  const river = (await listPublished(locale, undefined, 40)).filter(
    (s) => !used.has(s.articleId),
  ).slice(0, 12);
  river.forEach((s) => used.add(s.articleId));
  const mostRead = await getMostRead(locale, 2, 5);
  return { breaking, featured, rails, river, mostRead };
}

export async function getMostRead(locale: Locale, days: number, limit: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);
  const rows = await db
    .select({
      articleId: articleViews.articleId,
      count: sql<number>`sum(${articleViews.count})`.as("count"),
    })
    .from(articleViews)
    .where(
      and(
        eq(articleViews.locale, locale),
        sql`${articleViews.day} >= ${sinceStr}`,
      ),
    )
    .groupBy(articleViews.articleId)
    .orderBy(desc(sql`sum(${articleViews.count})`))
    .limit(limit);
  if (rows.length === 0) return [] as CardStory[];
  const ids = rows.map((r) => r.articleId);
  const cards = await listPublished(
    locale,
    inArray(articles.id, ids),
    limit,
  );
  const order = new Map(ids.map((id, i) => [id, i]));
  const views = new Map(rows.map((r) => [r.articleId, Number(r.count)]));
  return cards
    .sort((a, b) => (order.get(a.articleId) ?? 99) - (order.get(b.articleId) ?? 99))
    .map((c) => ({ ...c, viewCount: views.get(c.articleId) ?? 0 }));
}

export async function getLatest(locale: Locale, page: number, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  const stories = await listPublished(locale, undefined, pageSize + 1, offset);
  const hasNext = stories.length > pageSize;
  return { stories: stories.slice(0, pageSize), hasNext };
}

export async function getByCategory(
  locale: Locale,
  categorySlug: string,
  page: number,
) {
  const [cat] = await db
    .select()
    .from(categoryTranslations)
    .where(
      and(
        eq(categoryTranslations.locale, locale),
        eq(categoryTranslations.slug, categorySlug),
      ),
    )
    .limit(1);
  if (!cat) return null;
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const stories = await listPublished(
    locale,
    eq(articles.primaryCategoryId, cat.categoryId),
    pageSize + 1,
    offset,
  );
  return {
    category: cat,
    stories: stories.slice(0, pageSize),
    hasNext: stories.length > pageSize,
  };
}

export async function getByTag(locale: Locale, tagSlug: string, page: number) {
  const [tag] = await db
    .select()
    .from(tagTranslations)
    .where(
      and(eq(tagTranslations.locale, locale), eq(tagTranslations.slug, tagSlug)),
    )
    .limit(1);
  if (!tag) return null;
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const linked = await db
    .select({ articleId: articleTags.articleId })
    .from(articleTags)
    .where(eq(articleTags.tagId, tag.tagId));
  const ids = linked.map((l) => l.articleId);
  if (ids.length === 0) {
    return { tag, stories: [] as CardStory[], hasNext: false };
  }
  const stories = await listPublished(
    locale,
    inArray(articles.id, ids),
    pageSize + 1,
    offset,
  );
  return {
    tag,
    stories: stories.slice(0, pageSize),
    hasNext: stories.length > pageSize,
  };
}

export async function getByAuthor(
  locale: Locale,
  authorSlug: string,
  page: number,
) {
  const [auth] = await db
    .select()
    .from(authorTranslations)
    .innerJoin(authors, eq(authors.id, authorTranslations.authorId))
    .where(
      and(
        eq(authorTranslations.locale, locale),
        eq(authorTranslations.slug, authorSlug),
      ),
    )
    .limit(1);
  if (!auth) return null;
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const linked = await db
    .select({ articleId: articleAuthors.articleId })
    .from(articleAuthors)
    .where(eq(articleAuthors.authorId, auth.authors.id));
  const ids = linked.map((l) => l.articleId);
  const stories =
    ids.length === 0
      ? []
      : await listPublished(locale, inArray(articles.id, ids), pageSize + 1, offset);
  const translations = await db
    .select({
      locale: authorTranslations.locale,
      slug: authorTranslations.slug,
      name: authorTranslations.name,
    })
    .from(authorTranslations)
    .where(eq(authorTranslations.authorId, auth.authors.id));
  return {
    author: auth.author_translations,
    photo: auth.authors.photoMediaId,
    translations,
    storyCount: ids.length,
    stories: stories.slice(0, pageSize),
    hasNext: stories.length > pageSize,
  };
}

export async function searchEditions(locale: Locale, q: string, page: number) {
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const trimmed = q.trim();
  const ts = sql`websearch_to_tsquery('simple', ${trimmed})`;
  const rows = await db
    .select({
      articleId: articles.id,
      slug: articleTranslations.slug,
      title: articleTranslations.title,
      dek: articleTranslations.dek,
      publishedAt: articleTranslations.publishedAt,
      readingTimeMin: articleTranslations.readingTimeMin,
      updatedAt: articleTranslations.updatedAt,
      primaryCategoryId: articles.primaryCategoryId,
      heroMediaId: articles.heroMediaId,
      isBreaking: articles.isBreaking,
      isFeatured: articles.isFeatured,
      featuredRank: articles.featuredRank,
    })
    .from(articleTranslations)
    .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
    .where(
      and(
        published(locale),
        sql`article_translations.search_vector @@ ${ts}`,
      ),
    )
    .orderBy(desc(sql`ts_rank(article_translations.search_vector, ${ts})`))
    .limit(pageSize + 1)
    .offset(offset);
  const stories = await hydrateCards(locale, rows);
  return { stories: stories.slice(0, pageSize), hasNext: stories.length > pageSize };
}

export async function getPublishedEditionBySlug(locale: Locale, slug: string) {
  await promoteDueScheduled();
  const [row] = await db
    .select()
    .from(articleTranslations)
    .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
    .where(and(eq(articleTranslations.locale, locale), eq(articleTranslations.slug, slug)))
    .limit(1);
  if (!row) return null;
  const edition = row.article_translations;
  const isLive =
    edition.status === "published" &&
    edition.publishedAt &&
    edition.publishedAt <= new Date();
  return { edition, article: row.articles, isLive };
}

export async function getEditionSiblings(articleId: string) {
  return db
    .select()
    .from(articleTranslations)
    .where(eq(articleTranslations.articleId, articleId));
}

export async function getRelated(
  locale: Locale,
  articleId: string,
  categoryId: string,
  limit = 4,
) {
  const stories = await listPublished(
    locale,
    and(eq(articles.primaryCategoryId, categoryId), sql`${articles.id} <> ${articleId}`),
    limit,
  );
  return stories;
}

export async function getArticleAuthors(articleId: string, locale: Locale) {
  const rows = await db
    .select()
    .from(articleAuthors)
    .innerJoin(authors, eq(authors.id, articleAuthors.authorId))
    .innerJoin(
      authorTranslations,
      and(
        eq(authorTranslations.authorId, authors.id),
        eq(authorTranslations.locale, locale),
      ),
    )
    .where(eq(articleAuthors.articleId, articleId))
    .orderBy(articleAuthors.position);
  return rows.map((r) => ({
    id: r.authors.id,
    slug: r.author_translations.slug,
    name: r.author_translations.name,
    bio: r.author_translations.bio,
  }));
}

export async function getArticleTags(articleId: string, locale: Locale) {
  const rows = await db
    .select()
    .from(articleTags)
    .innerJoin(
      tagTranslations,
      and(
        eq(tagTranslations.tagId, articleTags.tagId),
        eq(tagTranslations.locale, locale),
      ),
    )
    .where(eq(articleTags.articleId, articleId));
  return rows.map((r) => r.tag_translations);
}

export async function getMediaForLocale(mediaId: string | null, locale: Locale) {
  if (!mediaId) return null;
  const map = await getMediaByIds([mediaId], locale);
  return map[mediaId] ?? null;
}

export async function getMediaByIds(ids: string[], locale: Locale) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const rows = await db
    .select()
    .from(media)
    .leftJoin(
      mediaTranslations,
      and(eq(mediaTranslations.mediaId, media.id), eq(mediaTranslations.locale, locale)),
    )
    .where(inArray(media.id, unique));
  const out: Record<
    string,
    {
      id: string;
      src: string;
      width: number;
      height: number;
      blur: string | null;
      alt: string;
      caption: string;
      credit: string;
    }
  > = {};
  for (const row of rows) {
    out[row.media.id] = {
      id: row.media.id,
      src: row.media.storageKey,
      width: row.media.width ?? 1600,
      height: row.media.height ?? 900,
      blur: row.media.blurDataUrl,
      alt: row.media_translations?.alt ?? "",
      caption: row.media_translations?.caption ?? "",
      credit: row.media_translations?.credit ?? "",
    };
  }
  return out;
}

export async function listAdminArticles() {
  const editions = await db
    .select()
    .from(articleTranslations)
    .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
    .orderBy(desc(articles.updatedAt));
  const byArticle = new Map<
    string,
    { article: typeof articles.$inferSelect; editions: (typeof articleTranslations.$inferSelect)[] }
  >();
  for (const row of editions) {
    const cur = byArticle.get(row.articles.id);
    if (!cur) {
      byArticle.set(row.articles.id, {
        article: row.articles,
        editions: [row.article_translations],
      });
    } else {
      cur.editions.push(row.article_translations);
    }
  }
  const rows = [...byArticle.values()];
  const ids = rows.map((r) => r.article.id);
  const catIds = [...new Set(rows.map((r) => r.article.primaryCategoryId))];
  const catTr =
    catIds.length > 0
      ? await db.select().from(categoryTranslations).where(inArray(categoryTranslations.categoryId, catIds))
      : [];
  const authorLinks =
    ids.length > 0 ? await db.select().from(articleAuthors).where(inArray(articleAuthors.articleId, ids)) : [];
  const authorIds = [...new Set(authorLinks.map((a) => a.authorId))];
  const authorTr =
    authorIds.length > 0
      ? await db.select().from(authorTranslations).where(inArray(authorTranslations.authorId, authorIds))
      : [];
  return rows.map((row) => {
    const sectionName =
      catTr.find((c) => c.categoryId === row.article.primaryCategoryId && c.locale === "en")?.name ??
      catTr.find((c) => c.categoryId === row.article.primaryCategoryId)?.name ??
      "";
    const leadId = authorLinks
      .filter((a) => a.articleId === row.article.id)
      .sort((a, b) => a.position - b.position)[0]?.authorId;
    const leadAuthor = leadId
      ? (authorTr.find((t) => t.authorId === leadId && t.locale === "en")?.name ??
        authorTr.find((t) => t.authorId === leadId)?.name ??
        "")
      : "";
    return { ...row, sectionName, leadAuthor };
  });
}

export async function getArticleAdmin(id: string) {
  const [article] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!article) return null;
  const editions = await db
    .select()
    .from(articleTranslations)
    .where(eq(articleTranslations.articleId, id));
  const authorRows = await db
    .select()
    .from(articleAuthors)
    .where(eq(articleAuthors.articleId, id));
  const tagRows = await db
    .select()
    .from(articleTags)
    .where(eq(articleTags.articleId, id));
  return { article, editions, authorIds: authorRows.map((a) => a.authorId), tagIds: tagRows.map((t) => t.tagId) };
}

export async function listCategoriesAdmin() {
  const cats = await db.select().from(categories).orderBy(categories.position);
  const tr = await db.select().from(categoryTranslations);
  return cats.map((c) => ({
    ...c,
    translations: tr.filter((t) => t.categoryId === c.id),
  }));
}

export async function listTagsAdmin() {
  const all = await db.select().from(tags);
  const tr = await db.select().from(tagTranslations);
  return all.map((t) => ({ ...t, translations: tr.filter((x) => x.tagId === t.id) }));
}

export async function listAuthorsAdmin() {
  const all = await db.select().from(authors);
  const tr = await db.select().from(authorTranslations);
  return all.map((a) => ({ ...a, translations: tr.filter((x) => x.authorId === a.id) }));
}

export async function listMediaAdmin() {
  const items = await db.select().from(media).orderBy(desc(media.createdAt));
  const tr = await db.select().from(mediaTranslations);
  return items.map((m) => ({
    ...m,
    translations: tr.filter((t) => t.mediaId === m.id),
  }));
}

export async function getTranslationCoverage() {
  const all = await listAdminArticles();
  return all.map((row) => ({
    id: row.article.id,
    editions: row.editions.map((e) => ({
      locale: e.locale,
      status: e.status,
      title: e.title,
    })),
  }));
}

export async function getLiveLocaleCounts(): Promise<Record<Locale, number>> {
  const rows = await db
    .select({
      locale: articleTranslations.locale,
      n: count(),
    })
    .from(articleTranslations)
    .where(
      and(
        eq(articleTranslations.status, "published"),
        lte(articleTranslations.publishedAt, new Date()),
      ),
    )
    .groupBy(articleTranslations.locale);
  const out: Record<Locale, number> = { en: 0, ar: 0, ckb: 0 };
  for (const row of rows) {
    if (isLocale(row.locale)) out[row.locale] = Number(row.n);
  }
  return out;
}

export async function getNavTags(locale: Locale, limit = 8) {
  return db
    .select({
      id: tags.id,
      slug: tagTranslations.slug,
      name: tagTranslations.name,
    })
    .from(tagTranslations)
    .innerJoin(tags, eq(tags.id, tagTranslations.tagId))
    .where(eq(tagTranslations.locale, locale))
    .limit(limit);
}

export async function getDeskBadges() {
  const [review] = await db
    .select({ n: count() })
    .from(articleTranslations)
    .where(eq(articleTranslations.status, "in_review"));
  const [breaking] = await db
    .select({ n: count() })
    .from(articles)
    .where(eq(articles.isBreaking, true));
  const [inbox] = await db.select({ n: count() }).from(contactMessages);
  const [subs] = await db
    .select({ n: count() })
    .from(newsletterSubscribers)
    .where(isNull(newsletterSubscribers.unsubscribedAt));
  return {
    review: Number(review?.n ?? 0),
    breaking: Number(breaking?.n ?? 0),
    inbox: Number(inbox?.n ?? 0),
    subscribers: Number(subs?.n ?? 0),
  };
}

export async function incrementView(articleId: string, locale: Locale) {
  const day = new Date().toISOString().slice(0, 10);
  await db
    .insert(articleViews)
    .values({ articleId, locale, day, count: 1 })
    .onConflictDoUpdate({
      target: [articleViews.articleId, articleViews.locale, articleViews.day],
      set: { count: sql`${articleViews.count} + 1` },
    });
}
