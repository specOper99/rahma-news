import type { ReactNode } from "react";

export function PublicMain({
  title,
  kicker,
  children,
  wide,
  aside,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
  wide?: boolean;
  aside?: ReactNode;
}) {
  return (
    <main id="main" className="mx-auto max-w-[90rem] px-4 py-8 sm:px-8">
      <header className="mb-8 flex items-end gap-3 border-b-2 border-primary pb-2.5">
        <span className="h-7 w-3.5 shrink-0 rounded-sm bg-primary" />
        <div>
          {kicker ? (
            <p className="font-ui text-xs font-bold uppercase tracking-wider text-secondary">{kicker}</p>
          ) : null}
          <h1 className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">{title}</h1>
        </div>
      </header>
      {aside ? (
        <div className="grid items-start gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">{children}</div>
          <aside className="space-y-6 lg:col-span-4">{aside}</aside>
        </div>
      ) : (
        <div className={wide ? "" : "max-w-3xl"}>{children}</div>
      )}
    </main>
  );
}
