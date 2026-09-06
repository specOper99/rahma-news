import { requireStaff, canPublish } from "@/server/auth";
import { listTagsAdmin } from "@/server/dal/articles";
import { upsertTagAction } from "@/server/actions/editorial";
import { voidAction } from "@/server/actions/form";
import { LOCALES } from "@/lib/locales";
import { getAdminCopy } from "@/server/desk-copy";
import { DeskHeader, KpiGrid, LocaleTrio } from "@/components/admin/DeskChrome";

export default async function TagsPage() {
  const staff = await requireStaff();
  const copy = await getAdminCopy();
  const rows = await listTagsAdmin();
  const can = canPublish(staff.role);
  const localized = rows.filter((c) => LOCALES.every((l) => c.translations.some((t) => t.locale === l && t.name))).length;
  return (
    <div>
      <DeskHeader kicker={copy.taxonomy} title={copy.tags} lead={copy.tagsLead} />
      <KpiGrid
        items={[
          { label: copy.tags, value: rows.length },
          { label: copy.kpiLocalized, value: localized },
        ]}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((c) => (
          <form key={c.id} action={voidAction(upsertTagAction)} className="admin-card space-y-3 p-4 text-sm">
            <input type="hidden" name="id" value={c.id} />
            <LocaleTrio
              items={LOCALES.map((l) => {
                const tr = c.translations.find((t) => t.locale === l);
                return { locale: l, name: tr?.name, slug: tr?.slug, missing: !tr?.name };
              })}
            />
            {LOCALES.map((l) => {
              const tr = c.translations.find((t) => t.locale === l);
              return (
                <span key={l} className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase text-outline">{l}</span>
                  <input name={`name_${l}`} defaultValue={tr?.name ?? ""} />
                  <input name={`slug_${l}`} defaultValue={tr?.slug ?? ""} />
                </span>
              );
            })}
            {can ? <button className="admin-btn-primary h-9 px-3">{copy.save}</button> : null}
          </form>
        ))}
        {can ? (
          <form action={voidAction(upsertTagAction)} className="admin-card space-y-3 p-4 text-sm">
            <p className="font-medium">{copy.newTag}</p>
            {LOCALES.map((l) => (
              <span key={l} className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase text-outline">{l}</span>
                <input name={`name_${l}`} />
                <input name={`slug_${l}`} />
              </span>
            ))}
            <button className="admin-btn-primary h-9 px-3">{copy.save}</button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
