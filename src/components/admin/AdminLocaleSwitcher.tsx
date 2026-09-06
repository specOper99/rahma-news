import { setDeskLocaleAction } from "@/server/actions/desk-locale";
import { LOCALES, nativeNameOf, shortCodeOf, type Locale } from "@/lib/locales";

export function AdminLocaleSwitcher({
  locale,
  label,
  variant = "compact",
}: {
  locale: Locale;
  label: string;
  variant?: "compact" | "stack";
}) {
  const pills = (
    <div
      className="flex shrink-0 items-center rounded border border-outline-variant bg-surface-container-low p-0.5"
      role="navigation"
      aria-label={label}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <form key={l} action={setDeskLocaleAction}>
            <input type="hidden" name="locale" value={l} />
            <button
              type="submit"
              lang={l}
              aria-label={nativeNameOf(l)}
              aria-current={active ? "true" : undefined}
              title={nativeNameOf(l)}
              className={
                active
                  ? "min-h-8 rounded bg-primary px-2.5 font-bold text-on-primary"
                  : "min-h-8 rounded px-2.5 font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }
            >
              {variant === "stack" ? nativeNameOf(l) : shortCodeOf(l)}
            </button>
          </form>
        );
      })}
    </div>
  );

  if (variant === "stack") {
    return (
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-outline">{label}</p>
        {pills}
      </div>
    );
  }

  return pills;
}
