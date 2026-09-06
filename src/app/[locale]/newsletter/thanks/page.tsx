import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locales";
import { PublicMain } from "@/components/public/PublicMain";
import { LegalRail } from "@/components/public/LegalRail";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function NewsletterThanksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  setRequestLocale(raw);
  const t = await getTranslations("Newsletter");
  return (
    <PublicMain title={t("thanks")} kicker={t("thanksKicker")} aside={<LegalRail />}>
      <p className="max-w-[65ch] text-lg leading-relaxed text-on-surface-variant">{t("blurb")}</p>
    </PublicMain>
  );
}
