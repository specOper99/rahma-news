import type { Locale } from "@/lib/locales";

export function readingTime(text: string, locale: Locale): {
  wordCount: number;
  readingTimeMin: number;
} {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  if (locale === "en") {
    return { wordCount: words, readingTimeMin: Math.max(1, Math.round(words / 220)) };
  }
  if (words < 20 && trimmed.length > 400) {
    return {
      wordCount: words,
      readingTimeMin: Math.max(1, Math.round(trimmed.length / 500)),
    };
  }
  return { wordCount: words, readingTimeMin: Math.max(1, Math.round(words / 180)) };
}
