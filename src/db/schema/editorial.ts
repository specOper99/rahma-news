import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

export const localeEnum = pgEnum("locale", ["en", "ar", "ckb"]);
export const editionStatusEnum = pgEnum("edition_status", [
  "draft",
  "in_review",
  "scheduled",
  "published",
  "archived",
]);
export const staffRoleEnum = pgEnum("staff_role", [
  "owner",
  "admin",
  "editor",
  "author",
]);
export const redirectTypeEnum = pgEnum("redirect_type", ["301", "302"]);
export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "publish",
  "unpublish",
  "archive",
  "schedule",
  "login",
  "user_create",
  "settings",
  "media_upload",
  "redirect",
]);

export const staffProfiles = pgTable("staff_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  role: staffRoleEnum("role").notNull().default("author"),
  displayName: text("display_name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  storageKey: text("storage_key").notNull().unique(),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  width: integer("width"),
  height: integer("height"),
  blurDataUrl: text("blur_data_url"),
  uploadedBy: text("uploaded_by").references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mediaTranslations = pgTable(
  "media_translations",
  {
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    alt: text("alt").notNull(),
    caption: text("caption").notNull().default(""),
    credit: text("credit").notNull().default(""),
  },
  (t) => [primaryKey({ columns: [t.mediaId, t.locale] })],
);

export const authors = pgTable("authors", {
  id: text("id").primaryKey(),
  userId: text("user_id").unique().references(() => user.id),
  slug: text("slug").notNull().unique(),
  photoMediaId: text("photo_media_id").references(() => media.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const authorTranslations = pgTable(
  "author_translations",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    bio: text("bio").notNull().default(""),
  },
  (t) => [
    unique("author_tr_author_locale").on(t.authorId, t.locale),
    unique("author_tr_locale_slug").on(t.locale, t.slug),
  ],
);

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  parentId: text("parent_id"),
  position: integer("position").notNull().default(0),
  color: text("color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categoryTranslations = pgTable(
  "category_translations",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
  },
  (t) => [
    unique("cat_tr_category_locale").on(t.categoryId, t.locale),
    unique("cat_tr_locale_slug").on(t.locale, t.slug),
  ],
);

export const tags = pgTable("tags", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tagTranslations = pgTable(
  "tag_translations",
  {
    id: text("id").primaryKey(),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
  },
  (t) => [
    unique("tag_tr_tag_locale").on(t.tagId, t.locale),
    unique("tag_tr_locale_slug").on(t.locale, t.slug),
  ],
);

export const articles = pgTable(
  "articles",
  {
    id: text("id").primaryKey(),
    primaryCategoryId: text("primary_category_id")
      .notNull()
      .references(() => categories.id),
    heroMediaId: text("hero_media_id").references(() => media.id),
    ogMediaId: text("og_media_id").references(() => media.id),
    isBreaking: boolean("is_breaking").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    featuredRank: integer("featured_rank"),
    createdBy: text("created_by").references(() => user.id),
    updatedBy: text("updated_by").references(() => user.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("articles_featured_rank_uidx")
      .on(t.featuredRank)
      .where(sql`${t.featuredRank} is not null`),
  ],
);

export const articleAuthors = pgTable(
  "article_authors",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.authorId] })],
);

export const articleTags = pgTable(
  "article_tags",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.tagId] })],
);

export const articleTranslations = pgTable(
  "article_translations",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    dek: text("dek").notNull().default(""),
    body: jsonb("body").notNull(),
    bodyText: text("body_text").notNull().default(""),
    excerpt: text("excerpt").notNull().default(""),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalUrl: text("canonical_url"),
    status: editionStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    wordCount: integer("word_count").notNull().default(0),
    readingTimeMin: integer("reading_time_min").notNull().default(1),
  },
  (t) => [
    unique("edition_article_locale").on(t.articleId, t.locale),
    unique("edition_locale_slug").on(t.locale, t.slug),
    index("edition_locale_status_published_idx").on(
      t.locale,
      t.status,
      t.publishedAt,
    ),
  ],
);

export const articleViews = pgTable(
  "article_views",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    day: date("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.locale, t.day] })],
);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  locale: localeEnum("locale").notNull(),
  confirmed: boolean("confirmed").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

export const redirects = pgTable("redirects", {
  id: text("id").primaryKey(),
  fromPath: text("from_path").notNull().unique(),
  toPath: text("to_path").notNull(),
  type: redirectTypeEnum("type").notNull().default("301"),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  locales: jsonb("locales").notNull(),
  logoMediaId: text("logo_media_id").references(() => media.id),
  ogDefaultMediaId: text("og_default_media_id").references(() => media.id),
  social: jsonb("social").notNull().default({}),
  contactEmail: text("contact_email").notNull().default(""),
  homepageLayout: jsonb("homepage_layout").notNull(),
  analyticsId: text("analytics_id"),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => user.id),
    action: auditActionEnum("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export const contactMessages = pgTable("contact_messages", {
  id: text("id").primaryKey(),
  locale: localeEnum("locale").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
