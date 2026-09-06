import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locales";
import { PublicMain } from "@/components/public/PublicMain";
import { LegalRail } from "@/components/public/LegalRail";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Legal");
  return (
    <PublicMain title={t("termsTitle")} kicker={t("termsKicker")} aside={<LegalRail />}>
      <p className="max-w-[65ch] text-lg leading-relaxed text-on-surface">{t("termsBody")}</p>
    </PublicMain>
  );
}
