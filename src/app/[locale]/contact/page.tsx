import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locales";
import { submitContact } from "@/server/actions/public";
import { voidAction } from "@/server/actions/form";
import { PublicMain } from "@/components/public/PublicMain";
import { LegalRail } from "@/components/public/LegalRail";

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string; err?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Legal");
  const { sent, err } = await searchParams;
  return (
    <PublicMain title={t("contactTitle")} kicker={t("contactKicker")} aside={<LegalRail />}>
      {sent ? (
        <p className="mb-6 rounded bg-secondary-container px-4 py-3 text-sm text-on-secondary-container">
          {t("contactSent")}
        </p>
      ) : null}
      {err ? <p className="mb-6 rounded bg-error-container px-4 py-3 text-sm text-on-error-container">{t("contactError")}</p> : null}
      <p className="mb-6 max-w-[65ch] text-on-surface-variant">{t("contactIntro")}</p>
      <form className="flex max-w-xl flex-col gap-3 font-ui" action={voidAction(submitContact)}>
        <input type="hidden" name="locale" value={locale} />
        <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
        <label className="text-sm font-medium">
          {t("contactName")}
          <input name="name" required className="public-field mt-1" />
        </label>
        <label className="text-sm font-medium">
          {t("contactEmail")}
          <input type="email" name="email" required className="public-field mt-1" />
        </label>
        <label className="text-sm font-medium">
          {t("contactMessage")}
          <textarea name="message" required minLength={10} className="public-field mt-1 min-h-40" rows={6} />
        </label>
        <button type="submit" className="public-btn">
          {t("contactSend")}
        </button>
      </form>
    </PublicMain>
  );
}
