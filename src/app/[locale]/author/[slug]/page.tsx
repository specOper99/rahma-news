import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Pagination } from "@/components/public/Pagination";
import { LegalRail } from "@/components/public/LegalRail";
import { LOCALES, isLocale, nativeNameOf, type Locale } from "@/lib/locales";
import { getByAuthor, getMediaForLocale } from "@/server/dal/articles";

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);
  const page = Math.max(1, Number((await searchParams).page ?? 1));
  const data = await getByAuthor(locale, slug, page);
  if (!data) notFound();
  const tL = await getTranslations("Listing");
  const photo = data.photo ? await getMediaForLocale(data.photo, locale) : null;
  const otherName = data.translations.find((tr) => tr.locale !== locale)?.name;
  return (
    <main id="main" className="mx-auto max-w-[90rem] px-4 py-8 sm:px-8">
      <p className="mb-4 font-mono-num text-[11px] uppercase tracking-wider text-outline">{tL("author")}</p>
      <section className="mb-10 grid items-start gap-8 border-b-2 border-primary pb-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          {photo ? (
            <Image
              src={photo.src}
              alt={photo.alt || data.author.name}
              width={photo.width || 400}
              height={photo.height || 400}
              className="aspect-square w-full rounded-md object-cover grayscale"
            />
          ) : (
            <div className="aspect-square rounded-md bg-surface-container" />
          )}
        </div>
        <div className="lg:col-span-8">
          <div className="mb-3 flex flex-wrap gap-1">
            {LOCALES.map((l) => {
              const tr = data.translations.find((item) => item.locale === l);
              const active = l === locale;
              if (!tr) {
                return (
                  <span key={l} className="rounded bg-surface-container px-2 py-1 font-mono-num text-[11px] text-outline">
                    {nativeNameOf(l)}
                  </span>
                );
              }
              return (
                <a
                  key={l}
                  href={`/${l}/author/${tr.slug}`}
                  className={
                    active
                      ? "rounded bg-primary px-2 py-1 font-mono-num text-[11px] font-bold text-on-primary"
                      : "rounded bg-surface-container px-2 py-1 font-mono-num text-[11px] text-on-surface hover:text-secondary"
                  }
                >
                  {nativeNameOf(l)}
                </a>
              );
            })}
          </div>
          <h1 className="font-display text-4xl font-bold text-primary">
            {data.author.name}
            {otherName && otherName !== data.author.name ? (
              <span className="ms-3 font-display text-2xl italic text-on-surface-variant">{otherName}</span>
            ) : null}
          </h1>
          {data.author.bio ? (
            <p className="mt-4 max-w-[65ch] text-lg leading-relaxed text-on-surface-variant">{data.author.bio}</p>
          ) : null}
          <p className="mt-6 font-mono-num text-sm text-on-surface-variant">
            {tL("dispatches", { n: data.storyCount })}
          </p>
        </div>
      </section>
      <div className="grid items-start gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {data.stories.length === 0 ? <p className="text-on-surface-variant">{tL("empty")}</p> : null}
          {data.stories.map((s) => (
            <ArticleCard key={s.articleId} story={s} locale={locale} variant="river" />
          ))}
          <Pagination page={page} hasNext={data.hasNext} basePath={`/author/${slug}`} />
        </div>
        <div className="lg:col-span-4">
          <LegalRail />
        </div>
      </div>
    </main>
  );
}
