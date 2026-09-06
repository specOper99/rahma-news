import { LOCALES, nativeNameOf, shortCodeOf, type Locale } from "@/lib/locales";
import { getTranslations } from "next-intl/server";
import type { SwitcherLink } from "@/server/dal/switcher";

export async function EditionBar({
  locale,
  hrefs,
}: {
  locale: Locale;
  hrefs: Record<Locale, SwitcherLink>;
}) {
  const t = await getTranslations("Article");
  return (
    <div className="mb-4 flex flex-col justify-between gap-2 rounded bg-surface-container-lowest p-2 shadow-[0_1px_8px_rgba(11,19,32,0.04)] md:flex-row md:items-center">
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="me-1 font-mono-num uppercase text-outline">{t("editionsAvailable")}</span>
        {LOCALES.map((l) => {
          const item = hrefs[l];
          const active = l === locale;
          if (active) {
            return (
              <span
                key={l}
                className="inline-flex items-center gap-1.5 rounded bg-on-surface px-2.5 py-1 font-semibold text-surface-container-lowest"
              >
                <span className="size-1.5 rounded-full bg-secondary" />
                {shortCodeOf(l)} · {t("live")}
              </span>
            );
          }
          if (item.available) {
            return (
              <a
                key={l}
                href={item.href}
                lang={l}
                className="inline-flex items-center gap-1.5 rounded bg-surface-container-low px-2.5 py-1 text-on-surface transition-colors hover:bg-surface-container"
              >
                <span className="size-1.5 rounded-full bg-live" />
                <span>{item.title || nativeNameOf(l)}</span>
              </a>
            );
          }
          return (
            <a
              key={l}
              href={item.href}
              lang={l}
              title={t("unavailableEdition", { language: nativeNameOf(l) })}
              className="inline-flex items-center gap-1.5 rounded bg-surface-container-low px-2.5 py-1 text-on-surface-variant"
            >
              <span className="size-1.5 rounded-full bg-warning" />
              <span>{nativeNameOf(l)}</span>
              <span className="font-mono-num text-[10px] uppercase text-outline">
                {item.status === "in_review" ? t("inReview") : t("unavailable")}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
