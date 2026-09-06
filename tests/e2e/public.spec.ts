import { test, expect } from "@playwright/test";

test("home redirects from slash to a locale prefix", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.url()).toMatch(/\/(en|ar|ckb)\/?$/);
});

test("english home has dir ltr", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("arabic home has dir rtl and arabic chrome", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("body")).toContainText("هيرالد");
});

test("kurdish home has dir rtl and sorani chrome", async ({ page }) => {
  await page.goto("/ckb");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ckb");
  await expect(page.locator("body")).toContainText("هێراڵد");
});

test("story A is on all three homes", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("body")).toContainText("Baghdad heat");
  await page.goto("/ar");
  await expect(page.locator("body")).toContainText("حر بغداد");
  await page.goto("/ckb");
  await expect(page.locator("body")).toContainText("گەرمای بەغدا");
});

test("story E is only on english latest", async ({ page }) => {
  await page.goto("/en/latest");
  await expect(page.locator("body")).toContainText("three languages");
  await page.goto("/ar/latest");
  await expect(page.locator("body")).not.toContainText("three languages");
});

test("story C is absent from english latest", async ({ page }) => {
  await page.goto("/en/latest");
  await expect(page.locator("body")).not.toContainText("دبلوماسية");
});

test("article A html contains h1", async ({ page }) => {
  await page.goto("/en/article/baghdad-heat-and-the-power-grid");
  await expect(page.locator("h1")).toContainText("Baghdad heat");
  const html = await page.content();
  expect(html).toContain("NewsArticle");
});

test("article A metadata includes ku-Arab not ckb hreflang", async ({ page }) => {
  await page.goto("/en/article/baghdad-heat-and-the-power-grid");
  const html = await page.content();
  expect(html).toContain("hreflang=\"ku-Arab\"");
  expect(html).not.toContain("hreflang=\"ckb\"");
});

test("language switcher on story A goes to sibling slug", async ({ page }) => {
  await page.goto("/en/article/baghdad-heat-and-the-power-grid");
  await page.getByRole("link", { name: "العربية" }).click();
  await expect(page).toHaveURL(/\/ar\/article\//);
});

test("search for Baghdad finds story A in en", async ({ page }) => {
  await page.goto("/en/search?q=Baghdad");
  await expect(page.locator("body")).toContainText("Baghdad heat");
});

test("rss en contains story A title", async ({ request }) => {
  const res = await request.get("/en/rss.xml");
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain("Baghdad heat");
});

test("robots disallows admin", async ({ request }) => {
  const res = await request.get("/robots.txt");
  const body = await res.text();
  expect(body).toContain("Disallow: /admin");
});

test("sitemap index lists three locale sitemaps", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  const body = await res.text();
  expect(body).toContain("/sitemaps/en.xml");
  expect(body).toContain("/sitemaps/ar.xml");
  expect(body).toContain("/sitemaps/ckb.xml");
});

test("ckb sitemap contains ku-Arab and not hreflang ckb", async ({ request }) => {
  const res = await request.get("/sitemaps/ckb.xml");
  const body = await res.text();
  expect(body).toContain("ku-Arab");
  expect(body).not.toContain('hreflang="ckb"');
});
