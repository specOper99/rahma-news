import { getTranslations } from "next-intl/server";
import { formatClock, formatMastheadDate } from "@/lib/format";
import type { Locale } from "@/lib/locales";

export async function BureauClocks({ locale }: { locale: Locale }) {
  const t = await getTranslations("Nav");
  const now = new Date();
  const desks = [
    { id: "baghdad", label: t("baghdad"), tz: "Asia/Baghdad", offset: "UTC+3" },
    { id: "erbil", label: t("erbil"), tz: "Asia/Baghdad", offset: "UTC+3" },
    { id: "london", label: t("london"), tz: "Europe/London", offset: "UTC+0" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-num text-[12px] text-on-surface-variant">
      <span className="inline-flex items-center gap-1.5 font-ui font-semibold text-on-surface">
        <span className="size-1.5 rounded-full bg-live" />
        {t("bureauTimes")}
      </span>
      {desks.map((d) => (
        <span key={d.id} className="inline-flex items-center gap-1">
          <strong className="font-ui text-on-surface">{d.label}</strong>
          <span suppressHydrationWarning>{formatClock(now, d.tz)}</span>
          <span className="text-[10px] text-outline">{d.offset}</span>
        </span>
      ))}
      <span className="hidden font-ui text-on-surface-variant xl:inline" suppressHydrationWarning>
        {formatMastheadDate(locale, now)}
      </span>
    </div>
  );
}
