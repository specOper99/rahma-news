import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";
import { formatStoryTime } from "@/lib/format";
import type { CardStory } from "@/server/dal/articles";
import type { Locale } from "@/lib/locales";

export async function BreakingBar({
  items,
  locale,
}: {
  items: CardStory[];
  locale: Locale;
}) {
  if (items.length === 0) return null;
  const t = await getTranslations("Home");
  const tA = await getTranslations("A11y");
  const lead = items[0];
  return (
    <section
      className="no-print w-full border-b border-error/30 bg-error text-on-error shadow-sm"
      aria-label={tA("breaking")}
    >
      <div className="mx-auto flex max-w-[90rem] flex-col items-stretch justify-between gap-3 px-4 py-2 sm:px-8 md:flex-row md:items-center">
        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded bg-surface-container-lowest px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-error shadow-sm">
            <span className="size-2 animate-ping rounded-full bg-error" />
            {t("breaking")}
            {items.length > 1 ? ` · ${items.length}` : null}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-x-6 gap-y-1 lg:flex-row lg:items-center">
            {items.map((s) => (
              <div key={s.articleId} className="flex min-w-0 items-center gap-2">
                <span className="size-1.5 shrink-0 rounded-full bg-on-error" />
                <Link
                  href={`/article/${s.slug}`}
                  className="truncate text-sm font-bold text-on-error hover:underline sm:text-[15px]"
                >
                  {s.title}
                </Link>
                {s.publishedAt ? (
                  <span className="hidden shrink-0 font-mono-num text-xs opacity-80 sm:inline">
                    {formatStoryTime(locale, s.publishedAt)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <Link
          href={`/article/${lead.slug}`}
          className="inline-flex shrink-0 items-center gap-1 rounded bg-on-error/15 px-2.5 py-1 text-xs font-semibold text-on-error transition-colors hover:bg-on-error/25"
        >
          {t("liveCoverage")}
          <Icon name="arrow" size={14} />
        </Link>
      </div>
    </section>
  );
}
