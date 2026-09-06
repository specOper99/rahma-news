import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/locales";

export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  localeDetection: true,
  alternateLinks: false,
});
