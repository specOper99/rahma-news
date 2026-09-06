import { deepMergeMessages } from "@/lib/messages";
import { isLocale, type Locale } from "@/lib/locales";
import enMessages from "../../messages/en.json";
import arMessages from "../../messages/ar.json";
import ckbMessages from "../../messages/ckb.json";

export const DESK_LOCALE_COOKIE = "herald-desk-locale";

export type AdminCopy = typeof enMessages.Admin;

export function resolveDeskLocale(desk?: string | null, next?: string | null): Locale {
  if (desk && isLocale(desk)) return desk;
  if (next && isLocale(next)) return next;
  return "en";
}

export { interpolate } from "@/lib/interpolate";

export function statusLabel(copy: AdminCopy, status: string): string {
  if (status === "in_review") return copy.inReview;
  if (status === "draft") return copy.draft;
  if (status === "scheduled") return copy.scheduled;
  if (status === "published") return copy.published;
  if (status === "archived") return copy.archived;
  return status || copy.missing;
}

export function editionHeadline(
  editions: { title: string; locale: string }[],
  locale: Locale,
  untitled: string,
): string {
  return (
    editions.find((e) => e.locale === locale)?.title ||
    editions.find((e) => e.locale === "en")?.title ||
    editions.find((e) => e.locale === "ar")?.title ||
    editions[0]?.title ||
    untitled
  );
}

export function localizedField(
  translations: { locale: string; name?: string | null }[],
  locale: Locale,
  fallback = "",
): string {
  return (
    translations.find((t) => t.locale === locale)?.name ||
    translations.find((t) => t.locale === "en")?.name ||
    translations.find((t) => t.name)?.name ||
    fallback
  );
}

export function adminCopyFor(locale: Locale): AdminCopy {
  const en = enMessages.Admin as AdminCopy;
  if (locale === "en") return en;
  const ar = deepMergeMessages(en, arMessages.Admin as Record<string, unknown>) as AdminCopy;
  if (locale === "ar") return ar;
  return deepMergeMessages(ar, ckbMessages.Admin as Record<string, unknown>) as AdminCopy;
}
