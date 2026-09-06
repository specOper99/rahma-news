import type { ReactNode } from "react";
import Link from "next/link";

export function DeskHeader({
  kicker,
  title,
  lead,
  actions,
}: {
  kicker?: string;
  title: string;
  lead?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div>
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-outline">{kicker}</p>
        ) : null}
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {lead ? <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{lead}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function KpiGrid({
  items,
}: {
  items: { href?: string; label: string; value: string | number; hint?: string; danger?: boolean }[];
}) {
  return (
    <section className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
      {items.map((kpi) => {
        const inner = (
          <>
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${kpi.danger ? "text-on-error-container" : "text-outline"}`}>
              {kpi.label}
            </p>
            <p className={`mt-2 font-mono-num text-3xl font-semibold leading-none ${kpi.danger ? "text-on-error-container" : "text-on-surface"}`}>
              {kpi.value}
            </p>
            {kpi.hint ? (
              <p className={`mt-2 text-xs ${kpi.danger ? "text-on-error-container" : "text-on-surface-variant"}`}>{kpi.hint}</p>
            ) : null}
          </>
        );
        const cls = `admin-card flex flex-col justify-between p-3.5 ${kpi.danger ? "bg-error-container/40" : ""}`;
        return kpi.href ? (
          <Link key={kpi.label} href={kpi.href} className={`${cls} transition-colors hover:bg-surface-container-low`}>
            {inner}
          </Link>
        ) : (
          <div key={kpi.label} className={cls}>
            {inner}
          </div>
        );
      })}
    </section>
  );
}

export function LocaleTrio({
  items,
}: {
  items: { locale: string; name?: string; slug?: string; missing?: boolean }[];
}) {
  return (
    <dl className="grid gap-1 font-mono-num text-[11px]">
      {items.map((item) => (
        <div key={item.locale} className="flex gap-2">
          <dt className="w-8 shrink-0 uppercase text-outline">{item.locale}</dt>
          <dd className={item.missing ? "text-on-surface-variant" : "text-on-surface"}>
            {item.name || item.slug || "—"}
            {item.slug && item.name ? <span className="text-outline"> / {item.slug}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
