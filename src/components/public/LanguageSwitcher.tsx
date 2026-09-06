import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { LOCALES, nativeNameOf, shortCodeOf, type Locale } from "@/lib/locales";
import { resolveLanguageHrefs } from "@/server/dal/switcher";
import { getLiveLocaleCounts } from "@/server/dal/articles";

export async function LanguageSwitcher({
  locale,
  variant = "header",
}: {
  locale: Locale;
  variant?: "header" | "compact";
}) {
  const t = await getTranslations("Nav");
  const h = await headers();
  const pathname = h.get("x-pathname") || h.get("next-url") || `/${locale}`;
  let hrefs;
  try {
    hrefs = await resolveLanguageHrefs(pathname);
  } catch {
    hrefs = {
      en: { href: "/en", available: true },
      ar: { href: "/ar", available: true },
      ckb: { href: "/ckb", available: true },
    };
  }
  let counts: Record<Locale, number> = { en: 0, ar: 0, ckb: 0 };
  try {
    counts = await getLiveLocaleCounts();
  } catch {
    /* db down */
  }

  return (
    <div
      className="flex items-center rounded border border-border-muted bg-surface-container-lowest p-0.5 text-[11px] shadow-[0_1px_2px_rgb(11_19_32/0.05)]"
      role="navigation"
      aria-label={t("language")}
    >
      {LOCALES.map((l) => {
        const item = hrefs[l];
        const active = l === locale;
        const count = counts[l];
        return (
          <a
            key={l}
            href={item.href}
            hrefLang={l === "ckb" ? "ku-Arab" : l}
            lang={l}
            aria-current={active ? "page" : undefined}
            title={item.available ? nativeNameOf(l) : t("unavailable")}
            className={
              active
                ? "inline-flex items-center gap-1 rounded bg-primary px-2 py-0.5 font-bold text-on-primary shadow-sm"
                : item.available
                  ? "inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium text-on-surface-variant transition-colors duration-150 hover:text-secondary"
                  : "inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium text-on-surface-variant opacity-50"
            }
          >
            {active ? <span className="size-1.5 rounded-full bg-live" /> : null}
            <span>{variant === "compact" ? shortCodeOf(l) : nativeNameOf(l)}</span>
            {variant === "header" && count > 0 && !active ? (
              <span className="rounded bg-surface-container px-1 font-mono-num text-[10px] text-outline">
                {count}
              </span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
