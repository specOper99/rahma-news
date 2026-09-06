import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pgClient } from "../src/db";
import { auth } from "../src/auth";
import {
  account,
  articleAuthors,
  articleTags,
  articleTranslations,
  articles,
  authorTranslations,
  authors,
  categories,
  categoryTranslations,
  media,
  mediaTranslations,
  newsletterSubscribers,
  siteSettings,
  staffProfiles,
  tagTranslations,
  tags,
  user,
} from "../src/db/schema";
import { newId } from "../src/lib/ids";
import type { TipTapNode } from "../src/lib/tiptap/schema";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "1") {
  console.error("Refusing to seed production without ALLOW_SEED=1");
  process.exit(1);
}

function doc(...paragraphs: string[]): TipTapNode {
  return {
    type: "doc",
    content: paragraphs.flatMap((p, i) => {
      const nodes: TipTapNode[] = [
        {
          type: "paragraph",
          content: [{ type: "text", text: p }],
        },
      ];
      if (i === 1) {
        nodes.push({
          type: "pullquote",
          content: [{ type: "text", text: paragraphs[0].slice(0, 80) }],
        });
      }
      return nodes;
    }),
  };
}

async function upsertUser(email: string, name: string, password: string, role: "owner" | "editor" | "author") {
  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  if (existing[0]) {
    await db
      .update(account)
      .set({ password: hash, issuer: "local:credential", providerId: "credential" })
      .where(eq(account.userId, existing[0].id));
    await db
      .insert(staffProfiles)
      .values({ userId: existing[0].id, role, displayName: name, active: true })
      .onConflictDoUpdate({
        target: staffProfiles.userId,
        set: { role, displayName: name, active: true },
      });
    return existing[0].id;
  }
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
    role,
    displayName: name,
    active: true,
  });
  return id;
}

async function mediaFrom(id: string, file: string, alts: Record<"en" | "ar" | "ckb", string>) {
  await db
    .insert(media)
    .values({
      id,
      storageKey: `/fixtures/${file}`,
      mime: "image/svg+xml",
      bytes: 800,
      width: 1600,
      height: 900,
    })
    .onConflictDoNothing();
  for (const locale of ["en", "ar", "ckb"] as const) {
    await db
      .insert(mediaTranslations)
      .values({ mediaId: id, locale, alt: alts[locale], caption: alts[locale], credit: "Herald" })
      .onConflictDoNothing();
  }
}

async function main() {
  const ownerId = await upsertUser(
    process.env.ADMIN_EMAIL!,
    "Owner",
    process.env.ADMIN_PASSWORD!,
    "owner",
  );
  const editorId = await upsertUser(
    process.env.EDITOR_EMAIL!,
    "Editor",
    process.env.EDITOR_PASSWORD!,
    "editor",
  );
  const authorUserId = await upsertUser(
    process.env.AUTHOR_EMAIL!,
    "Author",
    process.env.AUTHOR_PASSWORD!,
    "author",
  );

  const catWorld = "11111111-1111-4111-8111-111111111111";
  const catIraq = "11111111-1111-4111-8111-111111111112";
  const catCulture = "11111111-1111-4111-8111-111111111113";
  const catOpinion = "11111111-1111-4111-8111-111111111114";
  for (const [id, pos] of [
    [catWorld, 0],
    [catIraq, 1],
    [catCulture, 2],
    [catOpinion, 3],
  ] as const) {
    await db.insert(categories).values({ id, position: pos }).onConflictDoNothing();
  }
  const catTr: [string, "en" | "ar" | "ckb", string, string][] = [
    [catWorld, "en", "world", "World"],
    [catWorld, "ar", "alalam", "العالم"],
    [catWorld, "ckb", "jahan", "جیهان"],
    [catIraq, "en", "iraq", "Iraq"],
    [catIraq, "ar", "aliraq", "العراق"],
    [catIraq, "ckb", "eraq", "عێراق"],
    [catCulture, "en", "culture", "Culture"],
    [catCulture, "ar", "thaqafa", "ثقافة"],
    [catCulture, "ckb", "roshnbiri", "ڕۆشنبیری"],
    [catOpinion, "en", "opinion", "Opinion"],
    [catOpinion, "ar", "rai", "رأي"],
    [catOpinion, "ckb", "bochwn", "بۆچوون"],
  ];
  for (const [categoryId, locale, slug, name] of catTr) {
    await db
      .insert(categoryTranslations)
      .values({ id: newId(), categoryId, locale, slug, name })
      .onConflictDoNothing();
  }

  const tagId = "22222222-2222-4222-8222-222222222221";
  await db.insert(tags).values({ id: tagId }).onConflictDoNothing();
  await db
    .insert(tagTranslations)
    .values({ id: newId(), tagId, locale: "en", slug: "energy", name: "Energy" })
    .onConflictDoNothing();
  await db
    .insert(tagTranslations)
    .values({ id: newId(), tagId, locale: "ar", slug: "taqa", name: "طاقة" })
    .onConflictDoNothing();
  await db
    .insert(tagTranslations)
    .values({ id: newId(), tagId, locale: "ckb", slug: "wze", name: "وزە" })
    .onConflictDoNothing();

  const author1 = "33333333-3333-4333-8333-333333333331";
  const author2 = "33333333-3333-4333-8333-333333333332";
  await db.insert(authors).values({ id: author1, slug: "layla-hassan", userId: editorId }).onConflictDoNothing();
  await db.insert(authors).values({ id: author2, slug: "karwan-ali", userId: authorUserId }).onConflictDoNothing();
  const authorNames: [string, "en" | "ar" | "ckb", string, string, string][] = [
    [author1, "en", "layla-hassan", "Layla Hassan", "Correspondent covering Iraq and the region."],
    [author1, "ar", "layla-hassan", "ليلى حسن", "مراسلة تغطي العراق والمنطقة."],
    [author1, "ckb", "layla-hassan", "لەیلا حەسەن", "پەیامنێر لە عێراق و ناوچەکە."],
    [author2, "en", "karwan-ali", "Karwan Ali", "Writer on culture and language."],
    [author2, "ar", "karwan-ali", "كاروان علي", "كاتب في الثقافة واللغة."],
    [author2, "ckb", "karwan-ali", "کاروان عەلی", "نووسەر لە ڕۆشنبیری و زمان."],
  ];
  for (const [authorId, locale, slug, name, bio] of authorNames) {
    await db
      .insert(authorTranslations)
      .values({ id: newId(), authorId, locale, slug, name, bio })
      .onConflictDoNothing();
  }

  await mediaFrom("44444444-4444-4444-8444-444444444441", "hero-a.svg", {
    en: "Baghdad skyline at dusk",
    ar: "أفق بغداد عند الغسق",
    ckb: "ئاسۆی بەغدا لە ئێوارەدا",
  });
  await mediaFrom("44444444-4444-4444-8444-444444444442", "hero-b.svg", {
    en: "Library shelves in Mosul",
    ar: "أرفف مكتبة في الموصل",
    ckb: "ڕەفی کتێبخانە لە موسڵ",
  });
  await mediaFrom("44444444-4444-4444-8444-444444444443", "hero-c.svg", {
    en: "Diplomats at a table",
    ar: "دبلوماسيون حول طاولة",
    ckb: "دیپلۆمات لەسەر مێز",
  });
  await mediaFrom("44444444-4444-4444-8444-444444444444", "hero-d.svg", {
    en: "Street in Basra",
    ar: "شارع في البصرة",
    ckb: "شەقامێک لە بەسرە",
  });
  await mediaFrom("44444444-4444-4444-8444-444444444445", "hero-e.svg", {
    en: "Newsroom desk",
    ar: "مكتب غرفة الأخبار",
    ckb: "مێزی هۆڵی هەواڵ",
  });
  await mediaFrom("44444444-4444-4444-8444-444444444446", "hero-f.svg", {
    en: "Morning light",
    ar: "ضوء الصباح",
    ckb: "ڕووناکیی بەیانی",
  });
  await mediaFrom("44444444-4444-4444-8444-444444444447", "hero-g.svg", {
    en: "Notebook draft",
    ar: "مسودة دفتر",
    ckb: "ڕەشنووسی دەفتەر",
  });
  await mediaFrom("44444444-4444-4444-8444-444444444448", "hero-h.svg", {
    en: "Breaking news light",
    ar: "ضوء خبر عاجل",
    ckb: "ڕووناکیی هەواڵی بەپەلە",
  });

  const heraldLocales = {
    en: { name: "Herald", tagline: "Independent reporting", footerBlurb: "" },
    ar: { name: "هيرالد", tagline: "تغطية مستقلة", footerBlurb: "" },
    ckb: { name: "هێراڵد", tagline: "ڕاپۆرتی سەربەخۆ", footerBlurb: "" },
  };

  await db
    .insert(siteSettings)
    .values({
      id: 1,
      locales: heraldLocales,
      social: {},
      contactEmail: "desk@rahma.local",
      homepageLayout: { rails: [catWorld, catIraq, catCulture] },
    })
    .onConflictDoNothing();

  await db.update(siteSettings).set({ locales: heraldLocales }).where(eq(siteSettings.id, 1));

  type Story = {
    id: string;
    cat: string;
    hero: string;
    breaking?: boolean;
    featured?: boolean;
    rank?: number;
    authors: string[];
    editions: {
      locale: "en" | "ar" | "ckb";
      slug: string;
      title: string;
      dek: string;
      paras: string[];
      status: "published" | "scheduled" | "draft";
      publishedAt?: Date;
    }[];
  };

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 3600_000);
  const dayAgo = new Date(now.getTime() - 86400_000);
  const plusHour = new Date(now.getTime() + 3600_000);

  const stories: Story[] = [
    {
      id: "55555555-5555-4555-8555-555555555551",
      cat: catIraq,
      hero: "44444444-4444-4444-8444-444444444441",
      featured: true,
      rank: 1,
      authors: [author1, author2],
      editions: [
        {
          locale: "en",
          slug: "baghdad-heat-and-the-power-grid",
          title: "Baghdad heat and the power grid",
          dek: "Another summer of outages tests patience and infrastructure.",
          paras: [
            "Baghdad woke again to fans slowing as temperatures climbed past forty.",
            "Engineers say the grid needs more than emergency fuel shipments.",
            "Families gather in courtyards after dark, swapping news and ice.",
            "Officials promise new turbines before next August.",
          ],
          status: "published",
          publishedAt: dayAgo,
        },
        {
          locale: "ar",
          slug: "har-baghdad-wa-shabakat-kahraba",
          title: "حر بغداد وشبكة الكهرباء",
          dek: "صيف آخر من الانقطاعات يختبر الصبر والبنية.",
          paras: [
            "استيقظت بغداد مجدداً على مراوح تتباطأ والحرارة تتجاوز الأربعين.",
            "يقول المهندسون إن الشبكة تحتاج أكثر من شحنات الوقود الطارئة.",
            "تجتمع العائلات في الأفنية بعد العتمة تتبادل الأخبار والثلج.",
            "يعد المسؤولون بتوربينات جديدة قبل آب المقبل.",
          ],
          status: "published",
          publishedAt: dayAgo,
        },
        {
          locale: "ckb",
          slug: "germa-baghdad-u-tori-kareba",
          title: "گەرمای بەغدا و تۆڕی کارەبا",
          dek: "هاوینێکی تر لە بڕانی کارەبا حەوسەڵە تاقی دەکاتەوە.",
          paras: [
            "بەغدا جارێکی تر بە پەکەوەکانی هێواشبوو لە خەو هەستا.",
            "ئەندازیاران دەڵێن تۆڕەکە پێویستی بە زیاتر لە سووتەمەنیی بەپەلە هەیە.",
            "خێزانەکان دوای تاریکی لە حەوشەکان کۆدەبنەوە.",
            "بەرپرسان بەڵێنی توربینی نوێ دەدەن پێش ئابی داهاتوو.",
          ],
          status: "published",
          publishedAt: dayAgo,
        },
      ],
    },
    {
      id: "55555555-5555-4555-8555-555555555552",
      cat: catCulture,
      hero: "44444444-4444-4444-8444-444444444442",
      featured: true,
      rank: 2,
      authors: [author2],
      editions: [
        {
          locale: "en",
          slug: "mosul-library-returns",
          title: "A Mosul library returns to the stacks",
          dek: "Volunteers catalog what war scattered.",
          paras: [
            "Dust still sits in the corners of the reading room.",
            "A cataloger holds a volume rescued from a courtyard.",
            "Readers come for shade as much as for books.",
            "The collection is incomplete, and that is the point.",
          ],
          status: "published",
          publishedAt: hourAgo,
        },
        {
          locale: "ar",
          slug: "maktabat-mawsil",
          title: "مكتبة الموصل تعود إلى الرفوف",
          dek: "متطوعون يفهرسون ما بعثرته الحرب.",
          paras: [
            "ما زال الغبار في زوايا قاعة القراءة.",
            "تفهرس متطوعة مجلداً أُنقذ من فناء.",
            "يأتي القراء للظل بقدر ما يأتون للكتب.",
            "المجموعة ناقصة، وهذا هو المعنى.",
          ],
          status: "published",
          publishedAt: hourAgo,
        },
        {
          locale: "ckb",
          slug: "ktebxaney-mosul",
          title: "کتێبخانەی موسڵ دەگەڕێتەوە سەر ڕەفەکان",
          dek: "خۆبەخشان ئەوەی جەنگ بڵاوە پێ کرد فەهرەست دەکەن.",
          paras: [
            "هێشتا تۆز لە گۆشەکانی هۆڵی خوێندنەوەدایە.",
            "فەهرەستکارێک بەرگێکی ڕزگارکراو هەڵدەگرێت.",
            "خوێنەران بۆ سێبەر دێن وەک بۆ کتێب.",
            "کۆکراوەکە ناتەواوە، و ئەوە مەبەستە.",
          ],
          status: "published",
          publishedAt: hourAgo,
        },
      ],
    },
    {
      id: "55555555-5555-4555-8555-555555555553",
      cat: catWorld,
      hero: "44444444-4444-4444-8444-444444444443",
      featured: true,
      rank: 3,
      authors: [author1],
      editions: [
        {
          locale: "ar",
          slug: "diplomasiyya-iqlimiyya",
          title: "دبلوماسية إقليمية على مهل",
          dek: "محادثات بلا بيان ختامي.",
          paras: [
            "اجتمع المبعوثون لساعات ثم غادروا دون نص مشترك.",
            "يقول دبلوماسي إن الصمت أبلغ من المسودة.",
            "في العواصم، تُقرأ الإشارات أكثر من الكلمات.",
          ],
          status: "published",
          publishedAt: dayAgo,
        },
        {
          locale: "ckb",
          slug: "diplomasia-heremi",
          title: "دیپلۆماسیی هەرێمی بە هێواشی",
          dek: "گفتوگۆ بەبێ بەیاننامەی کۆتایی.",
          paras: [
            "نێردراوەکان کاتژمێران کۆبوونەوە و بەبێ دەق ڕۆیشتن.",
            "دیپلۆماتێک دەڵێت بێدەنگی لە ڕەشنووس ڕوونترە.",
          ],
          status: "published",
          publishedAt: dayAgo,
        },
      ],
    },
    {
      id: "55555555-5555-4555-8555-555555555554",
      cat: catIraq,
      hero: "44444444-4444-4444-8444-444444444444",
      authors: [author1],
      editions: [
        {
          locale: "ar",
          slug: "basra-water",
          title: "الملوحة تصل إلى البصرة مبكراً",
          dek: "الصيادون يغيرون مواعيد الخروج.",
          paras: [
            "يقول صياد إن الشبكة أثقل هذا الأسبوع.",
            "البلدية توزع صهاريج في الأحياء النائية.",
          ],
          status: "published",
          publishedAt: hourAgo,
        },
        {
          locale: "ckb",
          slug: "awi-basra",
          title: "خوێیەتی زوو دەگاتە بەسرە",
          dek: "ماسیگرەکان کاتی دەرچوون دەگۆڕن.",
          paras: ["ماسیگرێک دەڵێت تۆڕەکە ئەم هەفتەیە قورسترە."],
          status: "published",
          publishedAt: hourAgo,
        },
      ],
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      cat: catOpinion,
      hero: "44444444-4444-4444-8444-444444444445",
      authors: [author2],
      editions: [
        {
          locale: "en",
          slug: "why-three-languages-one-newsroom",
          title: "Why three languages, one newsroom",
          dek: "English, Arabic, and Sorani are not a translation queue.",
          paras: [
            "A story can live in one language without waiting for the others.",
            "That is how a newsroom respects clocks and readers.",
            "Coverage is a matrix, not a single switch.",
          ],
          status: "published",
          publishedAt: dayAgo,
        },
      ],
    },
    {
      id: "55555555-5555-4555-8555-555555555556",
      cat: catIraq,
      hero: "44444444-4444-4444-8444-444444444446",
      authors: [author1],
      editions: [
        {
          locale: "ar",
          slug: "maw3id-alsaah",
          title: "موعد الساعة السادسة",
          dek: "قصة مجدولة للاختبار.",
          paras: ["هذه الطبعة ستظهر بعد ساعة من زرع البيانات."],
          status: "scheduled",
          publishedAt: plusHour,
        },
      ],
    },
    {
      id: "55555555-5555-4555-8555-555555555557",
      cat: catCulture,
      hero: "44444444-4444-4444-8444-444444444447",
      authors: [author2],
      editions: [
        {
          locale: "ar",
          slug: "maswada-thaqafa",
          title: "مسودة عن مهرجان",
          dek: "لم تُنشر بعد.",
          paras: ["مسودة يملكها الكاتب."],
          status: "draft",
        },
      ],
    },
    {
      id: "55555555-5555-4555-8555-555555555558",
      cat: catWorld,
      hero: "44444444-4444-4444-8444-444444444448",
      breaking: true,
      featured: true,
      rank: 4,
      authors: [author1],
      editions: [
        {
          locale: "ar",
          slug: "khabar-ajil-hudud",
          title: "عاجل: إغلاق معبر حدودي ساعات",
          dek: "حركة الشاحنات تتوقف مؤقتاً.",
          paras: ["أعلنت السلطات إغلاقاً مؤقتاً للتدقيق.", "لم يصدر بيان عن المدة."],
          status: "published",
          publishedAt: hourAgo,
        },
        {
          locale: "en",
          slug: "border-crossing-closes-hours",
          title: "Breaking: border crossing closed for hours",
          dek: "Truck traffic paused.",
          paras: ["Authorities announced a temporary closure for checks."],
          status: "published",
          publishedAt: hourAgo,
        },
        {
          locale: "ckb",
          slug: "derwazey-snur",
          title: "ڕەشنووس: دەروازەی سنوور",
          dek: "هێشتا بڵاونەکراوەتەوە.",
          paras: ["ڕەشنووسی کوردی."],
          status: "draft",
        },
      ],
    },
  ];

  for (const s of stories) {
    await db
      .insert(articles)
      .values({
        id: s.id,
        primaryCategoryId: s.cat,
        heroMediaId: s.hero,
        isBreaking: Boolean(s.breaking),
        isFeatured: Boolean(s.featured),
        featuredRank: s.rank ?? null,
        createdBy: ownerId,
        updatedBy: editorId,
      })
      .onConflictDoNothing();
    for (const a of s.authors) {
      await db.insert(articleAuthors).values({ articleId: s.id, authorId: a, position: 0 }).onConflictDoNothing();
    }
    await db.insert(articleTags).values({ articleId: s.id, tagId }).onConflictDoNothing();
    for (const e of s.editions) {
      const body = doc(...e.paras);
      await db
        .insert(articleTranslations)
        .values({
          id: newId(),
          articleId: s.id,
          locale: e.locale,
          slug: e.slug,
          title: e.title,
          dek: e.dek,
          body,
          bodyText: e.paras.join("\n"),
          status: e.status,
          publishedAt: e.publishedAt ?? null,
          wordCount: e.paras.join(" ").split(/\s+/).length,
          readingTimeMin: 2,
        })
        .onConflictDoNothing();
    }
  }

  await db
    .insert(newsletterSubscribers)
    .values([
      { id: newId(), email: "one@example.com", locale: "en" },
      { id: newId(), email: "two@example.com", locale: "ar" },
      { id: newId(), email: "three@example.com", locale: "ckb" },
    ])
    .onConflictDoNothing();

  console.log("Seed complete. Owner", process.env.ADMIN_EMAIL);
  await pgClient.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
