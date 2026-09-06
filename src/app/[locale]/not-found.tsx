import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("Errors");
  return (
    <main id="main" className="mx-auto max-w-[90rem] px-4 py-16 sm:px-8">
      <header className="mb-8 flex items-end gap-3 border-b-2 border-primary pb-2.5">
        <span className="h-7 w-3.5 rounded-sm bg-primary" />
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-wider text-secondary">{t("kicker")}</p>
          <h1 className="font-display text-4xl font-bold text-primary">{t("notFound")}</h1>
        </div>
      </header>
      <p className="font-ui">
        <Link href="/" className="font-semibold text-secondary hover:underline">
          {t("backHome")}
        </Link>
      </p>
    </main>
  );
}
