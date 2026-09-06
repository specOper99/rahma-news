import { requireStaff } from "@/server/auth";
import { listMediaAdmin } from "@/server/dal/articles";
import { updateMediaMetaAction, uploadMediaAction } from "@/server/actions/editorial";
import { voidAction } from "@/server/actions/form";
import { getAdminCopy } from "@/server/desk-copy";
import { DeskHeader, KpiGrid } from "@/components/admin/DeskChrome";
import { LOCALES } from "@/lib/locales";
import { mediaLabel } from "@/lib/format";
import { FileDropzone } from "@/components/admin/FileDropzone";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireStaff();
  const copy = await getAdminCopy();
  const items = await listMediaAdmin();
  const { id } = await searchParams;
  const selected = items.find((m) => m.id === id) ?? items[0] ?? null;
  return (
    <div>
      <DeskHeader kicker={copy.taxonomy} title={copy.media} lead={copy.mediaLead} />
      <KpiGrid items={[{ label: copy.kpiAssets, value: items.length }]} />
      <form action={voidAction(uploadMediaAction)} className="admin-card mb-6 grid gap-3 p-4 text-sm md:grid-cols-3">
        <FileDropzone
          name="file"
          required
          className="md:col-span-3"
          labels={{
            drop: copy.dropImage,
            browse: copy.browseImage,
            selected: copy.fileSelected,
          }}
        />
        {LOCALES.map((l) => (
          <fieldset key={l} className="grid gap-2">
            <legend className="text-[11px] font-semibold uppercase text-outline">{l}</legend>
            <input name={`alt_${l}`} placeholder={copy.alt} />
            <input name={`caption_${l}`} placeholder={copy.caption} />
            <input name={`credit_${l}`} placeholder={copy.credit} />
          </fieldset>
        ))}
        <button className="admin-btn-primary h-9 px-3 md:col-span-3">{copy.save}</button>
      </form>
      {items.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{copy.mediaEmpty}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <ul className="grid grid-cols-2 gap-3 lg:col-span-8 md:grid-cols-3">
            {items.map((m) => (
              <li key={m.id}>
                <a
                  href={`/admin/media?id=${m.id}`}
                  className={`admin-card block p-2 ${selected?.id === m.id ? "ring-2 ring-secondary" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.storageKey} alt="" className="h-24 w-full rounded object-cover" />
                  <p className="mt-2 truncate text-[11px] text-on-surface-variant">{mediaLabel(m)}</p>
                </a>
              </li>
            ))}
          </ul>
          {selected ? (
            <aside className="admin-card space-y-3 p-4 text-sm lg:col-span-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-outline">{copy.inspector}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.storageKey} alt="" className="w-full rounded object-cover" />
              <p className="text-sm font-medium">{mediaLabel(selected)}</p>
              <p className="font-mono-num text-[11px] text-on-surface-variant">
                {selected.width}×{selected.height} · {selected.mime}
              </p>
              <form action={voidAction(updateMediaMetaAction)} className="grid gap-3">
                <input type="hidden" name="id" value={selected.id} />
                {LOCALES.map((l) => {
                  const tr = selected.translations.find((t) => t.locale === l);
                  return (
                    <fieldset key={l} className="grid gap-2">
                      <legend className="text-[11px] font-semibold uppercase text-outline">{l}</legend>
                      <input name={`alt_${l}`} defaultValue={tr?.alt ?? ""} placeholder={copy.alt} />
                      <input name={`caption_${l}`} defaultValue={tr?.caption ?? ""} placeholder={copy.caption} />
                      <input name={`credit_${l}`} defaultValue={tr?.credit ?? ""} placeholder={copy.credit} />
                    </fieldset>
                  );
                })}
                <button className="admin-btn-primary h-9 px-3">{copy.updateAsset}</button>
              </form>
            </aside>
          ) : null}
        </div>
      )}
    </div>
  );
}
