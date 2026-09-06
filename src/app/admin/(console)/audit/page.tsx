import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, user } from "@/db/schema";
import { requireStaff } from "@/server/auth";
import { getAdminCopy } from "@/server/desk-copy";
import { DeskHeader, KpiGrid } from "@/components/admin/DeskChrome";

export default async function AuditPage() {
  await requireStaff();
  const copy = await getAdminCopy();
  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      createdAt: auditLog.createdAt,
      email: user.email,
    })
    .from(auditLog)
    .leftJoin(user, eq(user.id, auditLog.actorUserId))
    .orderBy(desc(auditLog.createdAt))
    .limit(100);
  const byAction = new Map<string, number>();
  for (const r of rows) {
    byAction.set(r.action, (byAction.get(r.action) ?? 0) + 1);
  }
  return (
    <div>
      <DeskHeader kicker={copy.audience} title={copy.audit} lead={copy.auditLead} />
      <KpiGrid
        items={[
          { label: copy.audit, value: rows.length },
          { label: copy.publish, value: byAction.get("publish") ?? 0 },
          { label: copy.save, value: byAction.get("update") ?? 0 },
        ]}
      />
      {rows.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{copy.auditEmpty}</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="admin-card flex flex-wrap items-baseline justify-between gap-3 p-4 text-sm">
              <div>
                <p className="font-mono-num text-[11px] uppercase text-outline">{r.createdAt.toISOString()}</p>
                <p className="mt-1 font-medium">{r.action}</p>
                <p className="text-[11px] text-on-surface-variant">{r.entityType}</p>
              </div>
              <span className="text-xs text-on-surface-variant">{r.email ?? copy.systemActor}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
