import { test, expect } from "@playwright/test";

test("public masthead is Herald with theme toggle", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("banner").getByRole("link", { name: "Herald" }).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Rahma");
  const toggle = page.getByRole("button", { name: "Color theme" }).first();
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const theme = await page.evaluate(() => localStorage.getItem("theme"));
  expect(theme).toBe("dark");
});

test("mobile header uses a drawer instead of crowding links", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("navigation", { name: "Menu" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Menu" }).getByRole("link", { name: "Latest" })).toBeVisible();
});

test("admin login chrome switches to Arabic and Kurdish", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "العربية" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("button", { name: "تسجيل الدخول" })).toBeVisible();
  await page.getByRole("button", { name: "کوردی سۆرانی" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ckb");
  await expect(page.getByRole("button", { name: "چوونەژوورەوە" })).toBeVisible();
});

test("admin dashboard shows desk metrics", async ({ page }) => {
  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill(process.env.ADMIN_EMAIL ?? "owner@rahma.local");
  await page.locator('input[name="password"]').fill(process.env.ADMIN_PASSWORD ?? "RahmaOwner10");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
  await expect(page.getByRole("heading", { name: "Editorial Desk" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Draft/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Desk queue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "New story" }).first()).toBeVisible();
});
