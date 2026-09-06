export const LOCALES = ["en", "ar", "ckb"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "en" ? "ltr" : "rtl";
}

const RTL_RANGE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const LTR_RANGE = /[A-Za-z]/g;

/** Script-weighted dir. Falls back to locale when mixed or empty. */
export function detectDir(text: string, fallback: "rtl" | "ltr"): "rtl" | "ltr" {
  const rtl = text.match(RTL_RANGE)?.length ?? 0;
  const ltr = text.match(LTR_RANGE)?.length ?? 0;
  if (rtl === 0 && ltr === 0) return fallback;
  if (rtl > ltr * 1.2) return "rtl";
  if (ltr > rtl * 1.2) return "ltr";
  return fallback;
}

export function htmlLangOf(locale: Locale): string {
  return locale;
}

/** Google hreflang: ISO 639-1 (+ script). ckb is 639-3 — emit ku-Arab. */
export function hreflangOf(locale: Locale): string {
  if (locale === "ckb") return "ku-Arab";
  return locale;
}

export function ogLocaleOf(locale: Locale): string {
  if (locale === "en") return "en_US";
  if (locale === "ar") return "ar_AR";
  return "ckb_IQ";
}

export function intlLocaleOf(locale: Locale): string {
  if (locale === "en") return "en-US";
  if (locale === "ar") return "ar-IQ";
  return "ckb-IQ";
}

export function nativeNameOf(locale: Locale): string {
  if (locale === "en") return "English";
  if (locale === "ar") return "العربية";
  return "کوردی سۆرانی";
}

export function shortCodeOf(locale: Locale): string {
  if (locale === "en") return "EN";
  if (locale === "ar") return "AR";
  return "KU";
}

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "rss",
  "search",
  "latest",
  "about",
  "contact",
  "privacy",
  "terms",
  "newsletter",
  "sitemap",
  "robots",
  "og",
  "article",
  "category",
  "tag",
  "author",
]);
