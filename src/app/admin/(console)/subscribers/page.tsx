import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { requireStaff } from "@/server/auth";
import { getAdminCopy } from "@/server/desk-copy";
import { DeskHeader, KpiGrid } from "@/components/admin/DeskChrome";

export default async function SubscribersPage() {
  await requireStaff();
  const copy = await getAdminCopy();
  const rows = await db.select().from(newsletterSubscribers);
  const active = rows.filter((r) => !r.unsubscribedAt);
  const csv = [
    "email,locale,created_at,unsubscribed_at",
    ...rows.map((r) => `${r.email},${r.locale},${r.createdAt.toISOString()},${r.unsubscribedAt?.toISOString() ?? ""}`),
  ].join("\n");
  const byLoc = {
    en: active.filter((r) => r.locale === "en").length,
    ar: active.filter((r) => r.locale === "ar").length,
    ckb: active.filter((r) => r.locale === "ckb").length,
  };
  return (
    <div>
      <DeskHeader
        kicker={copy.audience}
        title={copy.subscribers}
        lead={copy.subscribersLead}
        actions={
          <a className="admin-btn-ghost h-9 px-3 text-sm" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="subscribers.csv">
            {copy.exportCsv}
          </a>
        }
      />
      <KpiGrid
        items={[
          { label: copy.kpiActive, value: active.length },
          { label: "EN", value: byLoc.en },
          { label: "AR", value: byLoc.ar },
          { label: "CKB", value: byLoc.ckb },
          { label: copy.kpiUnsub, value: rows.length - active.length },
        ]}
      />
      {rows.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{copy.subscribersEmpty}</p>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{copy.colEmail}</th>
                <th>{copy.colEdition}</th>
                <th>{copy.colStatus}</th>
                <th>{copy.colCreated}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.email}</td>
                  <td className="uppercase">{r.locale}</td>
                  <td>
                    <span className={r.unsubscribedAt ? "admin-status admin-status-muted" : "admin-status admin-status-live"}>
                      {r.unsubscribedAt ? copy.unsubscribed : r.confirmed ? copy.confirmed : copy.pending}
                    </span>
                  </td>
                  <td className="font-mono-num">{r.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
