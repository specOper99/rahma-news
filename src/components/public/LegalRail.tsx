import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function LegalRail() {
  const t = await getTranslations("Home");
  const tF = await getTranslations("Footer");
  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-md border border-border-muted bg-surface-container-lowest p-4 text-xs text-on-surface-variant">
        <p className="font-ui text-xs font-bold uppercase tracking-wider text-secondary">{t("charter")}</p>
        <p className="leading-relaxed">{t("charterBody")}</p>
      </div>
      <div className="rounded-md bg-primary p-5 text-on-primary">
        <p className="font-display text-lg font-bold text-white">{t("tipTitle")}</p>
        <p className="mt-2 text-xs leading-relaxed text-on-primary-container">{t("tipBody")}</p>
        <Link
          href="/contact"
          className="mt-4 flex w-full items-center justify-center rounded bg-secondary py-2 text-xs font-bold text-white"
        >
          {t("tipCta")}
        </Link>
      </div>
      <p className="font-mono-num text-[11px] text-outline">
        {tF("noAds")} · {tF("noPaywall")} · {tF("noTracking")}
      </p>
    </div>
  );
}
