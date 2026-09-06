import { notFound } from "next/navigation";
import { dirOf, htmlLangOf, LOCALES, shortCodeOf, type Locale } from "@/lib/locales";
import { NewsEditor } from "@/components/editor/NewsEditor";
import { AutoDir } from "@/components/editor/AutoDir";
import { localizedField, statusLabel } from "@/lib/admin-copy";
import { getAdminCopy, getDeskLocale } from "@/server/desk-copy";
import {
  addEditionAction,
  saveEditionFormAction,
  setEditionStatusAction,
} from "@/server/actions/editorial";
import { voidAction } from "@/server/actions/form";
import { canPublish, requireStaff } from "@/server/auth";
import {
  getArticleAdmin,
  getMediaForLocale,
  listAuthorsAdmin,
  listCategoriesAdmin,
  listTagsAdmin,
} from "@/server/dal/articles";
import Link from "next/link";
import { FileDropzone } from "@/components/admin/FileDropzone";

function statusClass(status: string) {
  if (status === "in_review") return "admin-status admin-status-review";
  if (status === "scheduled") return "admin-status admin-status-scheduled";
  if (status === "published") return "admin-status admin-status-live";
  if (status === "archived") return "admin-status admin-status-muted";
  return "admin-status admin-status-draft";
}

export default async function ArticleEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locale?: string; err?: string; saved?: string }>;
}) {
  const staff = await requireStaff();
  const copy = await getAdminCopy();
  const deskLocale = await getDeskLocale();
  const { id } = await params;
  const sp = await searchParams;
  const data = await getArticleAdmin(id);
  if (!data) notFound();
  const loc = (LOCALES.includes(sp.locale as Locale) ? sp.locale : data.editions[0]?.locale) as Locale;
  const edition = data.editions.find((e) => e.locale === loc) ?? data.editions[0];
  const cats = await listCategoriesAdmin();
  const tags = await listTagsAdmin();
  const authors = await listAuthorsAdmin();
  const publisher = canPublish(staff.role);
  const liveCount = data.editions.filter((e) => e.status === "published").length;
  const hero = await getMediaForLocale(data.article.heroMediaId, loc);
  const editionDir = dirOf(loc);
  const editionLang = htmlLangOf(loc);
  const sectionName = localizedField(
    cats.find((c) => c.id === data.article.primaryCategoryId)?.translations ?? [],
    deskLocale,
    copy.section,
  );

  return (
    <div className="space-y-4">
      {sp.saved ? (
        <p className="rounded bg-secondary-container px-3 py-2 text-sm text-on-secondary-container">
          {copy.savedFlash}
        </p>
      ) : null}
      {sp.err === "STALE_WRITE" ? (
        <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">{copy.staleWrite}</p>
      ) : null}
      {sp.err && sp.err !== "STALE_WRITE" ? (
        <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">{sp.err}</p>
      ) : null}
      <div className="admin-card flex flex-wrap items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="font-mono-num text-[11px] uppercase tracking-wider text-outline">
            {copy.articles} / {sectionName}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {edition?.title ?? copy.untitled}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {edition ? <span className={statusClass(edition.status)} data-edition-status={edition.status}>{statusLabel(copy, edition.status)}</span> : null}
            {data.article.isBreaking ? (
              <span className="admin-status admin-status-review">{copy.breaking}</span>
            ) : null}
            {data.article.isFeatured ? (
              <span className="admin-status admin-status-live">
                {copy.featured}
                {data.article.featuredRank ? ` #${data.article.featuredRank}` : ""}
              </span>
            ) : null}
            <span className="admin-status admin-status-muted">
              {copy.liveEditions} {liveCount}/3
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {edition ? (
            <Link
              href={`/admin/articles/${id}/preview/${edition.locale}`}
              target="_blank"
              className="admin-btn-ghost h-9 px-3"
            >
              {copy.preview}
            </Link>
          ) : null}
          {edition ? (
            <button type="submit" form="edition-form" className="admin-btn-primary h-9 px-3">
              {copy.saveUpdate}
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded bg-surface-container p-1 text-sm">
        {LOCALES.map((l) => {
          const has = data.editions.some((e) => e.locale === l);
          return has ? (
            <Link
              key={l}
              href={`/admin/articles/${id}?locale=${l}`}
              className={`rounded px-3 py-1.5 ${l === loc ? "bg-surface-container-lowest font-semibold shadow-sm" : "text-on-surface-variant"}`}
            >
              {shortCodeOf(l)}
            </Link>
          ) : (
            <form key={l} action={voidAction(addEditionAction)}>
              <input type="hidden" name="articleId" value={id} />
              <input type="hidden" name="locale" value={l} />
              <button type="submit" className="rounded px-3 py-1.5 text-secondary">
                + {shortCodeOf(l)}
              </button>
            </form>
          );
        })}
      </div>

      {edition ? (
        <form id="edition-form" action={voidAction(saveEditionFormAction)} className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <aside className="admin-card space-y-4 p-4 text-sm">
            <h2 className="text-[13px] font-semibold">{copy.storyContainer}</h2>
            <input type="hidden" name="articleId" value={id} />
            <input type="hidden" name="locale" value={edition.locale} />
            <input type="hidden" name="expectedUpdatedAt" value={edition.updatedAt.toISOString()} />
            <label className="block">
              {copy.section}
              <select name="categoryId" defaultValue={data.article.primaryCategoryId} className="mt-1">
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {localizedField(c.translations, deskLocale, copy.section)}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend className="mb-1 font-medium">{copy.bylines}</legend>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-outline-variant p-2">
                {authors.map((a) => (
                  <label key={a.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="authorIds"
                      value={a.id}
                      defaultChecked={data.authorIds.includes(a.id)}
                    />
                    {localizedField(a.translations, deskLocale, a.slug)}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-1 font-medium">{copy.tags}</legend>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-outline-variant p-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="tagIds"
                      value={tag.id}
                      defaultChecked={data.tagIds.includes(tag.id)}
                    />
                    {localizedField(tag.translations, deskLocale, copy.tags)}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isBreaking" defaultChecked={data.article.isBreaking} />
              {copy.breaking}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isFeatured" defaultChecked={data.article.isFeatured} />
              {copy.featured}
            </label>
            <label className="block">
              {copy.rank}
              <input name="featuredRank" type="number" defaultValue={data.article.featuredRank ?? ""} className="mt-1" />
            </label>
            <div>
              <p className="mb-1">{copy.hero}</p>
              <input type="hidden" name="heroMediaId" value={data.article.heroMediaId ?? ""} />
              <FileDropzone
                name="heroFile"
                previewSrc={hero?.src}
                previewAlt={hero?.alt ?? ""}
                labels={{
                  drop: copy.dropImage,
                  browse: copy.browseImage,
                  selected: copy.fileSelected,
                }}
              />
              <input name="heroAlt" defaultValue={hero?.alt ?? ""} placeholder={copy.alt} className="mt-2" />
              <input name="heroCaption" defaultValue={hero?.caption ?? ""} placeholder={copy.caption} className="mt-2" />
              <input name="heroCredit" defaultValue={hero?.credit ?? ""} placeholder={copy.credit} className="mt-2" />
              {data.article.heroMediaId ? (
                <label className="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
                  <input type="checkbox" name="clearHero" />
                  {copy.removeHero}
                </label>
              ) : null}
            </div>
          </aside>

          <AutoDir fallback={editionDir} lang={editionLang} className="space-y-3">
            <input
              name="title"
              defaultValue={edition.title}
              className="w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 font-display text-2xl"
            />
            <input
              name="slug"
              defaultValue={edition.slug}
              className="w-full font-mono-num text-sm"
              dir="ltr"
            />
            <textarea
              name="dek"
              defaultValue={edition.dek}
              className="w-full"
              rows={3}
            />
            <div className="flex gap-4 font-mono-num text-[11px] text-on-surface-variant">
              <span>
                {copy.wordCount}: {edition.wordCount}
              </span>
              <span>
                {copy.readTime}: {edition.readingTimeMin}m
              </span>
            </div>
            <NewsEditor
              name="body"
              initial={edition.body}
              dir={editionDir}
              lang={editionLang}
              labels={{
                placeholder: copy.writePlaceholder,
                loading: copy.editorLoading,
                bold: copy.editorBold,
                italic: copy.editorItalic,
                h2: copy.editorH2,
                quote: copy.editorQuote,
                list: copy.editorList,
                link: copy.editorLink,
                url: copy.editorUrl,
                image: copy.editorImage,
              }}
            />
            <details className="admin-card p-3">
              <summary className="cursor-pointer text-sm font-medium">{copy.seo}</summary>
              <input name="seoTitle" defaultValue={edition.seoTitle ?? ""} placeholder={copy.seoTitle} className="mt-2" />
              <input
                name="seoDescription"
                defaultValue={edition.seoDescription ?? ""}
                placeholder={copy.seoDescription}
                className="mt-2"
              />
              <input
                name="canonicalUrl"
                defaultValue={edition.canonicalUrl ?? ""}
                placeholder={copy.canonical}
                className="mt-2"
                dir="ltr"
              />
            </details>
            <button type="submit" className="admin-btn-primary h-10 px-4">
              {copy.save}
            </button>
          </AutoDir>
        </form>
      ) : null}

      {edition && publisher ? (
        <div className="flex flex-wrap gap-2 text-sm">
          {["draft", "in_review", "published", "archived"].map((st) => (
            <form key={st} action={voidAction(setEditionStatusAction)}>
              <input type="hidden" name="articleId" value={id} />
              <input type="hidden" name="locale" value={edition.locale} />
              <input type="hidden" name="status" value={st} />
              <button className="admin-btn-ghost h-9 px-3" type="submit">
                {st}
              </button>
            </form>
          ))}
          <form action={voidAction(setEditionStatusAction)} className="flex gap-2">
            <input type="hidden" name="articleId" value={id} />
            <input type="hidden" name="locale" value={edition.locale} />
            <input type="hidden" name="status" value="scheduled" />
            <input type="datetime-local" name="publishedAt" className="w-auto" />
            <button className="admin-btn-ghost h-9 px-3" type="submit">
              {copy.schedule}
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">{copy.authorsCannotPublish}</p>
      )}
    </div>
  );
}
