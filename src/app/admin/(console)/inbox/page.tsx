import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { requireStaff } from "@/server/auth";
import { getAdminCopy } from "@/server/desk-copy";
import { DeskHeader, KpiGrid } from "@/components/admin/DeskChrome";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; locale?: string }>;
}) {
  await requireStaff();
  const copy = await getAdminCopy();
  const { id, locale } = await searchParams;
  const all = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  const rows = locale ? all.filter((r) => r.locale === locale) : all;
  const selected = rows.find((r) => r.id === id) ?? rows[0] ?? null;
  const byLoc = {
    en: all.filter((r) => r.locale === "en").length,
    ar: all.filter((r) => r.locale === "ar").length,
    ckb: all.filter((r) => r.locale === "ckb").length,
  };
  return (
    <div>
      <DeskHeader kicker={copy.audience} title={copy.inbox} lead={copy.inboxLead} />
      <KpiGrid
        items={[
          { label: copy.inbox, value: all.length, href: "/admin/inbox" },
          { label: "EN", value: byLoc.en, href: "/admin/inbox?locale=en" },
          { label: "AR", value: byLoc.ar, href: "/admin/inbox?locale=ar" },
          { label: "CKB", value: byLoc.ckb, href: "/admin/inbox?locale=ckb" },
        ]}
      />
      {rows.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{copy.inboxEmpty}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          <ul className="space-y-2 lg:col-span-5">
            {rows.map((r) => (
              <li key={r.id}>
                <a
                  href={`/admin/inbox?id=${r.id}${locale ? `&locale=${locale}` : ""}`}
                  className={`admin-card block p-3 text-sm ${selected?.id === r.id ? "ring-2 ring-secondary" : ""}`}
                >
                  <p className="font-medium">
                    {r.name} <span className="uppercase text-outline">· {r.locale}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-on-surface-variant">{r.message}</p>
                  <p className="mt-2 font-mono-num text-[11px] text-outline">{r.createdAt.toISOString().slice(0, 16)}</p>
                </a>
              </li>
            ))}
          </ul>
          {selected ? (
            <article className="admin-card p-5 text-sm lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-outline">{copy.inspector}</p>
              <h2 className="mt-2 font-display text-xl font-semibold">{selected.name}</h2>
              <p className="font-mono-num text-xs text-on-surface-variant">
                {selected.email} · {selected.locale.toUpperCase()} · {selected.createdAt.toISOString()}
              </p>
              <p className="mt-4 whitespace-pre-wrap leading-relaxed text-on-surface">{selected.message}</p>
            </article>
          ) : null}
        </div>
      )}
    </div>
  );
}
