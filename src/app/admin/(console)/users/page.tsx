import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staffProfiles, user } from "@/db/schema";
import { requireRole } from "@/server/auth";
import { createStaffAction, setStaffActiveAction, setStaffRoleAction } from "@/server/actions/editorial";
import { voidAction } from "@/server/actions/form";
import { getAdminCopy } from "@/server/desk-copy";
import { DeskHeader, KpiGrid } from "@/components/admin/DeskChrome";

export default async function UsersPage() {
  await requireRole("owner", "admin");
  const copy = await getAdminCopy();
  const rows = await db
    .select()
    .from(staffProfiles)
    .innerJoin(user, eq(user.id, staffProfiles.userId));
  return (
    <div>
      <DeskHeader kicker={copy.audience} title={copy.users} lead={copy.usersLead} />
      <KpiGrid
        items={[
          { label: copy.kpiStaff, value: rows.length },
          { label: "owner", value: rows.filter((r) => r.staff_profiles.role === "owner").length },
          { label: "editor", value: rows.filter((r) => r.staff_profiles.role === "editor").length },
          { label: "author", value: rows.filter((r) => r.staff_profiles.role === "author").length },
        ]}
      />
      <div className="admin-card mb-8 overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{copy.colEmail}</th>
              <th>{copy.colRole}</th>
              <th>{copy.colActive}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user.id}>
                <td>{r.user.email}</td>
                <td>
                  <form action={voidAction(setStaffRoleAction)} className="flex max-w-xs gap-1">
                    <input type="hidden" name="userId" value={r.user.id} />
                    <select name="role" defaultValue={r.staff_profiles.role}>
                      <option>owner</option>
                      <option>admin</option>
                      <option>editor</option>
                      <option>author</option>
                    </select>
                    <button className="admin-btn-ghost h-9 px-2">{copy.save}</button>
                  </form>
                </td>
                <td>
                  <form action={voidAction(setStaffActiveAction)}>
                    <input type="hidden" name="userId" value={r.user.id} />
                    <input type="hidden" name="active" value={r.staff_profiles.active ? "false" : "true"} />
                    <button className="underline">{r.staff_profiles.active ? copy.activeOn : copy.activeOff}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={voidAction(createStaffAction)} className="admin-card max-w-xl space-y-3 p-4 text-sm">
        <p className="font-medium">{copy.createStaff}</p>
        <input name="email" type="email" required placeholder={copy.email} />
        <input name="name" placeholder={copy.name} />
        <input name="password" type="password" minLength={10} required />
        <select name="role">
          <option>author</option>
          <option>editor</option>
          <option>admin</option>
        </select>
        <button className="admin-btn-primary h-9 px-3">{copy.create}</button>
      </form>
    </div>
  );
}
