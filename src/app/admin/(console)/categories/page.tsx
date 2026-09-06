import { requireStaff, canPublish } from "@/server/auth";
import { listCategoriesAdmin } from "@/server/dal/articles";
import { upsertCategoryAction } from "@/server/actions/editorial";
import { voidAction } from "@/server/actions/form";
import { LOCALES } from "@/lib/locales";
import { getAdminCopy } from "@/server/desk-copy";
import { DeskHeader, KpiGrid, LocaleTrio } from "@/components/admin/DeskChrome";

export default async function CategoriesPage() {
  const staff = await requireStaff();
  const copy = await getAdminCopy();
  const cats = await listCategoriesAdmin();
  const can = canPublish(staff.role);
  const localized = cats.filter((c) => LOCALES.every((l) => c.translations.some((t) => t.locale === l && t.name))).length;
  return (
    <div>
      <DeskHeader kicker={copy.taxonomy} title={copy.categories} lead={copy.sectionsLead} />
      <KpiGrid
        items={[
          { label: copy.kpiSections, value: cats.length },
          { label: copy.kpiLocalized, value: localized },
        ]}
      />
      <div className="grid gap-4">
        {cats.map((c) => (
          <form key={c.id} action={voidAction(upsertCategoryAction)} className="admin-card space-y-3 p-4 text-sm">
            <input type="hidden" name="id" value={c.id} />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <LocaleTrio
                items={LOCALES.map((l) => {
                  const tr = c.translations.find((t) => t.locale === l);
                  return { locale: l, name: tr?.name, slug: tr?.slug, missing: !tr?.name };
                })}
              />
              <span className="font-mono-num text-[11px] text-outline">{copy.rank} {c.position}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label>
                {copy.rank}
                <input name="position" defaultValue={c.position} className="mt-1" />
              </label>
              <label>
                {copy.accent}
                <input name="color" defaultValue={c.color ?? ""} placeholder="#0051d5" className="mt-1" />
              </label>
            </div>
            {LOCALES.map((l) => {
              const tr = c.translations.find((t) => t.locale === l);
              return (
                <fieldset key={l} className="grid gap-2 md:grid-cols-3">
                  <legend className="text-[11px] font-semibold uppercase text-outline">{l}</legend>
                  <input name={`name_${l}`} defaultValue={tr?.name ?? ""} placeholder={copy.name} />
                  <input name={`slug_${l}`} defaultValue={tr?.slug ?? ""} placeholder={copy.slug} />
                  <input name={`description_${l}`} defaultValue={tr?.description ?? ""} placeholder={copy.description} />
                </fieldset>
              );
            })}
            {can ? <button className="admin-btn-primary h-9 px-3">{copy.save}</button> : null}
          </form>
        ))}
        {can ? (
          <form action={voidAction(upsertCategoryAction)} className="admin-card space-y-3 p-4 text-sm">
            <p className="font-medium">{copy.newCategory}</p>
            {LOCALES.map((l) => (
              <fieldset key={l} className="grid gap-2 md:grid-cols-3">
                <legend className="text-[11px] font-semibold uppercase text-outline">{l}</legend>
                <input name={`name_${l}`} placeholder={copy.name} />
                <input name={`slug_${l}`} placeholder={copy.slug} />
                <input name={`description_${l}`} placeholder={copy.description} />
              </fieldset>
            ))}
            <button className="admin-btn-primary h-9 px-3">{copy.save}</button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
