import type { Locale } from "@/lib/locales";

export const BRAND = {
  short: "Herald",
  cms: "Herald CMS",
  names: {
    en: "Herald",
    ar: "هيرالد",
    ckb: "هێراڵد",
  } satisfies Record<Locale, string>,
} as const;

export function brandName(locale: Locale, override?: string | null) {
  const trimmed = override?.trim();
  return trimmed || BRAND.names[locale];
}

export function brandNameFromSettings(
  settings: { locales?: unknown } | null | undefined,
  locale: Locale,
) {
  const locales = settings?.locales as Record<string, { name?: string }> | undefined;
  return brandName(locale, locales?.[locale]?.name);
}
