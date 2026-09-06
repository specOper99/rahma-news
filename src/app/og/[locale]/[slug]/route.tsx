import { ImageResponse } from "next/og";
import { isLocale } from "@/lib/locales";
import { getPublishedEditionBySlug } from "@/server/dal/articles";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await ctx.params;
  if (!isLocale(locale)) {
    return new Response("not found", { status: 404 });
  }
  const row = await getPublishedEditionBySlug(locale, slug);
  if (!row?.isLive) {
    return new Response("not found", { status: 404 });
  }
  const dek = row.edition.dek.slice(0, 180);
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "#f9f9ff",
          color: "#0b1320",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 48,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
              background: "#0b1320",
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            H
          </div>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#0051d5" }}>
            Herald
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 54, lineHeight: 1.12, fontWeight: 600 }}>
          {row.edition.title}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#454f60" }}>{dek}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
