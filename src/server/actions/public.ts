"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { contactMessages, newsletterSubscribers } from "@/db/schema";
import { newId } from "@/lib/ids";
import { isLocale, type Locale } from "@/lib/locales";
import { incrementView } from "@/server/dal/articles";
import { rateLimit } from "@/server/rate-limit";

function ipKey(prefix: string) {
  return async () => {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    return `${prefix}:${ip}`;
  };
}

export async function subscribeNewsletter(formData: FormData) {
  const localeRaw = String(formData.get("locale") ?? "ar");
  const locale = isLocale(localeRaw) ? localeRaw : "ar";
  if (String(formData.get("website") ?? "")) {
    redirect(`/${locale}/newsletter/thanks`);
  }
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) {
    redirect(`/${locale}`);
  }
  const key = await ipKey("nl")();
  if (!rateLimit(key, 8, 60 * 60 * 1000)) {
    redirect(`/${locale}`);
  }
  await db
    .insert(newsletterSubscribers)
    .values({ id: newId(), email, locale })
    .onConflictDoNothing();
  redirect(`/${locale}/newsletter/thanks`);
}

export async function submitContact(formData: FormData) {
  const localeRaw = String(formData.get("locale") ?? "ar");
  const locale = isLocale(localeRaw) ? localeRaw : "ar";
  if (String(formData.get("website") ?? "")) {
    redirect(`/${locale}/contact?sent=1`);
  }
  const name = String(formData.get("name") ?? "").slice(0, 80);
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").slice(0, 2000);
  if (name.length < 1 || message.length < 10 || !email.includes("@")) {
    redirect(`/${locale}/contact?err=1`);
  }
  const key = await ipKey("contact")();
  if (!rateLimit(key, 5, 60 * 60 * 1000)) {
    redirect(`/${locale}/contact?err=1`);
  }
  await db.insert(contactMessages).values({
    id: newId(),
    locale,
    name,
    email,
    message,
  });
  redirect(`/${locale}/contact?sent=1`);
}

export async function recordView(articleId: string, locale: Locale) {
  await incrementView(articleId, locale);
}

export async function assertLoginRate(email: string): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return rateLimit(`login:${ip}:${email}`, 5, 15 * 60 * 1000);
}

export async function logoutAction() {
  const { headers } = await import("next/headers");
  const { auth } = await import("@/auth");
  await auth.api.signOut({ headers: await headers() });
  redirect("/admin/login");
}
