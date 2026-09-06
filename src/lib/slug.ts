import type { Locale } from "@/lib/locales";
import { RESERVED_SLUGS } from "@/lib/locales";

export function slugify(title: string, locale: Locale): string {
  const nfc = title.normalize("NFC").trim();
  if (locale === "en") {
    return nfc
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }
  return nfc
    .replace(/\s+/g, "-")
    .replace(/[\/?#]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isValidSlug(slug: string, locale: Locale): boolean {
  if (!slug || slug.length > 80) return false;
  if (RESERVED_SLUGS.has(slug.toLowerCase())) return false;
  if (/[\s\/?#]/.test(slug)) return false;
  if (slug !== slug.normalize("NFC")) return false;
  if (locale === "en") return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  return slug.length > 0;
}

export function draftSlug(locale: Locale): string {
  const stamp = Date.now().toString(36);
  if (locale === "en") return `untitled-${stamp}`;
  if (locale === "ar") return `بدون-عنوان-${stamp}`;
  return `بێ-ناونیشان-${stamp}`;
}

export function isPlaceholderSlug(slug: string): boolean {
  return /^(untitled|draft|بدون-عنوان|بێ-ناونیشان)(-|$)/i.test(slug);
}

export function uploadBasename(filename: string): string {
  const leaf = filename.split(/[/\\]/).pop() ?? filename;
  const raw = leaf.replace(/\.[^.]+$/, "").normalize("NFC").trim();
  const ascii = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  if (ascii.length >= 2) return ascii;
  const keep = raw.replace(/[/?#\s]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return keep || "image";
}
