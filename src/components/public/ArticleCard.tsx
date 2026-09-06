import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { CardStory } from "@/server/dal/articles";
import type { Locale } from "@/lib/locales";
import { formatStoryDate, formatStoryTime } from "@/lib/format";

export async function ArticleCard({
  story,
  locale,
  variant,
}: {
  story: CardStory;
  locale: Locale;
  variant: "lead" | "secondary" | "rail" | "river" | "related";
}) {
  const t = await getTranslations("Home");
  const href = `/article/${story.slug}`;
  const date = formatStoryDate(locale, story.publishedAt);
  const time = formatStoryTime(locale, story.publishedAt);

  const img = story.heroSrc ? (
    <Image
      src={story.heroSrc}
      alt={story.heroAlt}
      width={variant === "lead" ? 1600 : 800}
      height={variant === "lead" ? 900 : 500}
      unoptimized={story.heroSrc.endsWith(".svg")}
      className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.02]"
      priority={variant === "lead" || variant === "secondary"}
    />
  ) : (
    <div className="h-full w-full bg-surface-container" />
  );

  if (variant === "lead") {
    return (
      <article className="group overflow-hidden rounded-md border border-border-muted bg-surface-container-lowest shadow-[0_1px_8px_rgba(11,19,32,0.04)] transition-shadow hover:shadow-md lg:col-span-8">
        <Link href={href} className="relative block aspect-[16/9] overflow-hidden bg-surface-container">
          {img}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/25 to-transparent" />
          <div className="absolute start-4 top-4 flex flex-wrap items-center gap-2">
            {story.isBreaking ? (
              <span className="rounded bg-error px-3 py-1 text-xs font-bold text-on-error shadow-sm">
                {t("breaking")}
              </span>
            ) : null}
            {story.featuredRank ? (
              <span className="rounded bg-surface-container-lowest/90 px-2.5 py-1 font-mono-num text-xs font-bold text-primary backdrop-blur-md">
                #{story.featuredRank}
              </span>
            ) : null}
          </div>
        </Link>
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
            <Link href={`/category/${story.categorySlug}`} className="font-bold text-secondary">
              {story.categoryName}
            </Link>
            {date ? <span className="font-mono-num">{date}</span> : null}
            {story.readingTimeMin ? (
              <span className="font-mono-num">{story.readingTimeMin}′</span>
            ) : null}
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight text-primary transition-colors hover:text-secondary sm:text-3xl lg:text-4xl">
            <Link href={href}>{story.title}</Link>
          </h1>
          {story.dek ? (
            <p className="max-w-[65ch] text-base leading-relaxed text-on-surface-variant">{story.dek}</p>
          ) : null}
        </div>
      </article>
    );
  }

  if (variant === "secondary") {
    return (
      <article className="group flex flex-col overflow-hidden rounded-md border border-border-muted bg-surface-container-lowest shadow-[0_1px_8px_rgba(11,19,32,0.04)] transition-shadow hover:shadow-md">
        <Link href={href} className="aspect-[16/9] overflow-hidden bg-surface-container">
          {img}
        </Link>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="font-ui text-[11px] font-bold uppercase tracking-widest text-secondary">
            {story.categoryName}
          </p>
          <h2 className="font-display text-xl font-bold leading-snug text-primary transition-colors hover:text-secondary">
            <Link href={href}>{story.title}</Link>
          </h2>
          {story.dek ? (
            <p className="line-clamp-2 text-sm text-on-surface-variant">{story.dek}</p>
          ) : null}
          <p className="mt-auto font-mono-num text-xs text-outline">{date}</p>
        </div>
      </article>
    );
  }

  if (variant === "rail") {
    return (
      <article className="group flex flex-col overflow-hidden rounded-md border border-border-muted bg-surface-container-lowest shadow-[0_1px_2px_rgba(11,19,32,0.03)] transition-shadow hover:shadow-sm">
        <Link href={href} className="aspect-[16/9] overflow-hidden bg-surface-container">
          {img}
        </Link>
        <div className="flex flex-1 flex-col justify-between space-y-3 p-5">
          <div>
            <p className="font-ui text-[11px] font-bold uppercase tracking-widest text-secondary">
              {story.categoryName}
            </p>
            <h2 className="mt-1 font-display text-lg font-bold leading-snug text-primary transition-colors hover:text-secondary">
              <Link href={href}>{story.title}</Link>
            </h2>
            {story.dek ? (
              <p className="mt-2 line-clamp-3 text-sm text-on-surface-variant">{story.dek}</p>
            ) : null}
          </div>
          <p className="font-mono-num text-xs text-outline">{date}</p>
        </div>
      </article>
    );
  }

  if (variant === "related") {
    return (
      <article className="group">
        <h3 className="font-display text-base font-bold leading-snug text-primary hover:text-secondary">
          <Link href={href}>{story.title}</Link>
        </h3>
        <p className="mt-1 font-mono-num text-[11px] text-outline">
          {story.categoryName}
          {date ? ` · ${date}` : ""}
        </p>
      </article>
    );
  }

  return (
    <article className="rounded px-2 py-4 transition-colors first:pt-4 hover:bg-surface-container-low/40">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
        <div className="flex items-center gap-2">
          {time ? (
            <span className="rounded bg-surface-container px-2 py-0.5 font-mono-num text-xs font-bold text-primary">
              {time}
            </span>
          ) : null}
          <span className="text-xs font-bold text-on-surface-variant">{story.categoryName}</span>
        </div>
        {story.readingTimeMin ? (
          <span className="font-mono-num text-xs text-outline">{story.readingTimeMin}′</span>
        ) : null}
      </div>
      <div className="mt-2 flex gap-4">
        {story.heroSrc ? (
          <Link href={href} className="hidden w-28 shrink-0 overflow-hidden rounded sm:block">
            {img}
          </Link>
        ) : null}
        <div>
          <h2 className="font-display text-lg font-bold text-primary transition-colors hover:text-secondary">
            <Link href={href}>{story.title}</Link>
          </h2>
          {story.dek ? (
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{story.dek}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
