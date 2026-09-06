import { NextResponse } from "next/server";
import { LOCALES } from "@/lib/locales";
import { siteUrl } from "@/lib/seo";

export async function GET() {
  const origin = siteUrl();
  const maps = LOCALES.map(
    (l) => `<sitemap><loc>${origin}/sitemaps/${l}.xml</loc></sitemap>`,
  ).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${maps}</sitemapindex>`;
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
