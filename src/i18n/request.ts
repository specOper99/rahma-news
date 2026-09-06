import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { deepMergeMessages } from "@/lib/messages";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const en = (await import("../../messages/en.json")).default;
  const ar = (await import("../../messages/ar.json")).default;
  const ckb = (await import("../../messages/ckb.json")).default;

  let messages = en as Record<string, unknown>;
  if (locale === "ar") messages = deepMergeMessages(messages, ar as Record<string, unknown>);
  if (locale === "ckb") {
    messages = deepMergeMessages(messages, ar as Record<string, unknown>);
    messages = deepMergeMessages(messages, ckb as Record<string, unknown>);
  }

  return { locale, messages };
});
