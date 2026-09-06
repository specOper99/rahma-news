import Link from "next/link";
import { listAdminArticles } from "@/server/dal/articles";
import { canPublish, requireStaff } from "@/server/auth";
import { editionHeadline, statusLabel } from "@/lib/admin-copy";
import { getAdminCopy, getDeskLocale } from "@/server/desk-copy";
import { createArticleAction, setBreakingAction, setEditionStatusAction } from "@/server/actions/editorial";
import { voidAction } from "@/server/actions/form";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { DeskHeader, KpiGrid } from "@/components/admin/DeskChrome";
import { isLocale, LOCALES, type Locale } from "@/lib/locales";

function statusClass(status?: string) {
  if (status === "in_review") return "admin-status admin-status-review";
  if (status === "scheduled") return "admin-status admin-status-scheduled";
  if (status === "published") return "admin-status admin-status-live";
  if (status === "archived") return "admin-status admin-status-muted";
  if (!status) return "admin-status admin-status-muted";
  return "admin-status admin-status-draft";
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; err?: string; locale?: string }>;
}) {
  const staff = await requireStaff();
  const [copy, locale] = await Promise.all([getAdminCopy(), getDeskLocale()]);
  const publisher = canPublish(staff.role);
  const { view, q, err, locale: locFilter } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const localeChip = isLocale(locFilter ?? "") ? (locFilter as Locale) : null;
  const all = await listAdminArticles();
  let rows = all;
  if (view === "breaking") rows = rows.filter((r) => r.article.isBreaking);
  if (view === "review") {
    rows = rows.filter((r) => r.editions.some((e) => e.status === "in_review"));
  }
  if (view === "coverage") {
    rows = rows.filter((r) => {
      const byLoc = Object.fromEntries(r.editions.map((e) => [e.locale, e]));
      return (["en", "ar", "ckb"] as const).some((l) => byLoc[l]?.status !== "published");
    });
  }
  if (query) {
    rows = rows.filter(
      (r) =>
        r.sectionName.toLowerCase().includes(query) ||
        r.leadAuthor.toLowerCase().includes(query) ||
        r.editions.some((e) => e.title.toLowerCase().includes(query) || e.slug.toLowerCase().includes(query)),
    );
  }
  const reviewEditions = all
    .flatMap((r) =>
      r.editions
        .filter((e) => e.status === "in_review")
        .filter((e) => (localeChip ? e.locale === localeChip : true))
        .map((edition) => ({ row: r, edition })),
    )
    .filter(({ row, edition }) => {
      if (!query) return true;
      return (
        row.sectionName.toLowerCase().includes(query) ||
        row.leadAuthor.toLowerCase().includes(query) ||
        edition.title.toLowerCase().includes(query) ||
        edition.slug.toLowerCase().includes(query)
      );
    });
  const title =
    view === "coverage"
      ? copy.coverage
      : view === "review"
        ? copy.reviewQueue
        : view === "breaking"
          ? copy.breakingDesk
          : copy.articles;
  const lead =
    view === "coverage"
      ? copy.catalogLead
      : view === "review"
        ? copy.reviewLead
        : view === "breaking"
          ? copy.breakingLead
          : copy.catalogLead;
  const tab = (href: string, active: boolean, label: string) => (
    <Link
      href={href}
      className={`rounded px-3 py-1 ${active ? "bg-surface-container-lowest shadow-sm" : "text-on-surface-variant"}`}
    >
      {label}
    </Link>
  );
  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (view) p.set("view", view);
    if (q) p.set("q", q);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/articles?${s}` : "/admin/articles";
  };
  return (
    <div>
      {err === "create" ? (
        <p className="mb-4 rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
          {copy.createFailed}
        </p>
      ) : null}
      <DeskHeader
        kicker={copy.desk}
        title={title}
        lead={lead}
        actions={
          <>
            <form className="flex gap-2" action="/admin/articles">
              {view ? <input type="hidden" name="view" value={view} /> : null}
              <input name="q" defaultValue={q ?? ""} placeholder={copy.searchStories} className="w-56" />
            </form>
            <form
              action={async () => {
                "use server";
                const res = await createArticleAction();
                if (res.ok) redirect(`/admin/articles/${res.id}?locale=en`);
              }}
            >
              <button className="admin-btn-primary h-9 px-3">
                <Icon name="plus" size={16} />
                {copy.newArticle}
              </button>
            </form>
          </>
        }
      />
      <KpiGrid
        items={[
          { href: "/admin/articles", label: copy.allStories, value: all.length },
          {
            href: "/admin/articles?view=review",
            label: copy.reviewQueue,
            value: all.filter((r) => r.editions.some((e) => e.status === "in_review")).length,
          },
          {
            href: "/admin/articles?view=breaking",
            label: copy.breakingDesk,
            value: all.filter((r) => r.article.isBreaking).length,
            danger: true,
          },
          {
            href: "/admin/articles?view=coverage",
            label: copy.coverageGaps,
            value: all.filter((r) => {
              const byLoc = Object.fromEntries(r.editions.map((e) => [e.locale, e]));
              return LOCALES.some((l) => byLoc[l]?.status !== "published");
            }).length,
          },
        ]}
      />
      <div className="mb-4 flex flex-wrap gap-2 text-[13px]">
        {tab("/admin/articles", !view, copy.allStories)}
        {tab("/admin/articles?view=coverage", view === "coverage", copy.coverageGaps)}
        {tab("/admin/articles?view=review", view === "review", copy.reviewQueue)}
        {tab("/admin/articles?view=breaking", view === "breaking", copy.breakingDesk)}
      </div>

      {view === "review" ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2 text-[13px]">
            <Link
              href={qs({})}
              className={`rounded px-3 py-1.5 ${!localeChip ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
            >
              {copy.allLocales} ({all.flatMap((r) => r.editions).filter((e) => e.status === "in_review").length})
            </Link>
            {LOCALES.map((l) => {
              const n = all.flatMap((r) => r.editions).filter((e) => e.status === "in_review" && e.locale === l).length;
              return (
                <Link
                  key={l}
                  href={qs({ locale: l })}
                  className={`rounded px-3 py-1.5 uppercase ${localeChip === l ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
                >
                  {l} ({n})
                </Link>
              );
            })}
          </div>
          {reviewEditions.length === 0 ? (
            <p className="text-sm text-on-surface-variant">{copy.emptyQueue}</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {reviewEditions.map(({ row, edition }) => (
                <li key={edition.id} className="admin-card flex flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="admin-status admin-status-review">{copy.inReview}</span>
                    <span className="font-mono-num text-[11px] uppercase text-outline">{edition.locale}</span>
                    {row.sectionName ? (
                      <span className="rounded bg-surface-container px-2 py-0.5 text-[11px]">{row.sectionName}</span>
                    ) : null}
                  </div>
                  <h2 className="font-display text-xl font-semibold leading-snug">{edition.title || copy.untitled}</h2>
                  <p className="font-mono-num text-[11px] text-on-surface-variant">
                    {row.leadAuthor || "—"} · {edition.updatedAt.toISOString().slice(0, 16).replace("T", " ")}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link
                      href={`/admin/articles/${row.article.id}?locale=${edition.locale}`}
                      className="admin-btn-primary h-9 px-3"
                    >
                      {copy.startReview}
                    </Link>
                    {publisher ? (
                      <form action={voidAction(setEditionStatusAction)}>
                        <input type="hidden" name="articleId" value={row.article.id} />
                        <input type="hidden" name="locale" value={edition.locale} />
                        <input type="hidden" name="status" value="published" />
                        <button className="admin-btn-ghost h-9 px-3" type="submit">
                          {copy.approve}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {view === "breaking" ? (
        rows.length === 0 ? (
          <p className="text-sm text-on-surface-variant">{copy.emptyBreaking}</p>
        ) : (
          <ul className="grid gap-4">
            {rows.map((row) => {
              const byLoc = Object.fromEntries(row.editions.map((e) => [e.locale, e]));
              return (
                <li key={row.article.id} className="admin-card relative overflow-hidden p-5">
                  <div className="absolute inset-y-0 start-0 w-1.5 bg-error" />
                  <div className="ps-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-error">
                      {copy.breaking} · {row.sectionName || copy.section}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-semibold leading-snug">
                      {editionHeadline(row.editions, locale, copy.untitled)}
                    </h2>
                    <dl className="mt-3 grid gap-1 font-mono-num text-[12px]">
                      {LOCALES.map((l) => (
                        <div key={l} className="flex gap-2">
                          <dt className="w-8 shrink-0 uppercase text-outline">{l}</dt>
                          <dd>{byLoc[l]?.title || copy.missing}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/admin/articles/${row.article.id}`} className="admin-btn-primary h-9 px-3">
                        {copy.openStory}
                      </Link>
                      {LOCALES.map((l) =>
                        byLoc[l] ? (
                          <Link
                            key={l}
                            href={`/admin/articles/${row.article.id}?locale=${l}`}
                            className="admin-btn-ghost h-9 px-3 uppercase"
                          >
                            {l}
                          </Link>
                        ) : null,
                      )}
                      {publisher ? (
                        <form action={voidAction(setBreakingAction)}>
                          <input type="hidden" name="articleId" value={row.article.id} />
                          <input type="hidden" name="isBreaking" value="false" />
                          <button className="admin-btn-ghost h-9 px-3 text-error" type="submit">
                            {copy.unsetBreaking}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : null}

      {view !== "review" && view !== "breaking" ? (
        <div className="admin-card overflow-x-auto">
          <table className="admin-table min-w-[52rem]">
            <thead>
              <tr>
                <th>{copy.colTitle}</th>
                <th>{copy.section}</th>
                <th>{copy.colAuthor}</th>
                <th>{copy.matrix}</th>
                <th className="text-end">{copy.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const byLoc = Object.fromEntries(row.editions.map((e) => [e.locale, e]));
                const headline = editionHeadline(row.editions, locale, copy.untitled);
                return (
                  <tr key={row.article.id} className="hover:bg-surface-container-low/60">
                    <td>
                      <Link href={`/admin/articles/${row.article.id}`} className="font-medium hover:underline">
                        {headline}
                      </Link>
                      <p className="mt-1 flex flex-wrap gap-1 text-[11px] text-on-surface-variant">
                        {row.article.isBreaking ? (
                          <span className="admin-status admin-status-review">{copy.breaking}</span>
                        ) : null}
                        {row.article.isFeatured ? (
                          <span className="admin-status admin-status-live">{copy.featured}</span>
                        ) : null}
                      </p>
                    </td>
                    <td>{row.sectionName || "—"}</td>
                    <td>{row.leadAuthor || "—"}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        {LOCALES.map((l) => {
                          const ed = byLoc[l];
                          if (!ed) {
                            return (
                              <span key={l} className="font-mono-num text-[11px] uppercase text-outline">
                                {l} · {copy.missing}
                              </span>
                            );
                          }
                          return (
                            <Link
                              key={l}
                              href={`/admin/articles/${row.article.id}?locale=${l}`}
                              className="inline-flex items-center gap-2 hover:underline"
                            >
                              <span className="w-6 font-mono-num text-[11px] uppercase text-outline">{l}</span>
                              <span className={statusClass(ed.status)}>{statusLabel(copy, ed.status)}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </td>
                    <td className="text-end">
                      <Link href={`/admin/articles/${row.article.id}`} className="admin-btn-ghost h-8 px-2.5">
                        {copy.openStory}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
