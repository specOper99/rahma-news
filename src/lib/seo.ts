import type { Locale } from "@/lib/locales";
import { DEFAULT_LOCALE, hreflangOf } from "@/lib/locales";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export type Alternate = { locale: Locale; url: string };

export function hreflangMap(
  alts: Alternate[],
  xDefaultUrl?: string,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const a of alts) {
    languages[hreflangOf(a.locale)] = a.url;
  }
  const ar = alts.find((a) => a.locale === DEFAULT_LOCALE);
  languages["x-default"] = xDefaultUrl ?? ar?.url ?? alts[0]?.url ?? siteUrl();
  return languages;
}

export function neverEmitCkbHreflang(languages: Record<string, string>): boolean {
  return !Object.keys(languages).includes("ckb");
}
