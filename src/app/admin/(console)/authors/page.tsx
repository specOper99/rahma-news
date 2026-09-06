import { requireStaff, canPublish } from "@/server/auth";
import { listAuthorsAdmin, listMediaAdmin } from "@/server/dal/articles";
import { upsertAuthorAction } from "@/server/actions/editorial";
import { voidAction } from "@/server/actions/form";
import { LOCALES } from "@/lib/locales";
import { getAdminCopy } from "@/server/desk-copy";
import { DeskHeader, KpiGrid, LocaleTrio } from "@/components/admin/DeskChrome";
import { FileDropzone } from "@/components/admin/FileDropzone";

export default async function AuthorsPage() {
  const staff = await requireStaff();
  const copy = await getAdminCopy();
  const rows = await listAuthorsAdmin();
  const mediaItems = await listMediaAdmin();
  const can = canPublish(staff.role) || staff.role === "author";
  const localized = rows.filter((a) => LOCALES.every((l) => a.translations.some((t) => t.locale === l && t.name))).length;
  return (
    <div>
      <DeskHeader kicker={copy.taxonomy} title={copy.authors} lead={copy.authorsLead} />
      <KpiGrid
        items={[
          { label: copy.authors, value: rows.length },
          { label: copy.kpiLocalized, value: localized },
        ]}
      />
      <div className="admin-card mb-6 overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>EN</th>
              <th>AR</th>
              <th>CKB</th>
              <th>{copy.photo}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const byLoc = Object.fromEntries(a.translations.map((t) => [t.locale, t]));
              return (
                <tr key={a.id}>
                  {(["en", "ar", "ckb"] as const).map((l) => (
                    <td key={l}>{byLoc[l]?.name ?? "—"}</td>
                  ))}
                  <td className="font-mono-num text-[11px]">{a.photoMediaId ? copy.hasPhoto : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-4">
        {rows.map((a) => (
          <form key={a.id} action={voidAction(upsertAuthorAction)} className="admin-card space-y-3 p-4 text-sm">
            <input type="hidden" name="id" value={a.id} />
            <div className="flex flex-wrap justify-between gap-3">
              <LocaleTrio
                items={LOCALES.map((l) => {
                  const tr = a.translations.find((t) => t.locale === l);
                  return { locale: l, name: tr?.name, slug: tr?.slug, missing: !tr?.name };
                })}
              />
            </div>
            <input name="slug" defaultValue={a.slug} />
            <div>
              <p className="mb-1">{copy.photo}</p>
              <input type="hidden" name="photoMediaId" value={a.photoMediaId ?? ""} />
              <FileDropzone
                name="photoFile"
                previewSrc={mediaItems.find((m) => m.id === a.photoMediaId)?.storageKey}
                labels={{
                  drop: copy.dropImage,
                  browse: copy.browseImage,
                  selected: copy.fileSelected,
                }}
              />
              {a.photoMediaId ? (
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <input type="checkbox" name="clearPhoto" />
                  {copy.removePhoto}
                </label>
              ) : null}
            </div>
            {LOCALES.map((l) => {
              const tr = a.translations.find((t) => t.locale === l);
              return (
                <fieldset key={l} className="grid gap-2">
                  <legend className="text-[11px] font-semibold uppercase text-outline">{l}</legend>
                  <input name={`name_${l}`} defaultValue={tr?.name ?? ""} />
                  <input name={`slug_${l}`} defaultValue={tr?.slug ?? ""} />
                  <input name={`bio_${l}`} defaultValue={tr?.bio ?? ""} />
                </fieldset>
              );
            })}
            {can ? <button className="admin-btn-primary h-9 px-3">{copy.save}</button> : null}
          </form>
        ))}
        {can ? (
          <form action={voidAction(upsertAuthorAction)} className="admin-card space-y-3 p-4 text-sm">
            <p className="font-medium">{copy.newAuthor}</p>
            <input name="slug" placeholder={copy.keyField} />
            <div>
              <p className="mb-1">{copy.photo}</p>
              <FileDropzone
                name="photoFile"
                labels={{
                  drop: copy.dropImage,
                  browse: copy.browseImage,
                  selected: copy.fileSelected,
                }}
              />
            </div>
            {LOCALES.map((l) => (
              <fieldset key={l} className="grid gap-2">
                <legend className="text-[11px] font-semibold uppercase text-outline">{l}</legend>
                <input name={`name_${l}`} />
                <input name={`slug_${l}`} />
              </fieldset>
            ))}
            <button className="admin-btn-primary h-9 px-3">{copy.save}</button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
