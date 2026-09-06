import { notFound } from "next/navigation";
import Image from "next/image";
import { getAdminCopy } from "@/server/desk-copy";
import { dirOf, htmlLangOf, isLocale, type Locale } from "@/lib/locales";
import { renderEditionBody } from "@/lib/tiptap/render";
import { collectMediaIds, type TipTapNode } from "@/lib/tiptap/schema";
import { requireStaff } from "@/server/auth";
import { getArticleAdmin, getMediaByIds, getMediaForLocale } from "@/server/dal/articles";
import { previewToken } from "@/lib/preview";
import Link from "next/link";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPreviewPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  await requireStaff();
  const copy = await getAdminCopy();
  const { id, locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const data = await getArticleAdmin(id);
  if (!data) notFound();
  const edition = data.editions.find((e) => e.locale === locale);
  if (!edition) notFound();
  const hero = await getMediaForLocale(data.article.heroMediaId, locale);
  const bodyIds = [...collectMediaIds(edition.body as TipTapNode)];
  if (hero) bodyIds.push(hero.id);
  const mediaLookup = await getMediaByIds(bodyIds, locale);
  const mediaMap = Object.fromEntries(
    Object.entries(mediaLookup).map(([mid, m]) => [
      mid,
      { src: m.src, alt: m.alt, caption: m.caption, credit: m.credit, width: m.width, height: m.height },
    ]),
  );
  const publicPreview = `/${locale}/article/${edition.slug}?preview=${previewToken(id, locale)}`;
  return (
    <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-8" dir={dirOf(locale)} lang={htmlLangOf(locale)}>
      <p className="mb-4 font-ui text-sm text-on-surface-variant">
        {copy.previewBanner}{" "}
        <Link className="font-semibold text-secondary underline" href={publicPreview} target="_blank">
          {copy.previewOpen}
        </Link>
      </p>
      <h1 className="font-display text-4xl font-bold tracking-tight text-primary">{edition.title}</h1>
      {edition.dek ? <p className="mt-4 text-lg text-on-surface-variant">{edition.dek}</p> : null}
      {hero ? (
        <figure className="my-8 rounded bg-surface-container-lowest p-1 shadow-[0_1px_8px_rgba(11,19,32,0.04)] sm:p-2">
          <Image
            src={hero.src}
            alt={hero.alt}
            width={hero.width}
            height={hero.height}
            unoptimized={hero.src.endsWith(".svg")}
            className="h-auto max-h-[520px] w-full rounded object-cover"
          />
        </figure>
      ) : null}
      <div className="article-body mt-8 max-w-[65ch] text-on-surface">{renderEditionBody(edition.body, locale, mediaMap)}</div>
    </div>
  );
}
