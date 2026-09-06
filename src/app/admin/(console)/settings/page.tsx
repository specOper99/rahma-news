import { requireRole } from "@/server/auth";
import { getSettings, listCategoriesAdmin } from "@/server/dal/articles";
import { updateSettingsAction } from "@/server/actions/editorial";
import { voidAction } from "@/server/actions/form";
import { localizedField } from "@/lib/admin-copy";
import { getAdminCopy, getDeskLocale } from "@/server/desk-copy";
import { DeskHeader } from "@/components/admin/DeskChrome";

export default async function SettingsPage() {
  await requireRole("owner", "admin");
  const [copy, deskLocale] = await Promise.all([getAdminCopy(), getDeskLocale()]);
  const settings = await getSettings();
  const cats = await listCategoriesAdmin();
  const locales = (settings?.locales ?? {}) as Record<
    string,
    { name?: string; tagline?: string; footerBlurb?: string }
  >;
  const rails = ((settings?.homepageLayout as { rails?: string[] }) ?? {}).rails ?? [];
  const slugById = new Map(
    cats.map((c) => {
      const preferred = c.translations.find((t) => t.locale === deskLocale);
      const en = c.translations.find((t) => t.locale === "en");
      return [c.id, preferred?.slug || en?.slug || ""];
    }),
  );
  const railSlugs = rails.map((r) => slugById.get(r) || r);
  const railHints = cats
    .map((c) => {
      const name = localizedField(c.translations, deskLocale, "");
      const slug = slugById.get(c.id);
      return slug ? `${name} (${slug})` : name;
    })
    .filter(Boolean);
  return (
    <div className="pb-20">
      <DeskHeader kicker={copy.audience} title={copy.settings} lead={copy.settingsLead} />
      <form action={voidAction(updateSettingsAction)} className="space-y-4 text-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-outline">{copy.brand}</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {(["en", "ar", "ckb"] as const).map((l) => (
            <fieldset key={l} className="admin-card space-y-3 p-4">
              <legend className="px-1 text-[11px] font-semibold uppercase text-outline">
                {l} · {l === "en" ? copy.ltr : copy.rtl}
              </legend>
              <label className="block">
                {copy.masthead}
                <input name={`name_${l}`} defaultValue={locales[l]?.name ?? ""} className="mt-1" />
              </label>
              <label className="block">
                {copy.subtitle}
                <input name={`tagline_${l}`} defaultValue={locales[l]?.tagline ?? ""} className="mt-1" />
              </label>
              <label className="block">
                {copy.footerBlurb}
                <input name={`footer_${l}`} defaultValue={locales[l]?.footerBlurb ?? ""} className="mt-1" />
              </label>
            </fieldset>
          ))}
        </div>
        <div className="admin-card max-w-xl space-y-3 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-outline">{copy.frontpages}</p>
          <label className="block">
            {copy.contactEmail}
            <input name="contactEmail" defaultValue={settings?.contactEmail ?? ""} className="mt-1" />
          </label>
          <label className="block">
            {copy.homepageRails}
            <input name="rails" defaultValue={railSlugs.join(",")} className="mt-1 font-mono-num" />
          </label>
          <p className="text-xs text-on-surface-variant">{railHints.join(" · ")}</p>
        </div>
        <div className="sticky bottom-4 z-10 flex justify-end">
          <button className="admin-btn-primary h-10 px-4 shadow-md">{copy.save}</button>
        </div>
      </form>
    </div>
  );
}
