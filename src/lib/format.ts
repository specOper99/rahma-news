import { intlLocaleOf, type Locale } from "@/lib/locales";

export function formatStoryDate(locale: Locale, date: Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat(intlLocaleOf(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatStoryTime(locale: Locale, date: Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat(intlLocaleOf(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Baghdad",
  }).format(date);
}

export function formatClock(now: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(now);
}

export function formatMastheadDate(locale: Locale, now: Date) {
  return new Intl.DateTimeFormat(intlLocaleOf(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

export function sectionDot(index: number) {
  const dots = ["bg-secondary", "bg-primary", "bg-live", "bg-warning"] as const;
  return dots[index % dots.length];
}

export function mediaLabel(m: {
  storageKey: string;
  width?: number | null;
  height?: number | null;
  translations: { locale: string; alt: string; caption: string }[];
}) {
  const en = m.translations.find((t) => t.locale === "en");
  const alt = en?.alt.trim();
  if (alt && alt.toLowerCase() !== "image") return alt;
  const caption = en?.caption.trim();
  if (caption) return caption;
  const file = m.storageKey.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "image";
  const pretty = file.replace(/-[a-z0-9]{4,10}$/i, "").replace(/-/g, " ");
  const dim = m.width && m.height ? ` · ${m.width}×${m.height}` : "";
  return `${pretty}${dim}`;
}
