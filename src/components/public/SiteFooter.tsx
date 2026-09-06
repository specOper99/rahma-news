import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Lettermark } from "@/components/public/Lettermark";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/locales";
import { BRAND } from "@/lib/brand";

export async function SiteFooter({
  locale,
  siteName,
  blurb,
  categories,
}: {
  locale: Locale;
  siteName?: string;
  blurb?: string;
  categories: { id: string; slug: string; name: string }[];
}) {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");
  const year = new Date().getFullYear();
  const wordmark = siteName ?? BRAND.names[locale];
  return (
    <footer className="mt-12 w-full border-t border-border-muted bg-surface-container-low py-10 text-on-surface-variant">
      <div className="mx-auto max-w-[90rem] space-y-8 px-4 sm:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <Lettermark locale={locale} name={wordmark} size="sm" />
              <span className="font-display text-2xl font-extrabold text-primary">{wordmark}</span>
            </div>
            {blurb ? <p className="max-w-lg text-xs leading-relaxed">{blurb}</p> : null}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono-num text-[11px]">
              <span className="rounded border border-border-muted bg-surface-container px-2 py-0.5 text-primary">
                {t("noAds")}
              </span>
              <span className="rounded border border-border-muted bg-surface-container px-2 py-0.5 text-primary">
                {t("noPaywall")}
              </span>
              <span className="rounded border border-border-muted bg-surface-container px-2 py-0.5 text-primary">
                {t("noTracking")}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-base font-bold text-primary">{t("sections")}</h2>
            <ul className="space-y-1.5 text-xs">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.slug}`} className="transition-colors hover:text-secondary">
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/latest" className="transition-colors hover:text-secondary">
                  {tNav("latest")}
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-base font-bold text-primary">{t("newsroom")}</h2>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/about" className="transition-colors hover:text-secondary">
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-secondary">
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-base font-bold text-primary">{t("transparency")}</h2>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/privacy" className="transition-colors hover:text-secondary">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-secondary">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <a href={`/${locale}/rss.xml`} className="inline-flex items-center gap-1 transition-colors hover:text-secondary">
                  <Icon name="stream" size={13} />
                  {t("rss")}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border-muted/80 pt-6 text-xs font-mono-num text-outline md:flex-row">
          <p className="font-ui font-semibold text-on-surface">{t("copyright", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
