"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Icon } from "@/components/ui/Icon";
import { Lettermark } from "@/components/public/Lettermark";
import { sectionDot } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import type { Locale } from "@/lib/locales";

type Cat = { id: string; slug: string; name: string };
type Tag = { id: string; slug: string; name: string };

export function SiteHeader({
  locale,
  categories,
  tags,
  siteName,
  tagline,
  languageSwitcher,
  clocks,
}: {
  locale: Locale;
  categories: Cat[];
  tags: Tag[];
  siteName?: string;
  tagline?: string;
  languageSwitcher: ReactNode;
  clocks: ReactNode;
}) {
  const t = useTranslations("Nav");
  const tA = useTranslations("A11y");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wordmark = siteName ?? BRAND.names[locale];
  const latin = locale === "en";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-muted bg-surface/98 shadow-[0_1px_6px_rgba(11,19,32,0.04)] backdrop-blur-md">
      <div className="border-b border-border-muted/60 bg-surface-container-low/60 px-4 py-1.5 sm:px-8">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-3">
          {clocks}
          <div className="flex items-center gap-3">
            {languageSwitcher}
            <div className="hidden h-4 w-px bg-border-muted sm:block" />
            <a
              href={`/${locale}/contact`}
              className="hidden items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-secondary hover:text-tigris-blue md:inline-flex"
            >
              <Icon name="lock" size={14} />
              {t("tips")}
            </a>
            <a
              href="/admin/login"
              className="inline-flex items-center gap-1 rounded border border-border-muted/80 bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-on-surface transition-colors duration-150 hover:bg-surface-container-high"
            >
              <Icon name="staff" size={14} />
              {t("staff")}
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-6 px-4 py-3.5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <Lettermark locale={locale} name={wordmark} />
          <span className="flex flex-col">
            <span className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold leading-none tracking-tight text-primary sm:text-4xl">
                {wordmark}
              </span>
              {latin ? null : (
                <span className="font-mono-num text-xs font-bold uppercase tracking-widest text-secondary">
                  HERALD
                </span>
              )}
            </span>
            {tagline ? (
              <span className="text-[11px] font-medium tracking-wide text-on-surface-variant">
                {tagline}
              </span>
            ) : null}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <form action={`/${locale}/search`} className="relative hidden w-48 md:block md:w-64" role="search">
            <label className="sr-only" htmlFor="masthead-search">
              {tA("search")}
            </label>
            <input
              id="masthead-search"
              name="q"
              type="search"
              placeholder={t("searchPlaceholder")}
              className="w-full rounded border border-border-muted bg-surface-container-low py-1.5 pe-3 ps-8 text-xs text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            />
            <span className="pointer-events-none absolute start-2 top-1.5 text-outline">
              <Icon name="search" size={16} />
            </span>
          </form>
          <ThemeToggle label={t("theme")} />
          <Link
            href="/search"
            aria-label={tA("search")}
            className="grid size-11 place-items-center text-on-surface md:hidden"
          >
            <Icon name="search" />
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center text-on-surface lg:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? t("close") : t("menu")}</span>
            <Icon name={open ? "close" : "menu"} size={20} />
          </button>
        </div>
      </div>

      <div className="border-t border-border-muted bg-surface-container-lowest px-4 sm:px-8">
        <div className="mx-auto flex max-w-[90rem] flex-col justify-between gap-2 py-1 md:flex-row md:items-center">
          <nav
            aria-label={t("sections")}
            className="hidden items-center gap-6 overflow-x-auto py-1 text-sm font-semibold lg:flex"
          >
            <Link
              href="/"
              className="whitespace-nowrap border-b-2 border-primary pb-1 font-bold text-primary"
            >
              {t("home")}
            </Link>
            {categories.map((c, i) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="flex items-center gap-1.5 whitespace-nowrap pb-1 text-on-surface-variant transition-colors duration-150 hover:text-secondary"
              >
                <span className={`size-2 rounded-full ${sectionDot(i)}`} />
                {c.name}
              </Link>
            ))}
            <Link
              href="/latest"
              className="flex items-center gap-1 whitespace-nowrap pb-1 font-medium text-secondary hover:text-tigris-blue"
            >
              <Icon name="stream" size={16} />
              {t("latest")}
            </Link>
          </nav>
          {tags.length > 0 ? (
            <div className="hidden items-center gap-2 overflow-hidden font-mono-num text-[11px] text-on-surface-variant lg:flex">
              <span className="shrink-0 font-ui font-bold text-outline">{t("tagsRibbon")}</span>
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="whitespace-nowrap rounded-full bg-surface-container px-2 py-0.5 text-primary transition-colors duration-150 hover:bg-surface-container-high hover:text-secondary"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[40] lg:hidden" id={panelId}>
          <button
            type="button"
            className="absolute inset-0 bg-primary/40"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          />
          <nav
            aria-label={t("menu")}
            className="absolute inset-y-0 end-0 flex w-[min(20rem,88vw)] flex-col gap-1 overflow-y-auto border-s border-border-muted bg-surface px-4 py-6 font-ui shadow-[0_0_40px_hsl(216_48%_8%/0.12)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium">{t("menu")}</p>
              <button type="button" className="grid size-11 place-items-center" onClick={() => setOpen(false)}>
                <span className="sr-only">{t("close")}</span>
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="mb-4">{languageSwitcher}</div>
            <Link href="/" className="py-2" onClick={() => setOpen(false)}>
              {t("home")}
            </Link>
            <Link href="/latest" className="py-2" onClick={() => setOpen(false)}>
              {t("latest")}
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="py-2"
                onClick={() => setOpen(false)}
              >
                {c.name}
              </Link>
            ))}
            <Link href="/contact" className="py-2" onClick={() => setOpen(false)}>
              {t("tips")}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
