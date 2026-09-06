import { db } from "@/db";
import { redirects } from "@/db/schema";
import { requireStaff } from "@/server/auth";
import { upsertRedirectAction } from "@/server/actions/editorial";
import { voidAction } from "@/server/actions/form";
import { getAdminCopy } from "@/server/desk-copy";
import { DeskHeader, KpiGrid } from "@/components/admin/DeskChrome";

export default async function RedirectsPage() {
  await requireStaff();
  const copy = await getAdminCopy();
  const rows = await db.select().from(redirects);
  const c301 = rows.filter((r) => r.type === "301").length;
  const c302 = rows.filter((r) => r.type === "302").length;
  return (
    <div>
      <DeskHeader kicker={copy.audience} title={copy.redirects} lead={copy.redirectsLead} />
      <KpiGrid
        items={[
          { label: copy.redirects, value: rows.length },
          { label: copy.kpi301, value: c301 },
          { label: copy.kpi302, value: c302 },
        ]}
      />
      {rows.length === 0 ? (
        <p className="mb-6 text-sm text-on-surface-variant">{copy.emptyRedirects}</p>
      ) : (
      <div className="admin-card mb-6 overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{copy.colType}</th>
              <th>{copy.colFrom}</th>
              <th>{copy.colTo}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className={r.type === "301" ? "admin-status admin-status-live" : "admin-status admin-status-scheduled"}>
                    {r.type}
                  </span>
                </td>
                <td className="font-mono-num">{r.fromPath}</td>
                <td className="font-mono-num">{r.toPath}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      <form action={voidAction(upsertRedirectAction)} className="admin-card max-w-xl space-y-3 p-4 text-sm">
        <p className="font-medium">{copy.newRule}</p>
        <input name="fromPath" placeholder="/en/article/old" />
        <input name="toPath" placeholder="/en/article/new" />
        <select name="type">
          <option>301</option>
          <option>302</option>
        </select>
        <button className="admin-btn-primary h-9 px-3">{copy.save}</button>
      </form>
    </div>
  );
}
