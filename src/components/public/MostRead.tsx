import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";
import type { CardStory } from "@/server/dal/articles";

export async function MostRead({ items }: { items: CardStory[] }) {
  const t = await getTranslations("Home");
  if (items.length === 0) return null;
  return (
    <div className="space-y-3 rounded-md border border-border-muted bg-surface-container-lowest p-5 shadow-[0_1px_2px_rgba(11,19,32,0.03)]">
      <div className="flex items-center justify-between border-b border-border-muted pb-2">
        <div className="flex items-center gap-2">
          <Icon name="stream" size={18} className="text-secondary" />
          <h2 className="font-display text-lg font-bold text-primary">{t("mostRead")}</h2>
        </div>
        <span className="font-mono-num text-xs text-outline">{t("last48h")}</span>
      </div>
      <ol className="divide-y divide-border-muted/50 font-ui">
        {items.map((s, i) => (
          <li key={s.articleId} className="flex items-start gap-3 pt-2 first:pt-0">
            <span className="w-5 shrink-0 text-center font-display text-2xl font-bold text-secondary">
              {i + 1}
            </span>
            <div className="min-w-0 space-y-0.5">
              <Link
                href={`/article/${s.slug}`}
                className="block text-xs font-bold leading-snug text-primary hover:text-secondary"
              >
                {s.title}
              </Link>
              <span className="font-mono-num text-[11px] text-outline">
                {s.categoryName}
                {s.viewCount ? ` · ${s.viewCount}` : ""}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
