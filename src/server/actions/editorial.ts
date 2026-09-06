"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  articleAuthors,
  articleTags,
  articleTranslations,
  articles,
  auditLog,
  authorTranslations,
  authors,
  categories,
  categoryTranslations,
  media,
  mediaTranslations,
  redirects,
  siteSettings,
  staffProfiles,
  tagTranslations,
  tags,
  user,
  account,
} from "@/db/schema";
import { newId } from "@/lib/ids";
import { isLocale, type Locale } from "@/lib/locales";
import { readingTime } from "@/lib/reading-time";
import { draftSlug, isPlaceholderSlug, isValidSlug, slugify, uploadBasename } from "@/lib/slug";
import { emptyDoc, plainText, walkRejectsXss, type TipTapNode } from "@/lib/tiptap/schema";
import { canManageSettings, canManageUsers, canPublish, requireStaff } from "@/server/auth";
import { auth } from "@/auth";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

function revalidatePublic() {
  revalidatePath("/", "layout");
}

type StoredImage = { ok: true; id: string; src: string };
type StoredImageErr = { ok: false; code: "MEDIA_TYPE" | "MEDIA_TOO_LARGE" };

async function persistImageFile(
  staffUserId: string,
  file: File,
  copy: { alt?: string; caption?: string; credit?: string } = {},
): Promise<StoredImage | StoredImageErr> {
  if (file.size > 12_582_912) return { ok: false, code: "MEDIA_TOO_LARGE" };
  const mime = file.type;
  if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(mime)) {
    return { ok: false, code: "MEDIA_TYPE" };
  }
  const id = newId();
  const ext = mime.split("/")[1] === "jpeg" ? "jpg" : mime.split("/")[1];
  const fileName = `${uploadBasename(file.name)}-${Date.now().toString(36)}.${ext}`;
  const rel = `/uploads/${fileName}`;
  const dest = path.join(process.cwd(), "storage", "uploads", fileName);
  await mkdir(path.dirname(dest), { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, buf);
  let width: number | null = null;
  let height: number | null = null;
  let blurDataUrl: string | null = null;
  try {
    const meta = await sharp(buf).metadata();
    width = meta.width ?? null;
    height = meta.height ?? null;
    const blur = await sharp(buf).resize(16).webp({ quality: 40 }).toBuffer();
    blurDataUrl = `data:image/webp;base64,${blur.toString("base64")}`;
  } catch {
    /* keep null dimensions */
  }
  await db.insert(media).values({
    id,
    storageKey: rel,
    mime,
    bytes: file.size,
    width,
    height,
    blurDataUrl,
    uploadedBy: staffUserId,
  });
  const alt = copy.alt?.trim() || "Image";
  const caption = copy.caption ?? "";
  const credit = copy.credit ?? "";
  for (const locale of ["en", "ar", "ckb"] as Locale[]) {
    await db.insert(mediaTranslations).values({ mediaId: id, locale, alt, caption, credit });
  }
  await audit(staffUserId, "media_upload", "media", id);
  revalidatePath("/admin/media");
  return { ok: true, id, src: rel };
}

async function uniqueEditionSlug(locale: Locale, desired: string, exceptId?: string) {
  let candidate = desired;
  let n = 2;
  for (;;) {
    const [hit] = await db
      .select({ id: articleTranslations.id })
      .from(articleTranslations)
      .where(and(eq(articleTranslations.locale, locale), eq(articleTranslations.slug, candidate)))
      .limit(1);
    if (!hit || hit.id === exceptId) return candidate;
    candidate = `${desired}-${n}`;
    n += 1;
  }
}

async function audit(
  actorUserId: string,
  action: "create" | "update" | "publish" | "unpublish" | "archive" | "schedule" | "user_create" | "settings" | "media_upload" | "redirect",
  entityType: string,
  entityId: string,
  meta?: unknown,
) {
  await db.insert(auditLog).values({
    id: newId(),
    actorUserId,
    action,
    entityType,
    entityId,
    meta: meta ?? null,
  });
}

export async function createArticleAction() {
  const staff = await requireStaff();
  const cats = await db.select().from(categories).limit(1);
  if (!cats[0]) return { ok: false as const, code: "VALIDATION", message: "No categories" };
  const id = newId();
  const editionId = newId();
  await db.transaction(async (tx) => {
    await tx.insert(articles).values({
      id,
      primaryCategoryId: cats[0].id,
      createdBy: staff.userId,
      updatedBy: staff.userId,
    });
    await tx.insert(articleTranslations).values({
      id: editionId,
      articleId: id,
      locale: "en",
      slug: draftSlug("en"),
      title: "Untitled",
      body: emptyDoc(),
      status: "draft",
    });
  });
  await audit(staff.userId, "create", "article", id);
  revalidatePublic();
  return { ok: true as const, id };
}

export async function saveEditionFormAction(formData: FormData) {
  const articleId = String(formData.get("articleId"));
  const locale = String(formData.get("locale"));
  const res = await upsertEditionAction(formData);
  if (!res.ok) {
    redirect(`/admin/articles/${articleId}?locale=${locale}&err=${res.code}`);
  }
  redirect(`/admin/articles/${articleId}?locale=${locale}&saved=1`);
}

export async function upsertEditionAction(formData: FormData) {
  const staff = await requireStaff();
  const articleId = String(formData.get("articleId"));
  const locale = String(formData.get("locale"));
  if (!isLocale(locale)) return { ok: false as const, code: "VALIDATION" };
  const title = String(formData.get("title") ?? "").trim();
  const dek = String(formData.get("dek") ?? "");
  const submittedSlug = String(formData.get("slug") ?? "").trim();
  const fromTitle = slugify(title, locale);
  const slugBase =
    submittedSlug && !isPlaceholderSlug(submittedSlug)
      ? submittedSlug
      : fromTitle && fromTitle !== "untitled"
        ? fromTitle
        : submittedSlug || draftSlug(locale);
  const bodyJson = String(formData.get("body") ?? "{}");
  let body: TipTapNode;
  try {
    body = JSON.parse(bodyJson) as TipTapNode;
  } catch {
    return { ok: false as const, code: "VALIDATION" };
  }
  const xss = walkRejectsXss(body);
  if (xss) return { ok: false as const, code: "VALIDATION", message: xss };
  const text = plainText(body);
  const rt = readingTime(text, locale);
  const seoTitle = String(formData.get("seoTitle") ?? "") || null;
  const seoDescription = String(formData.get("seoDescription") ?? "") || null;
  const canonicalUrl = String(formData.get("canonicalUrl") ?? "") || null;
  const expected = String(formData.get("expectedUpdatedAt") ?? "");

  const [existing] = await db
    .select()
    .from(articleTranslations)
    .where(
      and(eq(articleTranslations.articleId, articleId), eq(articleTranslations.locale, locale)),
    )
    .limit(1);

  if (existing && expected && existing.updatedAt.toISOString() !== expected) {
    return { ok: false as const, code: "STALE_WRITE" };
  }

  if (existing?.status === "published" && staff.role === "author") {
    return { ok: false as const, code: "FORBIDDEN" };
  }

  const slugRaw = await uniqueEditionSlug(locale, slugBase, existing?.id);
  if (!isValidSlug(slugRaw, locale)) return { ok: false as const, code: "RESERVED_SLUG" };

  const now = new Date();
  if (existing) {
    if (existing.slug !== slugRaw && existing.status === "published") {
      await db.insert(redirects).values({
        id: newId(),
        fromPath: `/${locale}/article/${existing.slug}`,
        toPath: `/${locale}/article/${slugRaw}`,
        type: "301",
      });
    }
    await db
      .update(articleTranslations)
      .set({
        title,
        dek,
        slug: slugRaw,
        body,
        bodyText: text,
        seoTitle,
        seoDescription,
        canonicalUrl,
        wordCount: rt.wordCount,
        readingTimeMin: rt.readingTimeMin,
        updatedAt: now,
      })
      .where(eq(articleTranslations.id, existing.id));
  } else {
    await db.insert(articleTranslations).values({
      id: newId(),
      articleId,
      locale,
      title,
      dek,
      slug: slugRaw,
      body,
      bodyText: text,
      seoTitle,
      seoDescription,
      canonicalUrl,
      wordCount: rt.wordCount,
      readingTimeMin: rt.readingTimeMin,
      status: "draft",
    });
  }

  const categoryId = String(formData.get("categoryId") ?? "");
  let heroMediaId = String(formData.get("heroMediaId") ?? "") || null;
  if (formData.get("clearHero") === "on") heroMediaId = null;
  const heroFile = formData.get("heroFile");
  if (heroFile instanceof File && heroFile.size > 0) {
    const stored = await persistImageFile(staff.userId, heroFile, {
      alt: String(formData.get("heroAlt") ?? title) || title,
      caption: String(formData.get("heroCaption") ?? ""),
      credit: String(formData.get("heroCredit") ?? ""),
    });
    if (!stored.ok) return stored;
    heroMediaId = stored.id;
  }
  const isBreaking = formData.get("isBreaking") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  const rankRaw = String(formData.get("featuredRank") ?? "");
  const featuredRank = rankRaw ? Number(rankRaw) : null;
  if (categoryId) {
    if (featuredRank != null) {
      await db
        .update(articles)
        .set({ featuredRank: null })
        .where(eq(articles.featuredRank, featuredRank));
    }
    await db
      .update(articles)
      .set({
        primaryCategoryId: categoryId,
        heroMediaId,
        isBreaking,
        isFeatured,
        featuredRank: isFeatured ? featuredRank : null,
        updatedBy: staff.userId,
        updatedAt: now,
      })
      .where(eq(articles.id, articleId));
  }
  const authorIds = formData
    .getAll("authorIds")
    .flatMap((v) => String(v).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
  const tagIds = formData
    .getAll("tagIds")
    .flatMap((v) => String(v).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
  await db.delete(articleAuthors).where(eq(articleAuthors.articleId, articleId));
  if (authorIds.length) {
    await db.insert(articleAuthors).values(
      authorIds.map((authorId, position) => ({ articleId, authorId, position })),
    );
  }
  await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
  if (tagIds.length) {
    await db.insert(articleTags).values(tagIds.map((tagId) => ({ articleId, tagId })));
  }
  await audit(staff.userId, "update", "edition", `${articleId}:${locale}`);
  revalidatePublic();
  return { ok: true as const };
}

export async function setEditionStatusAction(formData: FormData) {
  const staff = await requireStaff();
  const articleId = String(formData.get("articleId"));
  const locale = String(formData.get("locale"));
  const next = String(formData.get("status"));
  if (!isLocale(locale)) return { ok: false as const, code: "VALIDATION" };
  if (["published", "scheduled", "archived"].includes(next) && !canPublish(staff.role)) {
    return { ok: false as const, code: "FORBIDDEN" };
  }
  if (next === "published" && staff.role === "author") {
    return { ok: false as const, code: "FORBIDDEN" };
  }
  const [ed] = await db
    .select()
    .from(articleTranslations)
    .where(
      and(eq(articleTranslations.articleId, articleId), eq(articleTranslations.locale, locale)),
    )
    .limit(1);
  if (!ed) return { ok: false as const, code: "NOT_FOUND" };
  if (next === "published") {
    if (!ed.title.trim() || ed.title === "Untitled") {
      return { ok: false as const, code: "PUBLISH_INCOMPLETE" };
    }
  }
  const publishedAt =
    next === "scheduled"
      ? new Date(String(formData.get("publishedAt")))
      : next === "published"
        ? ed.publishedAt ?? new Date()
        : ed.publishedAt;
  await db
    .update(articleTranslations)
    .set({
      status: next as typeof ed.status,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(articleTranslations.id, ed.id));
  const action =
    next === "published"
      ? "publish"
      : next === "scheduled"
        ? "schedule"
        : next === "archived"
          ? "archive"
          : "unpublish";
  await audit(staff.userId, action, "edition", ed.id);
  revalidatePublic();
  revalidatePath(`/${locale}/article/${ed.slug}`);
  revalidatePath(`/admin/articles/${articleId}`);
  revalidatePath("/admin/articles");
  return { ok: true as const };
}

export async function addEditionAction(formData: FormData) {
  const staff = await requireStaff();
  const articleId = String(formData.get("articleId"));
  const locale = String(formData.get("locale"));
  if (!isLocale(locale)) return { ok: false as const, code: "VALIDATION" };
  await db.insert(articleTranslations).values({
    id: newId(),
    articleId,
    locale,
    slug: draftSlug(locale),
    title: "Untitled",
    body: emptyDoc(),
    status: "draft",
  });
  await audit(staff.userId, "create", "edition", `${articleId}:${locale}`);
  revalidatePublic();
  return { ok: true as const };
}

export async function setBreakingAction(formData: FormData) {
  const staff = await requireStaff();
  if (!canPublish(staff.role)) return { ok: false as const, code: "FORBIDDEN" };
  const articleId = String(formData.get("articleId"));
  const next = String(formData.get("isBreaking") ?? "") === "true";
  await db
    .update(articles)
    .set({ isBreaking: next, updatedBy: staff.userId, updatedAt: new Date() })
    .where(eq(articles.id, articleId));
  await audit(staff.userId, "update", "article", articleId, { isBreaking: next });
  revalidatePublic();
  revalidatePath("/admin/articles");
  return { ok: true as const };
}

export async function upsertCategoryAction(formData: FormData) {
  const staff = await requireStaff();
  if (!canPublish(staff.role)) return { ok: false as const, code: "FORBIDDEN" };
  const id = String(formData.get("id") ?? "") || newId();
  const position = Number(formData.get("position") ?? 0);
  const color = String(formData.get("color") ?? "").trim() || null;
  const existing = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!existing[0]) {
    await db.insert(categories).values({ id, position, color });
  } else {
    await db.update(categories).set({ position, color, updatedAt: new Date() }).where(eq(categories.id, id));
  }
  for (const locale of ["en", "ar", "ckb"] as Locale[]) {
    const name = String(formData.get(`name_${locale}`) ?? "").trim();
    const slug = String(formData.get(`slug_${locale}`) ?? "") || slugify(name, locale);
    const description = String(formData.get(`description_${locale}`) ?? "");
    if (!name) continue;
    const [tr] = await db
      .select()
      .from(categoryTranslations)
      .where(
        and(eq(categoryTranslations.categoryId, id), eq(categoryTranslations.locale, locale)),
      )
      .limit(1);
    if (tr) {
      await db
        .update(categoryTranslations)
        .set({ name, slug, description })
        .where(eq(categoryTranslations.id, tr.id));
    } else {
      await db.insert(categoryTranslations).values({
        id: newId(),
        categoryId: id,
        locale,
        name,
        slug,
        description,
      });
    }
  }
  revalidatePublic();
  return { ok: true as const, id };
}

export async function upsertTagAction(formData: FormData) {
  const staff = await requireStaff();
  if (!canPublish(staff.role)) return { ok: false as const, code: "FORBIDDEN" };
  const id = String(formData.get("id") ?? "") || newId();
  const existing = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  if (!existing[0]) await db.insert(tags).values({ id });
  for (const locale of ["en", "ar", "ckb"] as Locale[]) {
    const name = String(formData.get(`name_${locale}`) ?? "").trim();
    const slug = String(formData.get(`slug_${locale}`) ?? "") || slugify(name, locale);
    if (!name) continue;
    const [tr] = await db
      .select()
      .from(tagTranslations)
      .where(and(eq(tagTranslations.tagId, id), eq(tagTranslations.locale, locale)))
      .limit(1);
    if (tr) {
      await db.update(tagTranslations).set({ name, slug }).where(eq(tagTranslations.id, tr.id));
    } else {
      await db.insert(tagTranslations).values({ id: newId(), tagId: id, locale, name, slug });
    }
  }
  revalidatePublic();
  return { ok: true as const, id };
}

export async function upsertAuthorAction(formData: FormData) {
  const staff = await requireStaff();
  if (!canPublish(staff.role) && staff.role !== "author") {
    return { ok: false as const, code: "FORBIDDEN" };
  }
  const id = String(formData.get("id") ?? "") || newId();
  const enName = String(formData.get("name_en") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || slugify(enName, "en") || draftSlug("en");
  let photoMediaId = String(formData.get("photoMediaId") ?? "") || null;
  const photoFile = formData.get("photoFile");
  if (photoFile instanceof File && photoFile.size > 0) {
    const stored = await persistImageFile(staff.userId, photoFile, { alt: enName || "Portrait" });
    if (!stored.ok) return stored;
    photoMediaId = stored.id;
  }
  if (formData.get("clearPhoto") === "on") photoMediaId = null;
  const existing = await db.select().from(authors).where(eq(authors.id, id)).limit(1);
  if (!existing[0]) await db.insert(authors).values({ id, slug, photoMediaId });
  else await db.update(authors).set({ slug, photoMediaId, updatedAt: new Date() }).where(eq(authors.id, id));
  for (const locale of ["en", "ar", "ckb"] as Locale[]) {
    const name = String(formData.get(`name_${locale}`) ?? "").trim();
    const bio = String(formData.get(`bio_${locale}`) ?? "");
    const locSlug = String(formData.get(`slug_${locale}`) ?? "") || slugify(name, locale);
    if (!name) continue;
    const [tr] = await db
      .select()
      .from(authorTranslations)
      .where(and(eq(authorTranslations.authorId, id), eq(authorTranslations.locale, locale)))
      .limit(1);
    if (tr) {
      await db
        .update(authorTranslations)
        .set({ name, bio, slug: locSlug })
        .where(eq(authorTranslations.id, tr.id));
    } else {
      await db.insert(authorTranslations).values({
        id: newId(),
        authorId: id,
        locale,
        name,
        bio,
        slug: locSlug,
      });
    }
  }
  revalidatePublic();
  return { ok: true as const, id };
}

export async function uploadMediaAction(formData: FormData) {
  const staff = await requireStaff();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false as const, code: "MEDIA_TYPE" };
  const stored = await persistImageFile(staff.userId, file, {
    alt: String(formData.get("alt_en") ?? formData.get("alt_ar") ?? formData.get("alt_ckb") ?? "Image"),
    caption: String(formData.get("caption_en") ?? ""),
    credit: String(formData.get("credit_en") ?? ""),
  });
  if (!stored.ok) return stored;
  for (const locale of ["en", "ar", "ckb"] as Locale[]) {
    const alt = String(formData.get(`alt_${locale}`) ?? "").trim();
    const caption = String(formData.get(`caption_${locale}`) ?? "");
    const credit = String(formData.get(`credit_${locale}`) ?? "");
    if (!alt && !caption && !credit) continue;
    await db
      .update(mediaTranslations)
      .set({
        alt: alt || "Image",
        caption,
        credit,
      })
      .where(and(eq(mediaTranslations.mediaId, stored.id), eq(mediaTranslations.locale, locale)));
  }
  revalidatePublic();
  return stored;
}

export async function updateMediaMetaAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false as const, code: "VALIDATION" };
  for (const locale of ["en", "ar", "ckb"] as Locale[]) {
    const alt = String(formData.get(`alt_${locale}`) ?? "").trim() || "Image";
    const caption = String(formData.get(`caption_${locale}`) ?? "");
    const credit = String(formData.get(`credit_${locale}`) ?? "");
    const [existing] = await db
      .select()
      .from(mediaTranslations)
      .where(and(eq(mediaTranslations.mediaId, id), eq(mediaTranslations.locale, locale)))
      .limit(1);
    if (existing) {
      await db
        .update(mediaTranslations)
        .set({ alt, caption, credit })
        .where(and(eq(mediaTranslations.mediaId, id), eq(mediaTranslations.locale, locale)));
    } else {
      await db.insert(mediaTranslations).values({ mediaId: id, locale, alt, caption, credit });
    }
  }
  revalidatePath("/admin/media");
  revalidatePublic();
  return { ok: true as const };
}

export async function createStaffAction(formData: FormData) {
  const staff = await requireStaff();
  if (!canManageUsers(staff.role)) return { ok: false as const, code: "FORBIDDEN" };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? email);
  const role = String(formData.get("role") ?? "author") as
    | "admin"
    | "editor"
    | "author";
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  const id = newId();
  const now = new Date();
  await db.insert(user).values({
    id,
    name,
    email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(account).values({
    id: newId(),
    accountId: id,
    providerId: "credential",
    issuer: "local:credential",
    userId: id,
    password: hash,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(staffProfiles).values({
    userId: id,
    role: role === "admin" || role === "editor" || role === "author" ? role : "author",
    displayName: name,
    active: true,
  });
  await audit(staff.userId, "user_create", "user", id);
  return { ok: true as const };
}

export async function setStaffRoleAction(formData: FormData) {
  const staff = await requireStaff();
  if (!canManageUsers(staff.role)) return { ok: false as const, code: "FORBIDDEN" };
  const userId = String(formData.get("userId"));
  const role = String(formData.get("role"));
  if (role === "owner" && staff.role !== "owner") {
    return { ok: false as const, code: "CANNOT_DEMOTE_OWNER" };
  }
  await db
    .update(staffProfiles)
    .set({ role: role as "owner" | "admin" | "editor" | "author", updatedAt: new Date() })
    .where(eq(staffProfiles.userId, userId));
  return { ok: true as const };
}

export async function setStaffActiveAction(formData: FormData) {
  const staff = await requireStaff();
  if (!canManageUsers(staff.role)) return { ok: false as const, code: "FORBIDDEN" };
  const userId = String(formData.get("userId"));
  if (userId === staff.userId) return { ok: false as const, code: "CANNOT_DEACTIVATE_SELF" };
  const active = formData.get("active") === "true";
  await db.update(staffProfiles).set({ active, updatedAt: new Date() }).where(eq(staffProfiles.userId, userId));
  return { ok: true as const };
}

export async function upsertRedirectAction(formData: FormData) {
  const staff = await requireStaff();
  if (!canManageSettings(staff.role) && !canPublish(staff.role)) {
    return { ok: false as const, code: "FORBIDDEN" };
  }
  const fromPath = String(formData.get("fromPath") ?? "");
  const toPath = String(formData.get("toPath") ?? "");
  const type = String(formData.get("type") ?? "301") as "301" | "302";
  await db.insert(redirects).values({ id: newId(), fromPath, toPath, type });
  await audit(staff.userId, "redirect", "redirect", fromPath);
  return { ok: true as const };
}

export async function updateSettingsAction(formData: FormData) {
  const staff = await requireStaff();
  if (!canManageSettings(staff.role)) return { ok: false as const, code: "FORBIDDEN" };
  const locales = {
    en: {
      name: String(formData.get("name_en") ?? "Herald"),
      tagline: String(formData.get("tagline_en") ?? ""),
      footerBlurb: String(formData.get("footer_en") ?? ""),
    },
    ar: {
      name: String(formData.get("name_ar") ?? "هيرالد"),
      tagline: String(formData.get("tagline_ar") ?? ""),
      footerBlurb: String(formData.get("footer_ar") ?? ""),
    },
    ckb: {
      name: String(formData.get("name_ckb") ?? "هێراڵد"),
      tagline: String(formData.get("tagline_ckb") ?? ""),
      footerBlurb: String(formData.get("footer_ckb") ?? ""),
    },
  };
  const rails = String(formData.get("rails") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  await db
    .update(siteSettings)
    .set({
      locales,
      contactEmail: String(formData.get("contactEmail") ?? ""),
      homepageLayout: { rails },
    })
    .where(eq(siteSettings.id, 1));
  await audit(staff.userId, "settings", "settings", "1");
  revalidatePublic();
  return { ok: true as const };
}
