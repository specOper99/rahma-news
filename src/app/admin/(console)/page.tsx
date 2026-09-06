import Link from "next/link";
import { count, isNull } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages, newsletterSubscribers } from "@/db/schema";
import { createArticleAction } from "@/server/actions/editorial";
import { requireStaff } from "@/server/auth";
import { listAdminArticles } from "@/server/dal/articles";
import { editionHeadline, statusLabel } from "@/lib/admin-copy";
import { getAdminCopy, getDeskLocale } from "@/server/desk-copy";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

function statusClass(status: string) {
  if (status === "in_review") return "admin-status admin-status-review";
  if (status === "scheduled") return "admin-status admin-status-scheduled";
  if (status === "published") return "admin-status admin-status-live";
  if (status === "archived") return "admin-status admin-status-muted";
  return "admin-status admin-status-draft";
}

function localeDot(status?: string) {
  if (status === "published") return "bg-live";
  if (status === "in_review") return "bg-warning";
  if (status === "scheduled") return "bg-secondary";
  if (status === "draft") return "bg-outline";
  return "bg-error";
}

export default async function AdminHome() {
  await requireStaff();
  const [copy, locale] = await Promise.all([getAdminCopy(), getDeskLocale()]);
  const articles = await listAdminArticles();
  const editions = articles.flatMap((a) => a.editions);
  const drafts = editions.filter((e) => e.status === "draft");
  const review = editions.filter((e) => e.status === "in_review");
  const scheduled = editions.filter((e) => e.status === "scheduled");
  const breaking = articles.filter((a) => a.article.isBreaking);
  const [subRow] = await db
    .select({ n: count() })
    .from(newsletterSubscribers)
    .where(isNull(newsletterSubscribers.unsubscribedAt));
  const [inboxRow] = await db.select({ n: count() }).from(contactMessages);
  const subCount = Number(subRow?.n ?? 0);
  const inboxCount = Number(inboxRow?.n ?? 0);

  const queue = [...review, ...drafts, ...scheduled]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 12);

  const gaps = articles
    .map((row) => {
      const byLoc = Object.fromEntries(row.editions.map((e) => [e.locale, e]));
      const missing = (["en", "ar", "ckb"] as const).filter((l) => byLoc[l]?.status !== "published");
      return { id: row.article.id, title: editionHeadline(row.editions, locale, copy.untitled), missing };
    })
    .filter((g) => g.missing.length > 0)
    .slice(0, 6);

  const kpis = [
    { href: "/admin/articles", label: copy.draft, value: drafts.length, hint: copy.kpiOpenDesk },
    { href: "/admin/articles?view=review", label: copy.inReview, value: review.length, hint: copy.kpiReview, accent: true },
    { href: "/admin/articles", label: copy.scheduled, value: scheduled.length, hint: copy.kpiUpcoming },
    { href: "/admin/articles?view=breaking", label: copy.breaking, value: breaking.length, hint: copy.kpiLive, danger: true },
    { href: "/admin/inbox", label: copy.inbox, value: inboxCount, hint: copy.kpiMessages },
    { href: "/admin/subscribers", label: copy.subscribers, value: subCount, hint: copy.kpiList },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{copy.dashboard}</h1>
            <span className="rounded bg-surface-container px-2 py-0.5 font-mono-num text-[11px] font-medium text-on-surface-variant">
              {copy.deskMatrix}
            </span>
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">{copy.deskLead}</p>
        </div>
        <form
          action={async () => {
            "use server";
            const res = await createArticleAction();
            if (res.ok) redirect(`/admin/articles/${res.id}?locale=en`);
          }}
        >
          <button type="submit" className="admin-btn-primary h-9 px-3.5">
            <Icon name="plus" size={16} />
            {copy.newArticle}
          </button>
        </form>
      </div>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={`admin-card flex flex-col justify-between p-3.5 transition-colors hover:bg-surface-container-low ${
              kpi.danger ? "bg-error-container/40 hover:bg-error-container/60" : ""
            }`}
          >
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${kpi.danger ? "text-on-error-container" : "text-outline"}`}>
              {kpi.label}
            </p>
            <p className={`mt-2 font-mono-num text-3xl font-semibold leading-none ${kpi.accent ? "text-secondary" : kpi.danger ? "text-on-error-container" : "text-on-surface"}`}>
              {kpi.value}
            </p>
            <p className={`mt-2 text-xs ${kpi.danger ? "text-on-error-container" : "text-on-surface-variant"}`}>
              {kpi.hint}
            </p>
          </Link>
        ))}
      </section>

      {breaking.length > 0 ? (
        <section className="admin-card relative overflow-hidden p-4">
          <div className="absolute inset-y-0 start-0 w-1.5 bg-error" />
          <div className="flex items-center justify-between ps-2">
            <span className="inline-flex items-center gap-1 rounded bg-error px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-on-error">
              <Icon name="bolt" size={14} />
              {copy.breakingDesk} ({breaking.length})
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 ps-2 lg:grid-cols-2">
            {breaking.map((a) => {
              const byLoc = Object.fromEntries(a.editions.map((e) => [e.locale, e]));
              return (
                <div key={a.article.id} className="flex flex-col gap-2 rounded bg-surface-container-low/80 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold leading-snug">
                      {editionHeadline(a.editions, locale, copy.untitled)}
                    </h3>
                    <Link href={`/admin/articles/${a.article.id}`} className="admin-btn-primary h-8 shrink-0 px-2.5">
                      {copy.openStory}
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2 font-mono-num text-[11px]">
                    {(["en", "ar", "ckb"] as const).map((l) => (
                      <span key={l} className="inline-flex items-center gap-1 rounded bg-surface-container-highest px-2 py-0.5">
                        <span className={`size-1.5 rounded-full ${localeDot(byLoc[l]?.status)}`} />
                        <strong>{l.toUpperCase()}:</strong> {byLoc[l] ? statusLabel(copy, byLoc[l].status) : copy.missing}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="admin-card min-w-0 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
            <h2 className="text-[15px] font-semibold">{copy.needsAttention}</h2>
            <Link href="/admin/articles" className="text-xs text-on-surface-variant hover:text-on-surface">
              {copy.articles}
            </Link>
          </div>
          {queue.length === 0 ? (
            <p className="px-5 py-10 text-sm text-on-surface-variant">{copy.emptyQueue}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[32rem]">
                <thead>
                  <tr>
                    <th>{copy.colTitle}</th>
                    <th>{copy.colLocale}</th>
                    <th>{copy.colStatus}</th>
                    <th>{copy.colUpdated}</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((e) => (
                    <tr key={e.id}>
                      <td className="max-w-[20rem] truncate">
                        <Link href={`/admin/articles/${e.articleId}`} className="hover:underline">
                          {e.title || copy.untitled}
                        </Link>
                      </td>
                      <td className="uppercase text-on-surface-variant">{e.locale}</td>
                      <td>
                        <span className={statusClass(e.status)}>{statusLabel(copy, e.status)}</span>
                      </td>
                      <td className="font-mono-num text-on-surface-variant">
                        {e.updatedAt.toISOString().slice(0, 16).replace("T", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-card lg:col-span-4">
          <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
            <h2 className="text-[15px] font-semibold">{copy.coverage}</h2>
            <Link href="/admin/articles?view=coverage" className="text-xs text-on-surface-variant hover:text-on-surface">
              {copy.coverage}
            </Link>
          </div>
          {gaps.length === 0 ? (
            <p className="px-5 py-8 text-sm text-on-surface-variant">{copy.emptyCoverage}</p>
          ) : (
            <ul className="divide-y divide-outline-variant text-[13px]">
              {gaps.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <Link href={`/admin/articles/${g.id}`} className="min-w-0 truncate hover:underline">
                    {g.title}
                  </Link>
                  <span className="shrink-0 font-mono-num text-[11px] uppercase text-on-surface-variant">
                    {g.missing.join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
