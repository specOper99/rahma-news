import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

test("login fails with wrong password and stays on login", async ({ page }) => {
  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill("nobody@rahma.local");
  await page.locator('input[name="password"]').fill("wrong-password-here");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.locator("body")).toContainText("Invalid email or password");
});

test("owner login reaches dashboard", async ({ page }) => {
  await signIn(
    page,
    process.env.ADMIN_EMAIL ?? "owner@rahma.local",
    process.env.ADMIN_PASSWORD ?? "RahmaOwner10",
  );
  await expect(page.locator("body")).toContainText("Editorial Desk");
});

test("unauthenticated admin articles redirects to login", async ({ page }) => {
  await page.goto("/admin/articles");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("author cannot see published status control", async ({ page }) => {
  await signIn(
    page,
    process.env.AUTHOR_EMAIL ?? "author@rahma.local",
    process.env.AUTHOR_PASSWORD ?? "RahmaAuthor10",
  );
  await page.goto("/admin/articles");
  const first = page.locator("table a").first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(page.locator("body")).toContainText("Authors cannot publish");
});

test("editor publishes a new en edition and public page shows it", async ({ page }) => {
  const slug = `editor-test-story-${Date.now()}`;
  await signIn(
    page,
    process.env.EDITOR_EMAIL ?? "editor@rahma.local",
    process.env.EDITOR_PASSWORD ?? "RahmaEditor10",
  );
  await page.getByRole("button", { name: "New story" }).first().click();
  await expect(page).toHaveURL(/\/admin\/articles\//);
  await expect(page.locator(".file-dropzone")).toBeVisible();
  await expect(page.locator('input[name="heroFile"]')).toHaveCount(1);
  await expect(page.locator('select[name="heroMediaId"]')).toHaveCount(0);
  await page.locator('input[name="title"]').fill("Editor test story");
  await page.locator('input[name="slug"]').fill(slug);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator('input[name="slug"]')).toHaveValue(slug);
  await page.getByRole("button", { name: "published" }).click();
  await expect(page.locator("[data-edition-status='published']")).toBeVisible();
  await page.goto(`/en/article/${slug}`);
  await expect(page.locator("h1")).toContainText("Editor test story");
});

test("signup route is 404", async ({ page }) => {
  const res = await page.goto("/admin/register");
  expect(res?.status()).toBeGreaterThanOrEqual(400);
});
