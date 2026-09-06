import type { Locale } from "@/lib/locales";

export function Lettermark({
  locale,
  name,
  size = "md",
}: {
  locale: Locale;
  name: string;
  size?: "sm" | "md";
}) {
  const glyph = locale === "en" ? "H" : Array.from(name)[0] || "ه";
  const box = size === "sm" ? "size-8 text-xl" : "size-10 text-2xl";
  return (
    <div
      className={`grid ${box} shrink-0 place-items-center rounded bg-primary text-on-primary shadow-sm`}
    >
      <span className="font-display font-bold leading-none tracking-tighter">{glyph}</span>
    </div>
  );
}
