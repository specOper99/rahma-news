import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function Pagination({
  page,
  hasNext,
  basePath,
}: {
  page: number;
  hasNext: boolean;
  basePath: string;
}) {
  const t = await getTranslations("Listing");
  const sep = basePath.includes("?") ? "&" : "?";
  return (
    <nav className="mt-8 flex items-center gap-4 font-ui text-sm">
      {page > 1 ? (
        <Link
          href={`${basePath}${sep}page=${page - 1}`}
          className="rounded border border-border-muted bg-surface-container-lowest px-3 py-2 hover:bg-surface-container"
        >
          {t("prev")}
        </Link>
      ) : null}
      <span className="font-mono-num text-on-surface-variant">{t("page", { n: page })}</span>
      {hasNext ? (
        <Link
          href={`${basePath}${sep}page=${page + 1}`}
          className="rounded border border-border-muted bg-surface-container-lowest px-3 py-2 hover:bg-surface-container"
        >
          {t("next")}
        </Link>
      ) : null}
    </nav>
  );
}
