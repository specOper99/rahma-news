"use client";

import { useTranslations } from "next-intl";
import { subscribeNewsletter } from "@/server/actions/public";
import { Icon } from "@/components/ui/Icon";

export function NewsletterForm({ locale }: { locale: string }) {
  const t = useTranslations("Newsletter");
  const tHome = useTranslations("Home");
  return (
    <div className="no-print space-y-3 rounded-md border border-border-muted bg-surface-container-high/60 p-5 shadow-[0_1px_2px_rgba(11,19,32,0.03)]">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-secondary">
          <Icon name="shield" size={18} />
          <span className="font-mono-num text-xs font-bold uppercase">{t("privacyNote")}</span>
        </div>
        <h2 className="font-display text-lg font-bold text-primary">{tHome("newsletterTitle")}</h2>
        <p className="text-xs leading-relaxed text-on-surface-variant">{t("blurb")}</p>
      </div>
      <form className="space-y-2" action={subscribeNewsletter}>
        <input type="hidden" name="locale" value={locale} />
        <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
        <label className="sr-only" htmlFor="herald-subscriber-email">
          {t("email")}
        </label>
        <input
          id="herald-subscriber-email"
          type="email"
          name="email"
          required
          placeholder={t("email")}
          className="w-full rounded border border-border-muted bg-surface-container-lowest px-3 py-2 font-mono-num text-xs text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
        />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 rounded bg-primary py-2 text-xs font-bold text-on-primary shadow-sm transition-colors hover:bg-secondary"
        >
          {t("submit")}
        </button>
      </form>
    </div>
  );
}
